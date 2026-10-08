import {createTelegramApi} from './api.mjs';
export async function registerWebhook(env=process.env,createApi=createTelegramApi){
  const site=new URL(env.PUBLIC_SITE_URL);
  const secret=env.TELEGRAM_WEBHOOK_SECRET;
  if(site.protocol!=='https:'||site.username||site.password||!/^[A-Za-z0-9_-]{32,256}$/.test(secret||''))throw new Error('Configuration');
  const api=createApi(env.TELEGRAM_BOT_TOKEN);
  const me=await api('getMe');
  if(me.username?.toLowerCase()!=='amwed_bot')throw new Error('Unexpected bot');
  await api('setWebhook',{url:new URL('/api/telegram/webhook',site).href,secret_token:secret,allowed_updates:['message','callback_query'],drop_pending_updates:false});
}
