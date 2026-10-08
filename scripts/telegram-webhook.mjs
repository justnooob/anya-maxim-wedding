import {registerWebhook} from '../src/server/telegram/register-webhook.mjs';
try{
  await registerWebhook();
  console.log('Webhook registered for @amwed_bot. Secrets hidden.');
}catch{console.error('Webhook registration failed. Check HTTPS site URL, token and webhook secret. Sensitive details hidden.');process.exitCode=1;}
