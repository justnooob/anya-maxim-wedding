import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {acceptUpdate,poll,retry,pause} from '../src/server/telegram/polling.mjs';
import {drainOutbox} from '../src/server/telegram/outbox.mjs';
import {createTelegramApi} from '../src/server/telegram/api.mjs';
const update=(id,user=123)=>({update_id:id,message:{text:'/start',from:{id:user,is_bot:false},chat:{id:user,type:'private'}}});
test('polling commits offset and admin reply atomically, deduplicates restart and skips outsiders',async()=>{
 const db=new PGlite();
 const query=async(sql,args)=>args?db.query(sql,args):(await db.exec(sql)).at(-1);
 const source={query,async connect(){return {query,release(){}};}};
 const previous=process.env.PUBLIC_SITE_URL;process.env.PUBLIC_SITE_URL='https://example.com';
 try{
  await db.exec(fs.readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort().map(n=>fs.readFileSync('migrations/'+n,'utf8')).join('\n'));
  await db.query('INSERT INTO telegram_polling_state(bot_id) VALUES(1)');
  const allowedIds=new Set(['123','456']);
  await acceptUpdate(source,1,update(10),allowedIds);
  await acceptUpdate(source,1,update(10),allowedIds);
  assert.equal((await db.query('SELECT count(*)::int n FROM telegram_outbox')).rows[0].n,1);
  const payload=(await db.query('SELECT payload FROM telegram_outbox')).rows[0].payload;
  assert.equal(payload.reply_markup.inline_keyboard[0][0].web_app.url,'https://example.com/telegram');
  await acceptUpdate(source,1,update(11,999),allowedIds);
  assert.equal(Number((await db.query('SELECT next_offset FROM telegram_polling_state')).rows[0].next_offset),12);
  assert.equal((await db.query('SELECT count(*)::int n FROM telegram_outbox')).rows[0].n,1);
  const broken={async connect(){return {query:async(sql,args)=>{if(sql.startsWith('UPDATE telegram_polling_state'))throw new Error('Interrupted transaction');return query(sql,args);},release(){}};}};
  await assert.rejects(acceptUpdate(broken,1,update(12,456),allowedIds));
  assert.equal((await db.query('SELECT count(*)::int n FROM telegram_outbox')).rows[0].n,1);
  assert.equal(Number((await db.query('SELECT next_offset FROM telegram_polling_state')).rows[0].next_offset),12);
  await acceptUpdate(source,1,update(12,456),allowedIds);
  const delivered=[];await drainOutbox({source,allowedIds,api:async(method,payload)=>delivered.push({method,payload})});
  assert.deepEqual(delivered.map(x=>x.payload.chat_id).sort(),['123','456']);
  assert.equal((await db.query('SELECT count(*)::int n FROM telegram_outbox')).rows[0].n,0);
  const controller=new AbortController();let called=false;
  await poll({source,botId:1,allowedIds,signal:controller.signal,api:async(method,params,signal)=>{
   called=true;assert.equal(method,'getUpdates');assert.equal(params.offset,13);assert.equal(params.timeout,20);
   controller.abort();assert.ok(signal.aborted);return [];
  }});assert.ok(called);
 }finally{if(previous===undefined)delete process.env.PUBLIC_SITE_URL;else process.env.PUBLIC_SITE_URL=previous;await db.close();}
});
test('temporary errors back off and recover; shutdown interrupts retry waits',async()=>{
 const controller=new AbortController();let attempts=0;const waits=[];
 const value=await retry(async()=>{if(++attempts<3)throw new Error('private error');return 'recovered';},{signal:controller.signal,stage:'test',report(){},wait:async ms=>waits.push(ms)});
 assert.equal(value,'recovered');assert.equal(attempts,3);assert.ok(waits[1]>waits[0]);
 const pending=retry(async()=>{throw new Error('temporary');},{signal:controller.signal,stage:'test',report(){},wait:async(ms,signal)=>{controller.abort();await pause(ms,signal);}});
 await pending;assert.ok(controller.signal.aborted);
});
test('deleteWebhook uses outgoing API and retains pending updates',async()=>{
 const token=[123456,'synthetic'.repeat(4)].join(':');let called=false;
 const api=createTelegramApi(token,async(url,request)=>{
  called=true;assert.ok(url.endsWith('/deleteWebhook'));assert.deepEqual(JSON.parse(request.body),{drop_pending_updates:false});
  return {ok:true,json:async()=>({ok:true,result:true})};
 });
 assert.equal(await api('deleteWebhook',{drop_pending_updates:false}),true);assert.ok(called);
});
test('deployment isolates the worker and retires webhook receiver',()=>{
 const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
 assert.equal(pkg.scripts['telegram:production'],'node scripts/telegram-production.mjs');
 assert.doesNotMatch(fs.readFileSync('src/instrumentation.ts','utf8'),/startOutboxWorker/);
 assert.match(fs.readFileSync('src/app/api/telegram/webhook/route.ts','utf8'),/status: 410/);
 assert.doesNotMatch(fs.readFileSync('scripts/telegram-production.mjs','utf8'),/TELEGRAM_WEBHOOK_SECRET/);
});
