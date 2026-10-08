import {rsvpDetailText} from '../rsvp/detail.mjs';
import {randomBytes,randomUUID} from 'node:crypto';
import {privateSender,assertTelegramAdmin} from './access.mjs';
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
const button=(text,data)=>({text,callback_data:data});
const menu={inline_keyboard:[[button('Статистика','stats'),button('Все ответы','list:all:0')],[button('Придут','list:yes:0'),button('Не придут','list:no:0')],[button('Трансфер','list:transfer:0'),button('Ночёвка','list:overnight:0')]]};
export function updateSender(update){
  if(update?.message)return privateSender(update.message);
  const callback=update?.callback_query;
  if(!callback||typeof callback.id!=='string'||typeof callback.data!=='string')return null;
  return privateSender({from:callback.from,chat:callback.message?.chat});
}
export async function adminReply(client,userId,command){
  const keyboard=menu.inline_keyboard.map(row=>[...row]);
  try{const site=new URL(process.env.PUBLIC_SITE_URL);if(site.protocol==='https:'&&!site.username&&!site.password)keyboard.unshift([{text:'Открыть список гостей',web_app:{url:new URL('/telegram',site).href}}]);}catch{/* No public HTTPS URL configured. */}
  const currentMenu={inline_keyboard:keyboard};
  if(command==='stats'||command==='/stats'){
    const result=await client.query("SELECT count(*)::int total,count(*) FILTER(WHERE attendance='yes')::int yes,count(*) FILTER(WHERE attendance='no')::int no,count(*) FILTER(WHERE transfer='needed')::int transfer,count(*) FILTER(WHERE overnight='stay')::int overnight FROM rsvps");
    const s=result.rows[0];return {text:'Ответов: '+s.total+'\nПридут: '+s.yes+'\nНе придут: '+s.no+'\nНужен трансфер: '+s.transfer+'\nОстанутся на ночь: '+s.overnight,reply_markup:currentMenu};
  }
  const list=command.match(/^(?:list:|\/list(?:\s+|$))(all|yes|no|transfer|overnight)?(?::|\s+)?(\d+)?$/);
  if(list){
    const filter=list[1]||'all',offset=Number(list[2]||0);if(!Number.isSafeInteger(offset)||offset>10000)return {text:'Некорректная страница.'};
    const predicates={all:'TRUE',yes:"attendance='yes'",no:"attendance='no'",transfer:"transfer='needed'",overnight:"overnight='stay'"};
    const rows=(await client.query('SELECT id,guest_name,attendance FROM rsvps WHERE '+predicates[filter]+' ORDER BY created_at,id LIMIT 9 OFFSET $1',[offset])).rows;
    const shown=rows.slice(0,8),keyboard=shown.map(row=>[button(row.guest_name.slice(0,60),'guest:'+row.id)]);
    const navigation=[];if(offset>0)navigation.push(button('Назад','list:'+filter+':'+Math.max(0,offset-8)));if(rows.length>8)navigation.push(button('Дальше','list:'+filter+':'+(offset+8)));
    if(navigation.length)keyboard.push(navigation);keyboard.push([button('Меню','menu')]);
    return {text:shown.length?shown.map((row,index)=>(offset+index+1)+'. '+row.guest_name+' ('+(row.attendance==='yes'?'придёт':'не придёт')+')').join('\n'):'Пока нет ответов.',reply_markup:{inline_keyboard:keyboard}};
  }
  const guest=command.match(/^(?:guest:|\/guest\s+)(.+)$/);
  if(guest&&uuid(guest[1])){
    const row=(await client.query('SELECT * FROM rsvps WHERE id=$1',[guest[1]])).rows[0];
    if(!row)return {text:'Ответ уже удалён.',reply_markup:currentMenu};
    const text=rsvpDetailText(row);
    return {text,reply_markup:{inline_keyboard:[[button('Удалить ответ','delete:'+row.id)],[button('Меню','menu')]]}};
  }
  const deletion=command.match(/^(?:delete:|\/delete\s+)(.+)$/);
  if(deletion&&uuid(deletion[1])){
    const row=(await client.query('SELECT id,guest_name FROM rsvps WHERE id=$1',[deletion[1]])).rows[0];
    if(!row)return {text:'Ответ уже удалён.',reply_markup:currentMenu};
    const token=randomBytes(16).toString('hex');
    await client.query("INSERT INTO delete_confirmations(token,rsvp_id,user_id,expires_at) VALUES($1,$2,$3,now()+interval '5 minutes')",[token,row.id,userId]);
    return {text:'Удалить ответ «'+row.guest_name+'»? После удаления гость сможет заполнить форму снова. Подтверждение действует 5 минут.',reply_markup:{inline_keyboard:[[button('Да, удалить','confirm:'+token),button('Отмена','cancel:'+token)]]}};
  }
  const confirmation=command.match(/^(confirm|cancel):([a-f0-9]{32})$/);
  if(confirmation){
    const token=confirmation[2];
    const pending=(await client.query('SELECT rsvp_id FROM delete_confirmations WHERE token=$1 AND user_id=$2 AND expires_at>now()',[token,userId])).rows[0];
    if(!pending)return {text:'Подтверждение истекло или уже использовано.',reply_markup:currentMenu};
    if(confirmation[1]==='cancel'){await client.query('DELETE FROM delete_confirmations WHERE token=$1 AND user_id=$2',[token,userId]);return {text:'Удаление отменено.',reply_markup:currentMenu};}
    const row=(await client.query('SELECT session_id FROM rsvps WHERE id=$1',[pending.rsvp_id])).rows[0];
    if(row)await client.query('SELECT id FROM guest_sessions WHERE id=$1 FOR UPDATE',[row.session_id]);
    // Atomic consumption: another organizer/update cannot reuse this confirmation.
    const consumed=await client.query('DELETE FROM delete_confirmations WHERE token=$1 AND user_id=$2 AND expires_at>now() RETURNING rsvp_id',[token,userId]);
    if(!consumed.rows.length)return {text:'Подтверждение уже использовано.',reply_markup:currentMenu};
    await client.query('DELETE FROM rsvps WHERE id=$1',[pending.rsvp_id]);
    return {text:'Ответ удалён. Гость может снова заполнить форму.',reply_markup:currentMenu};
  }
  return {text:'Доступ организатора подтверждён.\nОткрой Mini App кнопкой ниже: там список гостей, ответы и удаление.\n/stats: быстрая статистика.',reply_markup:currentMenu};
}
export async function handleAdminUpdate(client,update,allowedIds){
  const userId=updateSender(update);
  if(!userId)return;
  if(!allowedIds.has(userId))throw new Error('Admin access denied');
  const message=update.message||{from:update.callback_query.from,chat:update.callback_query.message.chat};
  assertTelegramAdmin(message,allowedIds);
  if(!Number.isSafeInteger(update.update_id)||update.update_id<0)return;
  const claimed=await client.query('INSERT INTO telegram_updates(id) VALUES($1) ON CONFLICT DO NOTHING RETURNING id',[update.update_id]);
  if(!claimed.rows.length)return;
  const command=update.callback_query?.data||update.message?.text?.trim()||'/start';
  const payload=await adminReply(client,userId,command);
  await client.query('INSERT INTO telegram_outbox(id,recipient,payload) VALUES($1,$2,$3)',[randomUUID(),userId,JSON.stringify(payload)]);
}
