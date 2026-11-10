import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHmac} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {prepareAdminRsvpEdit,AdminRsvpEditError} from '../src/server/telegram/edit-rsvp.mjs';
import {miniAppRequest} from '../src/server/telegram/mini-app.mjs';

const env={TELEGRAM_BOT_TOKEN:'123456:'+('test-token'.repeat(6)),TELEGRAM_ALLOWED_USER_IDS:'123'};
const first='00000000-0000-4000-8000-000000000001';
const second='00000000-0000-4000-8000-000000000002';
const sessionId='a'.repeat(64);
function signed(id=123){
 const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id})});
 const key=createHmac('sha256','WebAppData').update(env.TELEGRAM_BOT_TOKEN).digest();
 p.set('hash',createHmac('sha256',key).update([...p.entries()].sort(([a],[b])=>a<b?-1:1).map(([k,v])=>k+'='+v).join('\n')).digest('hex'));
 return p.toString();
}
function request(path='',body,authorized=true){
 return new Request('https://example.test/api/telegram/mini-app'+path,{
  method:body?'POST':'GET',
  headers:{...(authorized?{'x-telegram-init-data':signed()}:{}),...(body?{'content-type':'application/json'}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 });
}
const oldRow={
 guest_name:'Сергей Иванов',attendance:'yes',who:'Друг',party_interest:null,
 food:'',music_request:'',transfer:'self',return_transfer:null,
 alcohol_drinks:['none'],alcohol_other:'',soft_drinks:['cola'],soft_other:'',
 dress_code:true,congratulation_choice:null,congratulation_companion:null,
 hot_appetizer_choice:null,main_course_choice:null,venue_rules_accepted:null,
};
test('partial edit preserves missing answers on older registrations',()=>{
 const updated=prepareAdminRsvpEdit(oldRow,{musicRequest:'  https://music.yandex.ru/album/55/track/44  '});
 assert.deepEqual(updated,{music_request:'https://music.yandex.ru/album/55/track/44'});
 assert.equal(oldRow.party_interest,null);
 assert.equal(oldRow.venue_rules_accepted,null);
});
test('admin editing accepts only known fields, controlled choices and lengths',()=>{
 for(const changes of [{sessionId:'steal'},{venueRulesAccepted:true},{id:first},{musicRequest:'a'.repeat(301)},{who:''},{partyInterest:'maybe'},{hotAppetizer:'meat'},{alcoholDrinks:['none','vodka']},{alcoholDrinks:['none','none']},{transfer:'airport'},{returnTransfer:'taxi'},{alcoholOther:'x'.repeat(81)},{congratulationChoice:'other'},{attendance:'no'}]){
  assert.throws(()=>prepareAdminRsvpEdit(oldRow,changes),AdminRsvpEditError);
 }
 assert.deepEqual(prepareAdminRsvpEdit(oldRow,{food:'Без орехов'}),{food:'Без орехов'});
 assert.throws(()=>prepareAdminRsvpEdit(oldRow,{alcoholDrinks:['red_wine','none']}),AdminRsvpEditError);
});
test('status transitions require explicit confirmation and preserve privacy of consent',()=>{
 assert.throws(()=>prepareAdminRsvpEdit(oldRow,{attendance:'no'}),/Подтверди/);
 const change=prepareAdminRsvpEdit(oldRow,{attendance:'no'},{confirmAttendance:true});
 assert.equal(change.attendance,'no');
 assert.equal(change.venue_rules_accepted,false);
 assert.equal(change.party_interest,null);
 assert.equal(change.transfer,null);
 assert.deepEqual(change.alcohol_drinks,[]);
 const declined={...oldRow,guest_name:'Второй гость',attendance:'no',who:'',dress_code:false,transfer:null,alcohol_drinks:[],soft_drinks:[],music_request:null};
 const yes={attendance:'yes',who:'Друг',partyInterest:'yes',congratulationChoice:'public',hotAppetizer:'hot_meat',mainCourse:'main_fish',alcoholDrinks:['none'],softDrinks:['cola'],transfer:'self',returnTransfer:'needed',dressCodeConfirmed:true};
 assert.throws(()=>prepareAdminRsvpEdit(declined,yes),/Подтверди/);
 const added=prepareAdminRsvpEdit(declined,yes,{confirmAttendance:true});
 assert.equal(added.attendance,'yes');
 assert.equal(added.dress_code,true);
 assert.equal(added.venue_rules_accepted,false);
 assert.equal(added.venue_rules_accepted_at,null);
});
test('authorized edit updates existing RSVP, analytics, and rejects stale or invalid edits',async()=>{
 const db=new PGlite();
 const source={async connect(){return {query:(sql,args)=>db.query(sql,args),release(){}};}};
 const api=async(path='',body,auth=true)=>{const res=await miniAppRequest(request(path,body,auth),{env,source});return {status:res.status,data:await res.json()};};
 try{
  await db.exec(fs.readdirSync('migrations').filter(name=>name.endsWith('.sql')).sort().map(name=>fs.readFileSync('migrations/'+name,'utf8')).join('\n'));
  await db.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[sessionId]);
  await db.query(`INSERT INTO rsvps(id,session_id,guest_name,attendance,who,transfer,return_transfer,dress_code,alcohol_drinks,soft_drinks,music_request,food,hot_appetizer_choice,main_course_choice,congratulation_choice,party_interest,venue_rules_accepted,venue_rules_accepted_at,venue_rules_version)
   VALUES ($1,$2,'Первый гость','yes','Друг','self','not_needed',true,ARRAY['none'],ARRAY['cola'],'ABBA','', 'hot_meat','main_fish','public','yes',true,now(),'2026-11-01')`,[first,sessionId]);
  await db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance) VALUES($1,$2,'Второй гость','no')",[second,sessionId]);
  const detail=await api('?id='+first);
  assert.equal(detail.status,200);
  assert.equal(detail.data.guest.edit.guestName,'Первый гость');
  assert.equal(detail.data.guest.edit.venueRulesAccepted,true);
  assert.equal(detail.data.guest.updatedAt.length>0,true);
  const list=await api();assert.equal(list.status,200);
  assert.ok(!Object.hasOwn(list.data.guests[0],'edit'),'Full editable fields must not leak into listing responses');
  const version=detail.data.guest.updatedAt;
  const bad=await api('',{action:'edit',id:first,updatedAt:version,changes:{venueRulesAccepted:true}});
  assert.equal(bad.status,400);
  const fake=await api('',{action:'edit',id:first,updatedAt:version,changes:{musicRequest:'hijacked'}},false);
  assert.equal(fake.status,403);
  const saved=await api('',{action:'edit',id:first,updatedAt:version,changes:{musicRequest:'https://music.yandex.ru/album/11/track/22',guestName:'Новый гость',food:'Без орехов'}});
  assert.equal(saved.status,200,JSON.stringify(saved.data));
  assert.equal(saved.data.guest.name,'Новый гость');
  assert.equal(saved.data.guest.music,'https://music.yandex.ru/album/11/track/22');
  assert.equal(saved.data.guest.edit.venueRulesAccepted,true);
  assert.notEqual(saved.data.guest.updatedAt,version);
  const stale=await api('',{action:'edit',id:first,updatedAt:version,changes:{musicRequest:'stale'}});
  assert.equal(stale.status,409);
  const after=await db.query('SELECT * FROM rsvps WHERE id=$1',[first]);
  assert.equal(after.rows[0].music_request,'https://music.yandex.ru/album/11/track/22');
  assert.equal(after.rows[0].venue_rules_accepted,true);
  assert.equal((await db.query('SELECT guest_name FROM rsvps WHERE id=$1',[second])).rows[0].guest_name,'Второй гость');
  const analytics=await api('?action=analytics');
  assert.equal(analytics.data.music[0].name,'Новый гость');
  assert.equal(analytics.data.music[0].music,'https://music.yandex.ru/album/11/track/22');
  const decline=await api('',{action:'edit',id:first,updatedAt:saved.data.guest.updatedAt,confirmAttendance:true,changes:{attendance:'no'}});
  assert.equal(decline.status,200,JSON.stringify(decline.data));
  assert.equal(decline.data.guest.status,'NOT_GOING');
  const changed=(await db.query('SELECT * FROM rsvps WHERE id=$1',[first])).rows[0];
  assert.equal(changed.venue_rules_accepted,false);
  assert.equal(changed.venue_rules_accepted_at,null);
  assert.equal(changed.party_interest,null);
  assert.equal(changed.music_request,null);
  assert.equal(changed.dress_code,false);
  assert.deepEqual(changed.alcohol_drinks,[]);
  assert.equal((await api()).data.stats.going,0);
  assert.equal((await api()).data.stats.not_going,2);
  const attend=await api('',{action:'edit',id:second,updatedAt:(await api('?id='+second)).data.guest.updatedAt,confirmAttendance:true,changes:{
   attendance:'yes',who:'Друг',partyInterest:'no',congratulationChoice:'private',hotAppetizer:'hot_meat',mainCourse:'main_fish',
   alcoholDrinks:['none'],softDrinks:['cola'],transfer:'self',returnTransfer:'not_needed',dressCodeConfirmed:true
  }});
  assert.equal(attend.status,200,JSON.stringify(attend.data));
  assert.equal(attend.data.guest.status,'GOING');
  assert.equal(attend.data.guest.edit.venueRulesAccepted,false,'Admin is not allowed to attest venue rules for guests');
  const refreshed=(await api()).data;
  assert.equal(refreshed.stats.going,1);
  assert.equal(refreshed.stats.not_going,1);
  assert.equal(refreshed.stats.total,2);
  const remaining=(await db.query('SELECT session_id,submission_key FROM rsvps ORDER BY id')).rows;
  assert.equal(remaining.length,2);
  assert.ok(remaining.every(r=>r.session_id===sessionId&&r.submission_key));
 }finally{await db.close();}
});
test('editing UI exposes every answer and safe cancel/save controls without touching server-only imports',()=>{
 const ui=fs.readFileSync('src/components/GuestEditor.tsx','utf8');
 const parent=fs.readFileSync('src/components/TelegramAdmin.tsx','utf8');
 for(const name of ['guestName','attendance','who','partyInterest','congratulationChoice','congratulationCompanion','hotAppetizer','mainCourse','alcoholDrinks','softDrinks','transfer','returnTransfer','musicRequest','food'])
  assert.ok(ui.includes(name),name);
 assert.ok(parent.includes('Редактировать ответы'));
 assert.ok(parent.includes("action:'edit'"));
 assert.ok(ui.includes('Сохранить изменения'));
 assert.ok(ui.includes('Отмена'));
 assert.ok(!ui.includes("venueRulesAccepted',true"),'Venue rules are not set on behalf of a guest');
});
