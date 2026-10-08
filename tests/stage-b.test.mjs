import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import pg from 'pg';
import {randomBytes,randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {transaction} from '../src/server/db/index.mjs';
import {validateRsvp,InputError} from '../src/server/rsvp/validation.mjs';
import {newSession,hash,csrfFor,cookieHeader,cookieName,limitedJson} from '../src/server/rsvp/session.mjs';
import {activeSession,saveRsvp,ownRsvp,allowRate} from '../src/server/rsvp/repository.mjs';
import {adminReply,handleAdminUpdate,updateSender} from '../src/server/telegram/admin.mjs';
import {drinkChoices,toggleDrink,describeDrinks} from '../src/content/drinks.mjs';
import {drainOutbox,notificationText} from '../src/server/telegram/outbox.mjs';
import {getRsvp,postRsvp} from '../src/server/rsvp/http.mjs';
import {webhook} from '../src/server/telegram/webhook.mjs';
const yes={guestName:'Анна',attendance:'yes',who:'Подруга',food:'Орехи',transfer:'needed',overnight:'stay',dressCode:true,alcoholDrinks:['none'],softDrinks:['none']};
const no={guestName:'Максим',attendance:'no'};
async function fixture(){
  if(process.env.TEST_POSTGRES==='1'){
    const url=new URL(process.env.DATABASE_URL);
    if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||process.env.NODE_ENV==='production')throw new Error('Local test database required');
    const schema='test_'+randomBytes(12).toString('hex');
    const control=new pg.Pool({connectionString:process.env.DATABASE_URL,max:1});
    await control.query('CREATE SCHEMA '+schema);
    const source=new pg.Pool({connectionString:process.env.DATABASE_URL,max:5,options:'-c search_path='+schema+',public'});
    try{
      await source.query(fs.readdirSync('migrations').filter(name=>name.endsWith('.sql')).sort().map(name=>fs.readFileSync('migrations/'+name,'utf8')).join('\n'));
      const token=newSession();await source.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[hash(token)]);
      return {db:source,source,token,close:async()=>{await source.end();await control.query('DROP SCHEMA '+schema+' CASCADE');await control.end();}};
    }catch(error){await source.end();await control.query('DROP SCHEMA '+schema+' CASCADE');await control.end();throw error;}
  }
  const db=new PGlite();await db.exec(fs.readdirSync('migrations').filter(name=>name.endsWith('.sql')).sort().map(name=>fs.readFileSync('migrations/'+name,'utf8')).join('\n'));
  let tail=Promise.resolve();
  const source={async connect(){
    const previous=tail;let unlock;tail=new Promise(resolve=>{unlock=resolve;});await previous;
    return {query:async(sql,args)=>{const result=await db.query(sql,args);return {...result,rowCount:result.affectedRows};},release:()=>unlock()};
  }};
  const token=newSession();
  await db.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[hash(token)]);
  return {db,source,token,close:()=>db.close()};
}
test('server validation accepts both attendance paths; strips no-attendance details; rejects malformed input',()=>{
  assert.equal(validateRsvp(yes).transfer,'needed');
  assert.deepEqual(validateRsvp({...no,who:'ignored',food:'ignored',dressCode:true}).who,'');
  for(const input of [null,[],{}, {...yes,guestName:' '},{...yes,guestName:'x'.repeat(121)},{...yes,attendance:'maybe'},{...yes,dressCode:'true'},{...yes,transfer:'0'},{...yes,overnight:'other'},{...yes,food:'x'.repeat(601)},{...yes,who:'x\u0000'}])assert.throws(()=>validateRsvp(input),InputError);
});
test('opaque cookies carry no names; CSRF is separate and incoming body is bounded',async()=>{
  const token=newSession();assert.equal(token.length,64);assert.notEqual(hash(token),token);assert.notEqual(csrfFor(token),token);
  assert.match(cookieHeader(token),/HttpOnly; SameSite=Lax/);assert.doesNotMatch(cookieHeader(token),/Анна/);
  const request=new Request('http://localhost',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({value:'x'.repeat(9000)})});
  await assert.rejects(limitedJson(request));
});
test('PostgreSQL migration constraints, duplicate submission, outbox and revoked deletion session',async()=>{
  const f=await fixture();
  try{
    const create=()=>transaction(async client=>{
      const id=await activeSession(client,f.token);
      return saveRsvp(client,id,validateRsvp(yes),new Set(['123','456']));
    },f.source);
    const results=await Promise.all([create(),create()]);
    assert.equal(results.filter(result=>result.created).length,1);
    assert.equal((await f.db.query('SELECT count(*)::int n FROM rsvps')).rows[0].n,1);
    assert.equal((await f.db.query('SELECT count(*)::int n FROM telegram_outbox')).rows[0].n,2);
    const record=results[0].rsvp;
    await assert.rejects(f.db.query("UPDATE rsvps SET attendance='invalid' WHERE id=$1",[record.id]));
    await assert.rejects(f.db.query('UPDATE rsvps SET dress_code=false WHERE id=$1',[record.id]));
    const stats=await transaction(client=>adminReply(client,'123','/stats'),f.source);assert.match(stats.text,/Придут: 1/);
    const list=await transaction(client=>adminReply(client,'123','/list transfer'),f.source);assert.match(list.text,/Анна/);
    const detail=await transaction(client=>adminReply(client,'123','guest:'+record.id),f.source);assert.match(detail.text,/Орехи/);
    const confirm=await transaction(client=>adminReply(client,'123','delete:'+record.id),f.source);
    const command=confirm.reply_markup.inline_keyboard[0][0].callback_data;
    const denied=await transaction(client=>adminReply(client,'456',command),f.source);assert.match(denied.text,/истекло/);
    assert.equal((await f.db.query('SELECT count(*)::int n FROM rsvps')).rows[0].n,1);
    const deleted=await transaction(client=>adminReply(client,'123',command),f.source);assert.match(deleted.text,/удалён/);
    assert.equal((await f.db.query('SELECT count(*)::int n FROM telegram_outbox')).rows[0].n,0);
    assert.equal(await transaction(client=>ownRsvp(client,hash(f.token)),f.source),null);
    const replacement=await create();assert.equal(replacement.created,true);assert.notEqual(replacement.rsvp.id,record.id);
    await transaction(client=>adminReply(client,'123',command),f.source);
    assert.equal((await f.db.query('SELECT count(*)::int n FROM rsvps')).rows[0].n,1);
  }finally{await f.close();}
});
test('Telegram authorization, callbacks and duplicate updates are checked before admin effects',async()=>{
  const f=await fixture();try{
    const update={update_id:1,message:{from:{id:123,is_bot:false},chat:{id:123,type:'private'},text:'/stats'}};
    await assert.rejects(transaction(client=>handleAdminUpdate(client,update,new Set(['456'])),f.source));
    await transaction(client=>handleAdminUpdate(client,update,new Set(['123'])),f.source);
    await transaction(client=>handleAdminUpdate(client,update,new Set(['123'])),f.source);
    assert.equal((await f.db.query('SELECT count(*)::int n FROM telegram_outbox')).rows[0].n,1);
    assert.equal(updateSender({callback_query:{id:'id',data:'stats',from:{id:456,is_bot:false},message:{chat:{id:123,type:'private'}}}}),null);
    assert.equal(updateSender({callback_query:{id:'id',data:'stats',from:{id:123,is_bot:false},message:{chat:{id:123,type:'group'}}}}),null);
  }finally{await f.close();}
});
test('expired/cancelled confirmation cannot delete; missing row remains safe',async()=>{
  const f=await fixture();try{
    const result=await transaction(client=>saveRsvp(client,hash(f.token),validateRsvp(no),new Set()),f.source);
    const confirmation=await transaction(client=>adminReply(client,'123','delete:'+result.rsvp.id),f.source);
    const command=confirmation.reply_markup.inline_keyboard[0][0].callback_data;
    await f.db.query("UPDATE delete_confirmations SET expires_at=now()-interval '1 minute'");
    assert.match((await transaction(client=>adminReply(client,'123',command),f.source)).text,/истекло/);
    const fresh=await transaction(client=>adminReply(client,'123','delete:'+result.rsvp.id),f.source);
    const cancel=fresh.reply_markup.inline_keyboard[0][1].callback_data;
    await transaction(client=>adminReply(client,'123',cancel),f.source);
    assert.equal((await f.db.query('SELECT count(*)::int n FROM rsvps')).rows[0].n,1);
  }finally{await f.close();}
});
test('notification failure is durable and retry succeeds without losing RSVP',async()=>{
  const f=await fixture();try{
    await transaction(client=>saveRsvp(client,hash(f.token),validateRsvp(yes),new Set(['123'])),f.source);
    await drainOutbox({source:f.source,allowedIds:new Set(['123']),api:async()=>{throw new Error('offline');}});
    const queued=(await f.db.query('SELECT * FROM telegram_outbox')).rows[0];assert.equal(queued.attempts,1);
    assert.equal((await f.db.query('SELECT count(*)::int n FROM rsvps')).rows[0].n,1);
    await f.db.query('UPDATE telegram_outbox SET available_at=now()');
    let delivered=0;
    await drainOutbox({source:f.source,allowedIds:new Set(['123']),api:async(method,params)=>{assert.equal(method,'sendMessage');assert.equal(params.chat_id,'123');assert.equal(params.protect_content,true);assert.match(params.text,/Анна/);delivered++;}});
    assert.equal(delivered,1);assert.equal((await f.db.query('SELECT count(*)::int n FROM telegram_outbox')).rows[0].n,0);
  }finally{await f.close();}
});
test('RSVP HTTP: cookie restore, server validation, CSRF, duplicate, expired session and both attendance paths',async()=>{
  const f=await fixture();const oldSite=process.env.PUBLIC_SITE_URL;const oldIds=process.env.TELEGRAM_ALLOWED_USER_IDS;
  process.env.PUBLIC_SITE_URL='http://localhost:3000';process.env.TELEGRAM_ALLOWED_USER_IDS='123';
  try{
    const initial=await getRsvp(new Request('http://localhost:3000/api/rsvp'),f.source);
    assert.equal(initial.status,200);assert.match(initial.headers.get('set-cookie'),/HttpOnly/);
    const cookie=initial.headers.get('set-cookie').split(';')[0];const csrf=(await initial.json()).csrf;
    const request=(body,origin='http://localhost:3000',csrfValue=csrf)=>new Request('http://localhost:3000/api/rsvp',{method:'POST',headers:{'content-type':'application/json',origin,cookie,'x-csrf-token':csrfValue},body:JSON.stringify(body)});
    assert.equal((await postRsvp(request(no,'https://attacker.example'),f.source)).status,403);
    assert.equal((await postRsvp(request(no,'http://localhost:3000','wrong'),f.source)).status,403);
    assert.equal((await postRsvp(request({...yes,dressCode:false}),f.source)).status,400);
    const saved=await postRsvp(request(no),f.source);assert.equal(saved.status,201);
    const again=await postRsvp(request(yes),f.source);assert.equal(again.status,200);assert.equal((await again.json()).rsvp.attendance,'no');
    const restored=await getRsvp(new Request('http://localhost:3000/api/rsvp',{headers:{cookie}}),f.source);assert.equal((await restored.json()).rsvp.guestName,'Максим');
    await f.db.query('DELETE FROM rsvps');assert.equal((await postRsvp(request(yes),f.source)).status,201);
    const token=cookie.slice(cookieName.length+1);
    await f.db.query("UPDATE guest_sessions SET expires_at=now()-interval '1 minute' WHERE id=$1",[hash(token)]);
    assert.equal((await postRsvp(request(no),f.source)).status,403);
    const rate=await transaction(async client=>[await allowRate(client,'test',1),await allowRate(client,'test',1)],f.source);assert.deepEqual(rate,[true,false]);
  }finally{if(oldSite===undefined)delete process.env.PUBLIC_SITE_URL;else process.env.PUBLIC_SITE_URL=oldSite;if(oldIds===undefined)delete process.env.TELEGRAM_ALLOWED_USER_IDS;else process.env.TELEGRAM_ALLOWED_USER_IDS=oldIds;await f.close();}
});
test('webhook fails closed without valid secret and ignores non-private updates before DB',async()=>{
  const old=process.env.TELEGRAM_WEBHOOK_SECRET;process.env.TELEGRAM_WEBHOOK_SECRET='a'.repeat(40);
  try{
    const bad=new Request('http://localhost/api/telegram/webhook',{method:'POST',headers:{'content-type':'application/json','x-telegram-bot-api-secret-token':'wrong'},body:'{}'});
    assert.equal((await webhook(bad)).status,403);
    const group=new Request('http://localhost/api/telegram/webhook',{method:'POST',headers:{'content-type':'application/json','x-telegram-bot-api-secret-token':'a'.repeat(40)},body:JSON.stringify({message:{from:{id:123,is_bot:false},chat:{id:-123,type:'group'},text:'/stats'}})});
    assert.equal((await webhook(group)).status,200);
  }finally{if(old===undefined)delete process.env.TELEGRAM_WEBHOOK_SECRET;else process.env.TELEGRAM_WEBHOOK_SECRET=old;}
});

