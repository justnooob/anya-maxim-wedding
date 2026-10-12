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
import {validateRsvp,InputError} from '../src/server/rsvp/validation.mjs';
import {rsvpReady} from '../src/content/rsvp-limits.mjs';

test('unlimited session: 1, 2, 3, 5 answers, retry deduplication, deletion, restore and independent cookies',async()=>{
 const db=new PGlite();let tail=Promise.resolve();const source={async connect(){const prior=tail;let unlock;tail=new Promise(r=>unlock=r);await prior;return {query:async(sql,args)=>{const r=await db.query(sql,args);return {...r,rowCount:r.affectedRows};},release:unlock};}};
 const oldSite=process.env.PUBLIC_SITE_URL;process.env.PUBLIC_SITE_URL='http://localhost:3000';
 try{
 await db.exec(fs.readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort().map(n=>fs.readFileSync('migrations/'+n,'utf8')).join('\n'));
 async function session(cookie){const response=await getRsvp(new Request('http://localhost:3000/api/rsvp',{headers:cookie?{cookie}: {}}),source);assert.equal(response.status,200);return {cookie:response.headers.get('set-cookie')?.split(';')[0]||cookie,...await response.json()};}
 const first=await session();assert.ok(!('remaining' in first));
 const post=(s,key,name='Гость Иванов')=>postRsvp(new Request('http://localhost:3000/api/rsvp',{method:'POST',headers:{origin:'http://localhost:3000',cookie:s.cookie,'x-csrf-token':s.csrf,'content-type':'application/json'},body:JSON.stringify({guestName:name,attendance:'no',submissionKey:key})}),source);
 const key=randomUUID();const concurrent=await Promise.all([post(first,key),post(first,key)]);assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,201]);
 for(const count of [1,2,3,4,5]){if(count>1)assert.equal((await post(first,randomUUID())).status,201);assert.equal((await session(first.cookie)).rsvps.length,count);}
 assert.equal((await post(first,key)).status,200);assert.equal((await session(first.cookie)).rsvps.length,5);
 const other=await session();assert.equal((await post(other,randomUUID(),'Другой Гость')).status,201);
 const before=(await session(first.cookie)).rsvps;const removed=before[2];
 const confirm=await transaction(client=>adminReply(client,'123','delete:'+removed.id),source);await transaction(client=>adminReply(client,'123',confirm.reply_markup.inline_keyboard[0][0].callback_data),source);
 assert.deepEqual((await session(first.cookie)).rsvps.map(r=>r.id),before.filter(r=>r.id!==removed.id).map(r=>r.id));
 assert.equal((await post(first,randomUUID())).status,201);
 for(const row of (await session(first.cookie)).rsvps){const reply=await transaction(client=>adminReply(client,'123','delete:'+row.id),source);await transaction(client=>adminReply(client,'123',reply.reply_markup.inline_keyboard[0][0].callback_data),source);}
 assert.equal((await session(first.cookie)).rsvps.length,0);assert.equal((await post(first,randomUUID())).status,201);
 for(const cookie of [cookieName+'=corrupt',cookieName+'='+'b'.repeat(64)])assert.deepEqual((await session(cookie)).rsvps,[]);
 assert.equal((await session(other.cookie)).rsvps.length,1);
 }finally{if(oldSite===undefined)delete process.env.PUBLIC_SITE_URL;else process.env.PUBLIC_SITE_URL=oldSite;await db.close();}
});

test('compact success for ten guests always offers another clean submission',()=>{
 const html=renderRsvp({saved:Array.from({length:10},(_,i)=>({id:String(i),guestName:'Гость '+i,attendance:'no'}))});
 assert.match(html,/10 гостей/);assert.match(html,/Добавить ещё гостя/);assert.equal((html.match(/class="saved-guest"/g)||[]).length,1);assert.doesNotMatch(html,/<form|Обновить статус ответа/);
});

test('full names, optional overnight and all exact transfer values validate on both sides',()=>{
 const yes={guestName:'Анна Иванова',attendance:'yes',who:'Подруга',food:'',musicRequest:'',dressCode:true,alcoholDrinks:['none'],alcoholOther:'',softDrinks:['none'],softOther:''};
 for(const transfer of ['self','kupchino','pavlovsk']){assert.ok(rsvpReady({...yes,transfer}));assert.equal(validateRsvp({...yes,transfer}).transfer,transfer);assert.equal(validateRsvp({...yes,transfer}).overnight,null);}
 for(const transfer of ['needed','unknown',null])assert.throws(()=>validateRsvp({...yes,transfer}),InputError);
 for(const guestName of ['Анна Иванова','Анна-Мария Иванова',"Anne O'Connor",'Анна Мария Иванова']){assert.ok(rsvpReady({...yes,guestName,transfer:'self'}));assert.equal(validateRsvp({guestName,attendance:'no'}).guestName,guestName);}
 for(const guestName of ['Анна','  Анна  ','']){assert.equal(rsvpReady({...yes,guestName,transfer:'self'}),false);assert.throws(()=>validateRsvp({guestName,attendance:'no'}),InputError);}
});

test('migration 008 preserves legacy overnight, removes only capacity and retains unique submission key',async()=>{
 const db=new PGlite();try{
 const all=fs.readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort();await db.exec(all.filter(n=>!n.startsWith('008')).map(n=>fs.readFileSync('migrations/'+n,'utf8')).join('\n'));
 const sid='a'.repeat(64),id=randomUUID();await db.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[sid]);
 await db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance,who,transfer,overnight,dress_code,alcohol_drinks,soft_drinks) VALUES($1,$2,'Старый Гость','yes','Друг','needed','stay',true,ARRAY['none'],ARRAY['none'])",[id,sid]);
 await db.exec(fs.readFileSync('migrations/008_guest_updates.sql','utf8'));const old=(await db.query('SELECT * FROM rsvps WHERE id=$1',[id])).rows[0];assert.equal(old.overnight,'stay');assert.equal(old.transfer,'needed');
 for(const transfer of ['self','kupchino','pavlovsk'])await db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance,who,transfer,dress_code,alcohol_drinks,soft_drinks) VALUES($1,$2,'Новый Гость','yes','Друг',$3,true,ARRAY['none'],ARRAY['none'])",[randomUUID(),sid,transfer]);
 assert.equal((await db.query('SELECT count(*)::int n FROM rsvps')).rows[0].n,4);
 await assert.rejects(db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance,submission_key) VALUES($1,$2,'Дубликат Гость','no',$3)",[randomUUID(),sid,old.submission_key]),e=>e.code==='23505');
 }finally{await db.close();}
});
