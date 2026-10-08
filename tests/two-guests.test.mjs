import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {getRsvp,postRsvp} from '../src/server/rsvp/http.mjs';
import {cookieName} from '../src/server/rsvp/session.mjs';
import {adminReply} from '../src/server/telegram/admin.mjs';
import {transaction} from '../src/server/db/index.mjs';
import {renderRsvp} from './helpers/render-rsvp.mjs';
test('one cookie allows two active guests, deduplicates retries, rejects third, reopens capacity on admin deletion and isolates sessions',async()=>{
 const db=new PGlite();let tail=Promise.resolve();const source={async connect(){const prior=tail;let unlock;tail=new Promise(r=>unlock=r);await prior;return {query:async(sql,args)=>{const r=await db.query(sql,args);return {...r,rowCount:r.affectedRows};},release:unlock};}};
 const oldSite=process.env.PUBLIC_SITE_URL;process.env.PUBLIC_SITE_URL='http://localhost:3000';
 try{
 await db.exec(fs.readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort().map(n=>fs.readFileSync('migrations/'+n,'utf8')).join('\n'));
 async function session(cookie){const response=await getRsvp(new Request('http://localhost:3000/api/rsvp',{headers:cookie?{cookie}: {}}),source);assert.equal(response.status,200);return {cookie:response.headers.get('set-cookie')?.split(';')[0]||cookie,...await response.json()};}
 const first=await session();assert.equal(first.remaining,2);
 const post=(s,key,name='Гость')=>postRsvp(new Request('http://localhost:3000/api/rsvp',{method:'POST',headers:{origin:'http://localhost:3000',cookie:s.cookie,'x-csrf-token':s.csrf,'content-type':'application/json'},body:JSON.stringify({guestName:name,attendance:'no',submissionKey:key})}),source);
 const key=randomUUID();const concurrent=await Promise.all([post(first,key,'Первый'),post(first,key,'Повтор')]);assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,201]);assert.equal((await session(first.cookie)).rsvps.length,1);
 const second=await post(first,randomUUID(),'Второй');assert.equal(second.status,201);const two=(await second.json()).rsvps;assert.equal(two.length,2);
 assert.equal((await post(first,randomUUID(),'Третий')).status,409);assert.equal((await post(first,key)).status,200);
 const other=await session();assert.equal((await post(other,randomUUID(),'Другая сессия')).status,201);assert.equal((await session(other.cookie)).remaining,1);
 async function remove(id){const reply=await transaction(client=>adminReply(client,'123','delete:'+id),source);await transaction(client=>adminReply(client,'123',reply.reply_markup.inline_keyboard[0][0].callback_data),source);}
 await remove(two[0].id);assert.equal((await session(first.cookie)).remaining,1);
 assert.equal((await post(first,randomUUID(),'Замена')).status,201);assert.equal((await post(first,randomUUID())).status,409);
 for(const row of (await session(first.cookie)).rsvps)await remove(row.id);
 assert.equal((await session(first.cookie)).remaining,2);assert.equal((await post(first,randomUUID())).status,201);assert.equal((await post(first,randomUUID())).status,201);assert.equal((await post(first,randomUUID())).status,409);
 for(const cookie of [cookieName+'=corrupt',cookieName+'='+'b'.repeat(64)]){const restored=await session(cookie);assert.equal(restored.remaining,2);assert.deepEqual(restored.rsvps,[]);}
 assert.equal((await session(other.cookie)).rsvps[0].guestName,'Другая сессия');
 const full=(await session(first.cookie)).rsvps;
 const sid=(await db.query('SELECT session_id FROM rsvps WHERE id=$1',[full[0].id])).rows[0].session_id;
 await assert.rejects(db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance) VALUES($1,$2,'Bypass','no')",[randomUUID(),sid]),error=>error.code==='23514');
 }finally{if(oldSite===undefined)delete process.env.PUBLIC_SITE_URL;else process.env.PUBLIC_SITE_URL=oldSite;await db.close();}
});
test('two-guest success shows both names and cannot expose an add-third action',()=>{
 const html=renderRsvp({saved:[{id:'one',guestName:'Первый',attendance:'yes'},{id:'two',guestName:'Второй',attendance:'no'}]});assert.match(html,/Первый/);assert.match(html,/Второй/);assert.doesNotMatch(html,/Добавить второго гостя|<form|Обновить статус ответа/);
});
