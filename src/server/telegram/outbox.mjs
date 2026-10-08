import {describeDrinks} from '../../content/drinks.mjs';
import {transaction} from '../db/index.mjs';
import {createTelegramApi} from './api.mjs';
import {parseAllowedUserIds} from './access.mjs';
export function notificationText(row){
  return 'Новый RSVP\n'+row.guest_name+'\n'+(row.attendance==='yes'?'Придёт':'Не придёт')+
    (row.attendance==='yes'?'\nКто: '+(row.who||'Не указано')+'\nПитание: '+(row.food||'Без особенностей')+'\nАлкоголь: '+describeDrinks('alcohol',row.alcohol_drinks,row.alcohol_other)+'\nБезалкогольное: '+describeDrinks('soft',row.soft_drinks,row.soft_other)+'\nТрансфер: '+(row.transfer==='needed'?'Нужен':'Доедет самостоятельно')+'\nНочёвка: '+(row.overnight==='stay'?'Останется':'Уедет'):'');
}
export async function drainOutbox({source,api,allowedIds}={}){
  const allowed=allowedIds||parseAllowedUserIds(process.env.TELEGRAM_ALLOWED_USER_IDS||'');
  const request=api||createTelegramApi(process.env.TELEGRAM_BOT_TOKEN);
  for(let index=0;index<10;index++){
    const found=await transaction(async client=>{
      const job=(await client.query('SELECT * FROM telegram_outbox WHERE available_at<=now() ORDER BY available_at,created_at FOR UPDATE SKIP LOCKED LIMIT 1')).rows[0];
      if(!job)return false;
      if(!allowed.has(job.recipient)){await client.query('DELETE FROM telegram_outbox WHERE id=$1',[job.id]);return true;}
      let payload=job.payload;
      if(payload.notification){
        const row=(await client.query('SELECT * FROM rsvps WHERE id=$1',[job.rsvp_id])).rows[0];
        if(!row){await client.query('DELETE FROM telegram_outbox WHERE id=$1',[job.id]);return true;}
        payload={text:notificationText(row),reply_markup:{inline_keyboard:[[{text:'Подробнее',callback_data:'guest:'+row.id}]]}};
      }
      try{
        await request('sendMessage',{...payload,chat_id:job.recipient,protect_content:true});
        await client.query('DELETE FROM telegram_outbox WHERE id=$1',[job.id]);
      }catch{
        const delay=Math.min(3600,30*2**Math.min(job.attempts,7));
        await client.query("UPDATE telegram_outbox SET attempts=attempts+1,available_at=now()+($2 * interval '1 second') WHERE id=$1",[job.id,delay]);
        console.error('Telegram delivery deferred. Sensitive details hidden.');
      }
      return true;
    },source);
    if(!found)break;
  }
}
let busy=false;
export function startOutboxWorker(){
  if(globalThis.__weddingOutboxTimer||!process.env.DATABASE_URL||!process.env.TELEGRAM_BOT_TOKEN)return;
  const timer=setInterval(async()=>{
    if(busy)return;busy=true;
    try{await drainOutbox();}catch{console.error('Notification worker unavailable. Sensitive details hidden.');}finally{busy=false;}
  },10000);timer.unref();globalThis.__weddingOutboxTimer=timer;
}
