import {sanitizeTelegramDescription} from './diagnostics.mjs';
// The token is confined to this server-side closure. Never log requests or raw errors.
if (typeof window !== 'undefined') throw new Error('Telegram API is server-only');
export class TelegramApiError extends Error {
  constructor(code,details={}) { super('Telegram API request failed'); this.code = Number.isInteger(code) ? code : 0; Object.assign(this,details); }
}
export function createTelegramApi(token, fetchImpl = fetch, {diagnostics=false,secrets=[]}={}) {
  if (typeof token !== 'string' || !/^\d{5,20}:[A-Za-z0-9_-]{20,}$/.test(token))
    throw new Error('TELEGRAM_BOT_TOKEN is missing or invalid');
  const permitted = new Set(['getMe', 'getWebhookInfo', 'getUpdates', 'sendMessage', 'answerCallbackQuery', 'setWebhook', 'deleteWebhook']);
  return async function request(method, params = {}, signal) {
    if (!permitted.has(method)) throw new TelegramApiError(0);
    try {
      const response = await fetchImpl('https://api.telegram.org/bot' + token + '/' + method, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(params), signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000),
        redirect: 'error',
      });
      let body;
      try{body=await response.json();}
      catch{throw new TelegramApiError(0,diagnostics?{httpStatus:response.status,phase:'response parsing',description:'Telegram response is not valid JSON.'}:{});}
      if (!response.ok || body?.ok !== true) throw new TelegramApiError(body?.error_code || response.status,diagnostics?{httpStatus:response.status,errorCode:Number.isInteger(body?.error_code)?body.error_code:undefined,description:sanitizeTelegramDescription(body?.description,[token,...secrets])}:{});
      return body.result;
    } catch (error) {
      // Do not attach cause, response bodies, URLs, descriptions or the original stack.
      throw new TelegramApiError(error instanceof TelegramApiError ? error.code : 0,diagnostics&&error instanceof TelegramApiError?{httpStatus:error.httpStatus,errorCode:error.errorCode,description:error.description,phase:error.phase}:{});
    }
  };
}
