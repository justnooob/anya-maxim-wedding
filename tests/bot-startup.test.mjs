import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createStartupDiagnostics,startupFailure} from '../src/server/telegram/startup-diagnostics.mjs';
import {retry} from '../src/server/telegram/polling.mjs';

test('startup results identify each stage and only count whitelist users',async()=>{
 const logs=[];
 const startup=createStartupDiagnostics({log:line=>logs.push(line)});
 const stages=[['APP_ROLE','APP_ROLE ok'],['DATABASE_URL','DATABASE_URL present'],
  ['TELEGRAM_BOT_TOKEN','TELEGRAM_BOT_TOKEN present'],['whitelist',ids=>'whitelist parsed, '+ids.size+' users'],
  ['PUBLIC_SITE_URL','PUBLIC_SITE_URL valid HTTPS'],['database initialization','database migrations ok'],
  ['Telegram getMe','Telegram getMe ok'],['webhook cleanup','webhook disabled']];
 for(const [stage,message] of stages)await startup.check(stage,message,()=>new Set(['123','456']));
 assert.equal(logs.length,8);
 assert.ok(logs.includes('Bot startup: whitelist parsed, 2 users'));
 assert.equal(startup.stage,'webhook cleanup');
 assert.doesNotMatch(logs.join('\n'),/123|456/);
 await assert.rejects(startup.check('PUBLIC_SITE_URL','not printed',()=>{throw new Error('secret');}));
 assert.equal(startup.stage,'PUBLIC_SITE_URL');
 assert.doesNotMatch(logs.join('\n'),/not printed/);
});

test('startup failures never serialize arbitrary errors, URLs, IDs or credentials',()=>{
 const privateText='private-password initData user=123456 https://host/path?secret=private-value';
 const error=Object.assign(new Error(privateText),{description:privateText,token:privateText,code:401});
 for(const stage of ['APP_ROLE','DATABASE_URL','TELEGRAM_BOT_TOKEN','whitelist','PUBLIC_SITE_URL','health listener','Telegram getMe','webhook cleanup']){
  const output=startupFailure(stage,error);
  assert.match(output,/Bot startup failed at:/);
  assert.doesNotMatch(output,/private-password|initData|123456|https:|private-value/);
 }
 assert.match(startupFailure('Telegram getMe',error),/unauthorized; Telegram code: 401/);
 assert.match(startupFailure('Telegram getMe',new Error('Bot identity mismatch')),/unexpected bot identity/);
 assert.match(startupFailure('webhook cleanup',error),/webhook cleanup failed/);
 const db=startupFailure('database initialization',Object.assign(new Error(privateText),{code:'28P01'}),{stage:'applying migration',filename:'008_guest_updates.sql'});
 assert.match(db,/applying migration/);assert.match(db,/28P01/);assert.match(db,/008_guest_updates.sql/);
 assert.doesNotMatch(db,/private-password|initData|123456|https:/);
});

test('getMe and webhook retry diagnostics retain recovery behavior',async()=>{
 for(const stage of ['Telegram getMe','webhook cleanup']){
  const reports=[];let attempts=0;
  const startup=createStartupDiagnostics({report:line=>reports.push(line)});
  const result=await retry(async()=>{
   if(++attempts===1)throw Object.assign(new Error('secret'),{code:401});
   return true;
  },{signal:new AbortController().signal,stage,wait:async()=>{},report:(next,error)=>startup.failure(next,error)});
  assert.equal(result,true);assert.equal(attempts,2);assert.equal(reports.length,1);
  assert.match(reports[0],new RegExp('Bot startup failed at: '+stage));
  assert.doesNotMatch(reports[0],/secret/);
 }
});

test('real worker preflight failures produce safe stage-specific production logs',()=>{
 const token=[123456,'synthetic'.repeat(4)].join(':');
 const testDatabaseUrl='postgresql://127.0.0.1:1/test';
 const base={...process.env,APP_ROLE:'bot',DATABASE_URL:testDatabaseUrl,
  TELEGRAM_BOT_TOKEN:token,TELEGRAM_ALLOWED_USER_IDS:'123,456',PUBLIC_SITE_URL:'https://example.test'};
 const cases=[['APP_ROLE',{APP_ROLE:'invalid-private-role'}],['DATABASE_URL',{DATABASE_URL:''}],
  ['TELEGRAM_BOT_TOKEN',{TELEGRAM_BOT_TOKEN:'private-invalid-token'}],['whitelist',{TELEGRAM_ALLOWED_USER_IDS:'private-invalid-id'}],
  ['whitelist',{TELEGRAM_ALLOWED_USER_IDS:''}],['PUBLIC_SITE_URL',{PUBLIC_SITE_URL:'https://private-user:private-password@example.test'}]];
 for(const [stage,env] of cases){
  // Invalid config exits before any connection/API requests. No env file is loaded.
  const result=spawnSync(process.execPath,['scripts/telegram-production.mjs'],{env:{...base,...env},encoding:'utf8',timeout:10000});
  assert.equal(result.status,1,result.error?.message);
  const output=result.stdout+result.stderr;
  assert.match(output,new RegExp('Bot startup failed at: '+stage));
  assert.doesNotMatch(output,/private-invalid|private-password|private-user|123,456|postgresql:\/\//);
  assert.ok(!output.includes(token));
 }
});
