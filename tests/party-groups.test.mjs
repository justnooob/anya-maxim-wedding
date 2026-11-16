import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHmac,randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {miniAppRequest} from '../src/server/telegram/mini-app.mjs';
import {guestQuery} from '../src/server/telegram/analytics.mjs';

const env={TELEGRAM_BOT_TOKEN:'123456:'+('test-token'.repeat(6)),TELEGRAM_ALLOWED_USER_IDS:'123'};
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
test('party query accepts controlled filters, rejects arbitrary groups and never guesses a gender',()=>{
 for(const party of ['any','yes','no','unanswered','bachelor','bachelorette','unassigned']){
  const q=guestQuery(new URLSearchParams({party,search:"Асель'} OR TRUE --"}));
  assert.ok(!q.sql.includes('Асель'));
  assert.equal(q.args[0],"Асель'} OR TRUE --");
  assert.match(q.sql,/ORDER BY/);
 }
 for(const party of ['female','male','other','yes;DROP TABLE rsvps;','true'])
  assert.throws(()=>guestQuery(new URLSearchParams({party})),/Invalid filters/);
});
test('additive migration and Telegram organizer-only party groups preserve old RSVPs and require guest interest',async()=>{
 const db=new PGlite();
 const source={async connect(){return {query:(sql,args)=>db.query(sql,args),release(){}};}};
 const api=async(path='',body,authorized=true)=>{
  const res=await miniAppRequest(request(path,body,authorized),{source,env});
  return {status:res.status,data:await res.json()};
 };
 try{
  const names=readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort();
  await db.exec(names.filter(n=>n!=='018_party_group.sql').map(n=>readFileSync('migrations/'+n,'utf8')).join('\n'));
  const sid='a'.repeat(64);
  await db.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[sid]);
  const entries=[['Асель','yes'],['Капитан Морковка','yes'],['Сергей','no'],['Гость с прошлой формы',null]];
  const ids=[];
  for(const [name,interest] of entries){
   const id=randomUUID();ids.push(id);
   await db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance,who,transfer,dress_code,alcohol_drinks,soft_drinks,party_interest) VALUES($1,$2,$3,'yes','Друг','self',true,ARRAY['none'],ARRAY['none'],$4)",[id,sid,name,interest]);
  }
  await db.exec(readFileSync('migrations/018_party_group.sql','utf8'));
  assert.equal((await db.query('SELECT count(*)::int n FROM rsvps WHERE party_group IS NULL')).rows[0].n,4);
  const initial=await api();
  assert.equal(initial.status,200);
  assert.equal(initial.data.stats.party_wants,2);
  assert.equal(initial.data.stats.party_unassigned,2);
  assert.equal(initial.data.stats.party_bachelor,0);
  assert.equal(initial.data.stats.party_bachelorette,0);
  assert.equal((await api('?party=yes')).data.guests.length,2);
  assert.equal((await api('?party=no')).data.guests.length,1);
  assert.equal((await api('?party=unanswered')).data.guests.length,1);
  assert.equal((await api('?party=unassigned')).data.guests.length,2);
  const first=(await api('?id='+ids[0])).data.guest;
  assert.equal(first.partyGroup,null);
  const invalid=await api('',{action:'assignParty',id:ids[0],updatedAt:first.updatedAt,group:'female'});
  assert.equal(invalid.status,400);
  const rejected=await api('',{action:'assignParty',id:ids[2],updatedAt:(await api('?id='+ids[2])).data.guest.updatedAt,group:'bachelor'});
  assert.equal(rejected.status,409);
  const noAuth=await api('',{action:'assignParty',id:ids[0],updatedAt:first.updatedAt,group:'bachelorette'},false);
  assert.equal(noAuth.status,403);
  const saved=await api('',{action:'assignParty',id:ids[0],updatedAt:first.updatedAt,group:'bachelorette'});
  assert.equal(saved.status,200,JSON.stringify(saved.data));
  assert.equal(saved.data.guest.partyGroup,'bachelorette');
  const stale=await api('',{action:'assignParty',id:ids[0],updatedAt:first.updatedAt,group:'bachelor'});
  assert.equal(stale.status,409);
  const second=(await api('?id='+ids[1])).data.guest;
  const savedSecond=await api('',{action:'assignParty',id:ids[1],updatedAt:second.updatedAt,group:'bachelor'});
  assert.equal(savedSecond.status,200,JSON.stringify(savedSecond.data));
  const grouped=await api();
  assert.equal(grouped.data.stats.party_bachelor,1);
  assert.equal(grouped.data.stats.party_bachelorette,1);
  assert.equal(grouped.data.stats.party_unassigned,0);
  assert.deepEqual((await api('?party=bachelorette')).data.guests.map(g=>g.name),['Асель']);
  assert.deepEqual((await api('?party=bachelor')).data.guests.map(g=>g.name),['Капитан Морковка']);
  const cleared=await api('',{action:'assignParty',id:ids[0],updatedAt:saved.data.guest.updatedAt,group:null});
  assert.equal(cleared.status,200);
  assert.equal((await api()).data.stats.party_unassigned,1);
  await assert.rejects(db.query("UPDATE rsvps SET party_group='bachelor' WHERE id=$1",[ids[2]]));
  await assert.rejects(db.query("UPDATE rsvps SET party_group='female' WHERE id=$1",[ids[0]]));
  const latest=(await api('?id='+ids[1])).data.guest;
  const optOut=await api('',{action:'edit',id:ids[1],updatedAt:latest.updatedAt,changes:{partyInterest:'no'}});
  assert.equal(optOut.status,200,JSON.stringify(optOut.data));
  assert.equal((await db.query('SELECT party_group FROM rsvps WHERE id=$1',[ids[1]])).rows[0].party_group,null);
  assert.equal((await api()).data.stats.party_wants,1);
  const old=(await db.query('SELECT guest_name,party_interest,party_group FROM rsvps WHERE id=$1',[ids[3]])).rows[0];
  assert.deepEqual(old,{guest_name:'Гость с прошлой формы',party_interest:null,party_group:null});
 }finally{await db.close();}
});
test('Mini App is the only place that assigns party groups, never the guest RSVP form',()=>{
 const form=readFileSync('src/components/RSVP.tsx','utf8');
 const ui=readFileSync('src/components/TelegramAdmin.tsx','utf8');
 assert.ok(!form.includes('partyGroup'));
 assert.match(ui,/action:'assignParty'/);
 assert.match(ui,/organizer-party-kpis/);
 assert.match(ui,/Не распределены/);
 assert.match(ui,/Девичник \/ мальчишник/);
});
