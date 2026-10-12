import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';
import {miniAppUser,miniAppRequest} from '../src/server/telegram/mini-app.mjs';
const env={TELEGRAM_BOT_TOKEN:[123456,'synthetic'.repeat(4)].join(':'),TELEGRAM_ALLOWED_USER_IDS:'123,456'};
function signed(id=123,date=Math.floor(Date.now()/1000)){
 const data=new URLSearchParams({auth_date:String(date),user:JSON.stringify({id,first_name:'Test'}),query_id:'test'});
 const check=[...data.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,value])=>key+'='+value).join('\n');
 const key=createHmac('sha256','WebAppData').update(env.TELEGRAM_BOT_TOKEN).digest();data.set('hash',createHmac('sha256',key).update(check).digest('hex'));return data.toString();
}
test('Mini App authorization verifies signature, time and whitelist',()=>{
 assert.equal(miniAppUser(signed(),env),'123');assert.equal(miniAppUser(signed(456),env),'456');
 for(const raw of ['',signed(789),signed(123,1),signed(123,Math.floor(Date.now()/1000)+100),signed()+'&user=bad',signed().replace('Test','Forged')])assert.throws(()=>miniAppUser(raw,env));
});
test('Mini App rejects unsigned requests before accessing PostgreSQL',async()=>{
 const result=await miniAppRequest(new Request('https://example.com/api/telegram/mini-app'),{env,source:{connect(){assert.fail('Database must not be accessed');}}});assert.equal(result.status,403);
});
test('Mini App shows music without sessions and binds deletion confirmation to organizer',async()=>{
 const db=new PGlite();let tail=Promise.resolve();
 const source={async connect(){const before=tail;let unlock;tail=new Promise(resolve=>{unlock=resolve;});await before;return {query:async(sql,args)=>args?db.query(sql,args):(await db.exec(sql)).at(-1),release:unlock};}};
 try{
 await db.exec(fs.readdirSync('migrations').filter(name=>name.endsWith('.sql')).sort().map(name=>fs.readFileSync('migrations/'+name,'utf8')).join('\n'));
 const id='00000000-0000-4000-8000-000000000001';
 await db.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",['a'.repeat(64)]);
 await db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance,who,transfer,overnight,dress_code,alcohol_drinks,soft_drinks,music_request) VALUES($1,$2,'Гость','yes','Друг','self','leave',true,ARRAY['none'],ARRAY['cola'],'ABBA')",[id,'a'.repeat(64)]);
 const request=(body,user=123,path='')=>new Request('https://example.com/api/telegram/mini-app'+path,{method:body?'POST':'GET',headers:{'x-telegram-init-data':signed(user),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const list=await (await miniAppRequest(request(),{env,source})).json();assert.equal(list.guests[0].status,'GOING');assert.ok(list.guests[0].fields.some(field=>field.label==='Музыка'&&field.value==='ABBA'));assert.ok(!JSON.stringify(list).includes('session_id'));
 const detail=await (await miniAppRequest(request(null,123,'?id='+id),{env,source})).json();assert.equal(detail.guest.fields[0].value,'Гость');
 const cancelled=await (await miniAppRequest(request({action:'delete',id}),{env,source})).json();
 await miniAppRequest(request({action:'cancel',token:cancelled.confirmation}),{env,source});
 await miniAppRequest(request({action:'confirm',token:cancelled.confirmation}),{env,source});assert.equal((await db.query('SELECT count(*)::int count FROM rsvps')).rows[0].count,1);
 const confirmation=await (await miniAppRequest(request({action:'delete',id}),{env,source})).json();assert.ok(confirmation.confirmation);
 await miniAppRequest(request({action:'confirm',token:confirmation.confirmation},456),{env,source});assert.equal((await db.query('SELECT count(*)::int count FROM rsvps')).rows[0].count,1);
 await miniAppRequest(request({action:'confirm',token:confirmation.confirmation}),{env,source});assert.equal((await db.query('SELECT count(*)::int count FROM rsvps')).rows[0].count,0);
 assert.equal((await db.query('SELECT count(*)::int count FROM guest_sessions')).rows[0].count,1);
 await miniAppRequest(request({action:'confirm',token:confirmation.confirmation}),{env,source});
 assert.equal((await miniAppRequest(request(null,123,'?id='+id),{env,source})).status,404);
 const after=await (await miniAppRequest(request(),{env,source})).json();assert.equal(after.stats.total,0);assert.deepEqual(after.guests,[]);
 }finally{await db.close();}
});

test('Mini App station statistics, exact filters and legacy answers without overnight UI',async()=>{
 const db=new PGlite();const source={async connect(){return {query:(sql,args)=>db.query(sql,args),release(){}};}};
 try{
 await db.exec(fs.readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort().map(n=>fs.readFileSync('migrations/'+n,'utf8')).join('\n'));
 const sid='b'.repeat(64);await db.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[sid]);
 for(const [i,transfer] of ['self','kupchino','pavlovsk','needed'].entries())await db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance,who,transfer,overnight,dress_code,alcohol_drinks,soft_drinks) VALUES($1,$2,'Гость Иванов','yes','Друг',$3,'stay',true,ARRAY['none'],ARRAY['none'])",['00000000-0000-4000-8000-00000000000'+i,sid,transfer]);
 const get=async(filter)=>await (await miniAppRequest(new Request('https://example.com/api/telegram/mini-app?filter='+filter,{headers:{'x-telegram-init-data':signed()}}),{env,source})).json();
 const all=await get('all');assert.equal(all.stats.transfer,3);assert.equal(all.stats.kupchino,1);assert.equal(all.stats.pavlovsk,1);assert.ok(!('overnight' in all.stats));
 assert.equal((await get('transfer')).guests.length,3);
 for(const filter of ['kupchino','pavlovsk']){const result=await get(filter);assert.equal(result.guests.length,1);assert.match(result.guests[0].fields.find(f=>f.label==='Трансфер').value,filter==='kupchino'?/Купчино/:/Павловска/);}
 assert.ok(all.guests.every(g=>!g.fields.some(f=>f.label==='Ночёвка')));
 assert.equal((await miniAppRequest(new Request('https://example.com/api/telegram/mini-app?filter=overnight',{headers:{'x-telegram-init-data':signed()}}),{env,source})).status,400);
 }finally{await db.close();}
});
