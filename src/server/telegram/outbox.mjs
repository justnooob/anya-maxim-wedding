import {transaction} from '../db/index.mjs';
import {createTelegramApi} from './api.mjs';
import {parseAllowedUserIds} from './access.mjs';
export function notificationText(row){
  return 'Новый ответ от гостя "'+row.guest_name+'"';
}
export function notificationPayload(row,siteUrl=process.env.PUBLIC_SITE_URL){
  const site=new URL(siteUrl);
  if(site.protocol!=='https:'||site.username||site.password)throw new Error('Mini App requires HTTPS site URL');
  return {text:notificationText(row),reply_markup:{inline_keyboard:[[{text:'Открыть',web_app:{url:new URL('/telegram',site).href}}]]}};
}
export async function drainOutbox({source,api,allowedIds,signal,siteUrl}={}){
  const allowed=allowedIds||parseAllowedUserIds(process.env.TELEGRAM_ALLOWED_USER_IDS||'');
  const request=api||createTelegramApi(process.env.TELEGRAM_BOT_TOKEN);
  for(let index=0;index<10&&!signal?.aborted;index++){
    const found=await transaction(async client=>{
      const job=(await client.query('SELECT * FROM telegram_outbox WHERE available_at<=now() ORDER BY available_at,created_at FOR UPDATE SKIP LOCKED LIMIT 1')).rows[0];
      if(!job)return false;
      if(!allowed.has(job.recipient)){await client.query('DELETE FROM telegram_outbox WHERE id=$1',[job.id]);return true;}
      let payload=job.payload;
      if(payload.notification){
        const row=(await client.query('SELECT * FROM rsvps WHERE id=$1',[job.rsvp_id])).rows[0];
        if(!row){await client.query('DELETE FROM telegram_outbox WHERE id=$1',[job.id]);return true;}
        payload=notificationPayload(row,siteUrl);
      }
      try{
        await request('sendMessage',{...payload,chat_id:job.recipient,protect_content:true},signal);
        await client.query('DELETE FROM telegram_outbox WHERE id=$1',[job.id]);
      }catch{
        if(signal?.aborted)throw new Error('Delivery interrupted');
        const delay=Math.min(3600,30*2**Math.min(job.attempts,7));
        await client.query("UPDATE telegram_outbox SET attempts=attempts+1,available_at=now()+($2 * interval '1 second') WHERE id=$1",[job.id,delay]);
        console.error('Telegram delivery deferred. Sensitive details hidden.');
      }
      return true;
    },source);
    if(!found)break;
  }
}
