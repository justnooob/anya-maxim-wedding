import {safeDatabaseDiagnostic} from '../db/diagnostics.mjs';

const reasons={
 'APP_ROLE':'APP_ROLE is invalid; use web or bot',
 ['DATABASE_URL']:'DATABASE_URL environment variable is missing',
 'TELEGRAM_BOT_TOKEN':'TELEGRAM_BOT_TOKEN environment variable is missing or invalid',
 'whitelist':'whitelist is empty/invalid; use comma-separated numeric user IDs',
 'PUBLIC_SITE_URL':'PUBLIC_SITE_URL is missing or invalid; HTTPS without credentials is required',
 'health listener':'worker health listener failed',
};
// Only fixed messages and controlled database diagnostics reach logs. Never serialize
// raw errors, env values, Telegram descriptions, identity objects or user IDs.
export function startupFailure(stage,error,context){
 if(stage==='database initialization'){
  const diagnostic=safeDatabaseDiagnostic(error,context);
  return 'Bot startup failed at: '+diagnostic.stage+'; '+JSON.stringify(diagnostic);
 }
 let reason=reasons[stage]||'startup operation failed; details hidden';
 if(stage==='Telegram getMe'||stage==='webhook cleanup'){
  const code=Number.isInteger(error?.code)&&error.code>=400&&error.code<=599?error.code:0;
  reason=stage==='Telegram getMe'
   ? (code===401?'Telegram getMe returned unauthorized':error?.message==='Bot identity mismatch'?'Telegram getMe returned an unexpected bot identity':'Telegram getMe failed (API/network error)')
   : 'webhook cleanup failed (API/network error)';
  if(code)reason+='; Telegram code: '+code;
 }
 return 'Bot startup failed at: '+stage+'; '+reason;
}

export function createStartupDiagnostics({log=console.log,report=console.error}={}){
 let stage='configuration';
 return {
  get stage(){return stage;},
  async check(next,success,work){
   stage=next;
   const value=await work();
   log('Bot startup: '+(typeof success==='function'?success(value):success));
   return value;
  },
  failure(next,error,context){report(startupFailure(next,error,context));},
 };
}