test('drink multiselect: none is exclusive, other is required and invalid values are rejected',()=>{
  assert.deepEqual(toggleDrink(['red_wine','gin'],'none'),['none']);
  assert.deepEqual(toggleDrink(['none'],'red_wine'),['red_wine']);
  assert.deepEqual(toggleDrink(['red_wine','gin'],'red_wine'),['gin']);
  const validated=validateRsvp({...yes,alcoholDrinks:['gin','red_wine','other'],alcoholOther:'  Сидр  ',softDrinks:['cola','still_water','other'],softOther:'Морс'});
  assert.deepEqual(validated.alcoholDrinks,['red_wine','gin','other']);assert.equal(validated.alcoholOther,'Сидр');
  assert.deepEqual(validateRsvp({...no,alcoholDrinks:['red_wine'],softDrinks:['cola'],alcoholOther:'Сидр'}).alcoholDrinks,[]);
  for(const input of [
    {alcoholDrinks:'red_wine'},{alcoholDrinks:['beer']},{alcoholDrinks:['red_wine','red_wine']},{alcoholDrinks:['none','red_wine']},
    {softDrinks:['none','cola']},{softDrinks:['other']},{alcoholDrinks:['other'],alcoholOther:' '},
    {alcoholDrinks:['other'],alcoholOther:'x'.repeat(121)},{softDrinks:['other'],softOther:'x\u0000'},
  ])assert.throws(()=>validateRsvp({...yes,...input}),InputError);
  assert.equal(describeDrinks('alcohol',['none']),'Не пью алкоголь');
  assert.equal(describeDrinks('soft',['other'],'Морс'),'Свой вариант: Морс');
  assert.equal(drinkChoices.soft.options.length,12);
});
test('drinks persist in PostgreSQL and are included in admin details and notifications',async()=>{
  const f=await fixture();try{
    const data=validateRsvp({...yes,alcoholDrinks:['red_wine','other'],alcoholOther:'Сидр',softDrinks:['apple_juice','other'],softOther:'Морс'});
    const result=await transaction(client=>saveRsvp(client,hash(f.token),data,new Set(['123'])),f.source);
    assert.deepEqual(result.rsvp.alcohol_drinks,['red_wine','other']);assert.equal(result.rsvp.soft_other,'Морс');
    const detail=await transaction(client=>adminReply(client,'123','guest:'+result.rsvp.id),f.source);
    assert.match(detail.text,/Алкоголь: Вино красное, Свой вариант: Сидр/);assert.match(detail.text,/Сок яблочный, Свой вариант: Морс/);
    assert.match(notificationText(result.rsvp),/Сидр/);
    await assert.rejects(f.db.query("UPDATE rsvps SET alcohol_drinks=ARRAY['none','red_wine'] WHERE id=$1",[result.rsvp.id]));
    await assert.rejects(f.db.query("UPDATE rsvps SET soft_drinks=ARRAY['unknown'] WHERE id=$1",[result.rsvp.id]));
    await assert.rejects(f.db.query("UPDATE rsvps SET alcohol_other='' WHERE id=$1",[result.rsvp.id]));
  }finally{await f.close();}
});
test('drinks migration preserves already submitted RSVP data with empty defaults',async()=>{
  const db=new PGlite();try{
    await db.exec(fs.readFileSync('migrations/001_stage_b.sql','utf8'));
    const session=hash(newSession()),id=randomUUID();
    await db.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[session]);
    await db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance) VALUES($1,$2,'Ранее отправленный ответ','no')",[id,session]);
    await db.exec(fs.readFileSync('migrations/002_rsvp_drinks.sql','utf8'));
    const row=(await db.query('SELECT * FROM rsvps WHERE id=$1',[id])).rows[0];
    assert.equal(row.guest_name,'Ранее отправленный ответ');assert.deepEqual(row.alcohol_drinks,[]);assert.deepEqual(row.soft_drinks,[]);
    await assert.rejects(db.query("UPDATE rsvps SET soft_drinks=ARRAY['cola'] WHERE id=$1",[id]));
  }finally{await db.close();}
});

