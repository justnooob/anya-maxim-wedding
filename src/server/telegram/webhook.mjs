import {equalSecret,limitedJson} from '../rsvp/session.mjs';
import {parseAllowedUserIds} from './access.mjs';
import {updateSender,handleAdminUpdate} from './admin.mjs';
import {transaction} from '../db/index.mjs';
import {createTelegramApi} from './api.mjs';
export async function webhook(request){
  const secret=process.env.TELEGRAM_WEBHOOK_SECRET;
  if(!secret||!/^[A-Za-z0-9_-]{32,256}$/.test(secret))return new Response(null,{status:503});
  if(!equalSecret(request.headers.get('x-telegram-bot-api-secret-token'),secret))return new Response(null,{status:403});
  let update;
  try{update=await limitedJson(request,16384);}catch{return new Response(null,{status:400});}
  const userId=updateSender(update);
  if(!userId)return Response.json({ok:true});
  try{
    const allowed=parseAllowedUserIds(process.env.TELEGRAM_ALLOWED_USER_IDS||'');
    const api=createTelegramApi(process.env.TELEGRAM_BOT_TOKEN);
    if(!allowed.has(userId)){
      // Diagnostic only, never query RSVP or issue callback/admin actions for strangers.
      if(update.message?.text?.trim()==='/start')await api('sendMessage',{chat_id:userId,text:'Доступ закрыт. Для настройки обратитесь к организатору.',protect_content:true});
      if(update.callback_query)await api('answerCallbackQuery',{callback_query_id:update.callback_query.id,text:'Доступ закрыт.'});
      return Response.json({ok:true});
    }
    await transaction(client=>handleAdminUpdate(client,update,allowed));
    if(update.callback_query){
      try{await api('answerCallbackQuery',{callback_query_id:update.callback_query.id});}catch{/* expired callback: admin result remains in durable outbox */}
    }
    return Response.json({ok:true});
  }catch{return new Response(null,{status:503});}
}
