export function sanitizeTelegramDescription(value,secrets=[]){
  if(typeof value!=='string')return 'Telegram did not provide a description.';
  let text=value;
  for(const secret of secrets.filter(value=>typeof value==='string'&&value.length)){
    for(const variant of new Set([secret,encodeURIComponent(secret)]))text=text.split(variant).join('[secret hidden]');
  }
  return text.replace(/https?:\/\/[^\s"'<>]+/gi,'[URL hidden]').replace(/\d{5,20}:[A-Za-z0-9_-]{20,}/g,'[token hidden]').replace(/[\x00-\x1f\x7f]/g,' ').slice(0,800);
}
export function safeWebhookDiagnostic(error,context={},secrets=[]){
  const stage=error?.phase==='response parsing'?'response parsing':context.stage||'token validation';
  const description=error?.description||({
    'Configuration':'PUBLIC_SITE_URL must use HTTPS without credentials; TELEGRAM_WEBHOOK_SECRET must contain 32–256 permitted characters.',
    'Invalid URL':'PUBLIC_SITE_URL is missing or invalid.',
    'Unexpected bot':'Token belongs to a different bot; expected @amwed_bot.',
    'TELEGRAM_BOT_TOKEN is missing or invalid':'TELEGRAM_BOT_TOKEN is missing or has an invalid format.',
  }[error?.message])||'Request failed without a readable Telegram API response (network, TLS or timeout).';
  return {stage,http_status:Number.isInteger(error?.httpStatus)?error.httpStatus:null,error_code:Number.isInteger(error?.errorCode)?error.errorCode:null,
    description:sanitizeTelegramDescription(description,secrets),hostname:sanitizeTelegramDescription(context.hostname||'unavailable',secrets),pathname:sanitizeTelegramDescription(context.pathname||'/api/telegram/webhook',secrets)};
}