test('expanded drink choices validate and persist both wines, tonic and tomato juice',async()=>{
const f=await fixture();try{
const data=validateRsvp({...yes,alcoholDrinks:['red_wine','white_wine'],softDrinks:['tonic','tomato_juice']});
const result=await transaction(client=>saveRsvp(client,hash(f.token),data,new Set(['123'])),f.source);
assert.deepEqual(result.rsvp.alcohol_drinks,['red_wine','white_wine']);
assert.deepEqual(result.rsvp.soft_drinks,['tonic','tomato_juice']);
assert.equal(drinkChoices.alcohol.options.at(-1).id,'other');assert.equal(drinkChoices.soft.options.at(-1).id,'other');
assert.equal(describeDrinks('alcohol',['wine']),'Вино (цвет не указан)');
assert.throws(()=>validateRsvp({...yes,alcoholDrinks:['wine']}),InputError);
}finally{await f.close();}
});

test('new attendance requirements and optional music are validated server-side',()=>{
  assert.equal(validateRsvp(yes).musicRequest,null);
  assert.equal(validateRsvp({...yes,musicRequest:'  ABBA\nQueen  '}).musicRequest,'ABBA\nQueen');
  assert.equal(validateRsvp({...yes,musicRequest:'   '}).musicRequest,null);
  for(const invalid of [{who:''},{alcoholDrinks:[]},{softDrinks:[]},{alcoholDrinks:undefined},{softDrinks:undefined},{transfer:undefined},{overnight:undefined},{dressCode:false},{musicRequest:'x'.repeat(1001)},{musicRequest:42}])assert.throws(()=>validateRsvp({...yes,...invalid}),InputError);
  const declined=validateRsvp({guestName:'Гость',attendance:'no'});assert.equal(declined.musicRequest,null);assert.equal(declined.attendance,'no');
  assert.equal(validateRsvp({...yes,attendance:'no',musicRequest:'ignore'}).musicRequest,null);
});
test('music persists and appears only for going guests in admin and notifications',async()=>{
  const f=await fixture();try{
    const saved=await transaction(client=>saveRsvp(client,hash(f.token),validateRsvp({...yes,musicRequest:'ABBA\nQueen',food:''}),new Set()),f.source);
    assert.equal(saved.rsvp.music_request,'ABBA\nQueen');
    const detail=await transaction(client=>adminReply(client,'123','guest:'+saved.rsvp.id),f.source);
    assert.match(detail.text,/Музыка: ABBA\nQueen/);assert.match(notificationText(saved.rsvp),/Музыка: ABBA/);
    assert.match(detail.text,/Дресс-код: Подтверждён/);assert.doesNotMatch(detail.text,/Аллергии/);
    assert.doesNotMatch(notificationText({...saved.rsvp,attendance:'no'}),/Музыка|Алкоголь|Ночёвка|Дресс-код/);
    await assert.rejects(f.db.query("UPDATE rsvps SET music_request=$1 WHERE id=$2",['x'.repeat(1001),saved.rsvp.id]));
  }finally{await f.close();}
});
