import {createServer} from 'node:http';
import {database,transaction} from '../src/server/db/index.mjs';
import {applyMigrations} from '../src/server/db/migrations.mjs';
import {safeDatabaseDiagnostic} from '../src/server/db/diagnostics.mjs';
import {createTelegramApi} from '../src/server/telegram/api.mjs';
import {parseAllowedUserIds} from '../src/server/telegram/access.mjs';
import {pause,retry,poll,deliver} from '../src/server/telegram/polling.mjs';
const stop=new AbortController();
let health,source,status='starting',shutdownTimer;
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{
 if(stop.signal.aborted)return;
 console.log('Bot worker shutting down.');status='stopping';stop.abort();
 shutdownTimer=setTimeout(()=>process.exit(1),25000);shutdownTimer.unref();
});
try{
 const api=createTelegramApi(process.env.TELEGRAM_BOT_TOKEN);
 const allowedIds=parseAllowedUserIds(process.env.TELEGRAM_ALLOWED_USER_IDS||'');
 if(!allowedIds.size)throw new Error('Missing whitelist');
 const site=new URL(process.env.PUBLIC_SITE_URL);
 if(site.protocol!=='https:'||site.username||site.password)throw new Error('Invalid site URL');
 source=database();
 // Health listener only. No webhook, admin data or public domain needed.
 health=createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');
  res.writeHead(req.url==='/healthz'?200:404,{'Content-Type':'application/json'});
  res.end(JSON.stringify({status}));
 });
 health.on('error',()=>{console.error('Worker health listener failed.');process.exitCode=1;stop.abort();});
 health.listen(3000,'0.0.0.0');
 await retry(async()=>{
  let context={stage:'connection'};
  try{
   await source.query('SELECT 1');
   await transaction(client=>applyMigrations(client,undefined,next=>{context=next;}),source);
   console.log('Database connection established. Migrations completed.');
  }catch(error){console.error('Worker database: '+JSON.stringify(safeDatabaseDiagnostic(error,context)));throw new Error('Database unavailable');}
 },{signal:stop.signal,stage:'database initialization'});
 const me=await retry(async()=>{
  const identity=await api('getMe',{},stop.signal);
  if(identity?.username?.toLowerCase()!=='amwed_bot'||!Number.isSafeInteger(identity.id))throw new Error('Bot identity mismatch');
  return identity;
 },{signal:stop.signal,stage:'token validation'});
 while(!stop.signal.aborted){
  let leader;
  const session=new AbortController(),signal=AbortSignal.any([stop.signal,session.signal]);
  const lost=()=>session.abort();
  try{
   leader=await source.connect();leader.on('error',lost);
   const locked=(await leader.query('SELECT pg_try_advisory_lock($1,$2) AS acquired',[17072027,2])).rows[0].acquired;
   if(!locked){status='standby';await pause(3000,signal);continue;}
   await leader.query('INSERT INTO telegram_polling_state(bot_id) VALUES($1) ON CONFLICT DO NOTHING',[me.id]);
   await retry(()=>api('deleteWebhook',{drop_pending_updates:false},signal),{signal,stage:'disable legacy webhook'});
   if(signal.aborted)continue;
   status='polling';console.log('Production bot polling started. Mini App: '+site.hostname+'/telegram');
   const heartbeat=async()=>{
    while(!signal.aborted){await pause(3000,signal);if(signal.aborted)break;try{await leader.query('SELECT 1');}catch{session.abort();}}
   };
   const tasks=[poll({source,botId:me.id,api,allowedIds,signal}),deliver({source,api,allowedIds,signal}),heartbeat()];
   await Promise.all(tasks.map(task=>task.catch(()=>session.abort())));
  }catch{if(!stop.signal.aborted)console.error('Worker database leadership unavailable; reconnecting.');}
  finally{session.abort();if(leader){leader.removeListener('error',lost);leader.release(true);}}
  status='reconnecting';await pause(3000,stop.signal);
 }
}catch{console.error('Production bot startup failed. Check database, token, whitelist and HTTPS PUBLIC_SITE_URL. Sensitive details hidden.');process.exitCode=1;}
finally{
 stop.abort();health?.close();
 try{if(source)await source.end();}catch{process.exitCode=1;}
 clearTimeout(shutdownTimer);
}
