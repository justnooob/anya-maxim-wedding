import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {validateRsvp,InputError} from '../src/server/rsvp/validation.mjs';
import {rsvpLimits,textLength,rsvpReady,attendancePayload} from '../src/content/rsvp-limits.mjs';
import {boundedFetch,requestMessage} from '../src/client/requests.mjs';
import {renderRsvp} from './helpers/render-rsvp.mjs';
const yes={guestName:'Гость',attendance:'yes',who:'Друг',food:'',musicRequest:'',transfer:'self',overnight:'leave',dressCode:true,alcoholDrinks:['none'],softDrinks:['none'],alcoholOther:'',softOther:''};
test('shared limits accept every exact maximum, reject maximum+1 without truncation, count Unicode consistently',()=>{
 for(const [field,max] of Object.entries(rsvpLimits)){
  const base={...yes,...(field==='alcoholOther'?{alcoholDrinks:['other']}:field==='softOther'?{softDrinks:['other']}:{})};
  for(const char of ['я','a','😀']){
   const valid={...base,[field]:char.repeat(max)};assert.equal(textLength(valid[field]),max);assert.ok(rsvpReady(valid));assert.equal(validateRsvp(valid)[field],valid[field]);
   const invalid={...base,[field]:char.repeat(max+1)};assert.equal(rsvpReady(invalid),false);assert.throws(()=>validateRsvp(invalid),error=>error instanceof InputError&&error.message.includes(String(max)));
  }
 }
 assert.equal(textLength(' e\u0301 '),1);
});
test('strange input remains plain trimmed text and control characters/whitespace-only required inputs are rejected',()=>{
 for(const value of ['  Анна  Maria  😀  ', 'one\ntwo', '\"O’Connor\" & < >', '<script>alert(1)</script>', "Robert'); DROP TABLE rsvps;--", 'x'.repeat(300)]){
  const result=validateRsvp({...yes,musicRequest:value});assert.equal(result.musicRequest,value.trim().normalize('NFC'));
 }
 assert.equal(validateRsvp({...yes,guestName:'  Анна   Мария\nМаксим '}).guestName,'Анна Мария Максим');
 for(const guestName of ['', '   ','\n\t','A\u0000'])assert.throws(()=>validateRsvp({...yes,guestName}),InputError);
 const html=renderRsvp({name:'<script>alert(1)</script> 😀'});assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));
});
test('attendance state machine: initial disabled, optional values, going requirements and no hidden payload',()=>{
 assert.equal(rsvpReady({...yes,attendance:null}),false);assert.ok(rsvpReady(yes));assert.ok(rsvpReady({...yes,musicRequest:'ABBA'}));
 for(const patch of [{who:''},{alcoholDrinks:[]},{softDrinks:[]},{transfer:null},{overnight:null},{dressCode:false},{alcoholDrinks:['other'],alcoholOther:' '},{softDrinks:['other'],softOther:' '}]){assert.equal(rsvpReady({...yes,...patch}),false);assert.throws(()=>validateRsvp({...yes,...patch}),InputError);}
 const declined=attendancePayload({...yes,attendance:'no',musicRequest:'ignored',alcoholOther:'ignored'});
 assert.deepEqual(declined,{guestName:'Гость',attendance:'no'});assert.ok(rsvpReady(declined));assert.equal(validateRsvp(declined).musicRequest,null);
 assert.equal(rsvpReady({...declined,attendance:'yes',who:'',food:'',musicRequest:'',alcoholDrinks:[],softDrinks:[]}),false);
 const initial=renderRsvp({sent:false,attendance:null});assert.match(initial,/type="submit" disabled/);assert.ok(initial.includes('0 / 300'));
});
test('network handling maps all failures to calm copy and cancels a hung request',async()=>{
 for(const status of [400,401,403,404,429,500]){assert.ok(requestMessage(status));assert.doesNotMatch(requestMessage(status),/stack|fetch|SQL|token/i);}
 let aborted=false;
 await assert.rejects(boundedFetch('/api/rsvp',{},5,async(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>{aborted=true;reject(new Error('test timeout'));}))),/test timeout/);
 assert.ok(aborted);assert.equal(await boundedFetch('/ok',{},10,async()=>42),42);
});
test('migration 006 preserves legacy long answers and enforces all limits/going requirements on new writes',async()=>{
 const db=new PGlite();try{
  const migrations=fs.readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort();await db.exec(migrations.filter(n=>!n.startsWith('006_')).map(n=>fs.readFileSync('migrations/'+n,'utf8')).join('\n'));
  await db.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",['a'.repeat(64)]);
  const id='00000000-0000-4000-8000-000000000001';
  await db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance,who,food,music_request,transfer,overnight,dress_code,alcohol_drinks,soft_drinks) VALUES($1,$2,$3,'yes',$4,$5,$6,'self','leave',true,ARRAY['none'],ARRAY['none'])",[id,'a'.repeat(64),'я'.repeat(120),'я'.repeat(240),'я'.repeat(600),'я'.repeat(1000)]);
  await db.exec(fs.readFileSync('migrations/006_rsvp_limits.sql','utf8'));
  const old=(await db.query('SELECT * FROM rsvps')).rows[0];assert.equal(old.guest_name.length,120);assert.equal(old.music_request.length,1000);
  await db.query('UPDATE rsvps SET guest_name=$1,who=$2,food=$3,music_request=$4 WHERE id=$5',['😀'.repeat(80),'я'.repeat(120),'я'.repeat(300),'я'.repeat(300),id]);
  for(const [column,max] of [['guest_name',80],['who',120],['food',300],['music_request',300]])await assert.rejects(db.query('UPDATE rsvps SET '+column+'=$1 WHERE id=$2',['я'.repeat(max+1),id]));
  await assert.rejects(db.query("UPDATE rsvps SET who='' WHERE id=$1",[id]));await assert.rejects(db.query("UPDATE rsvps SET soft_drinks='{}' WHERE id=$1",[id]));
  await db.query('UPDATE rsvps SET music_request=NULL WHERE id=$1',[id]);assert.equal((await db.query('SELECT music_request FROM rsvps')).rows[0].music_request,null);
 }finally{await db.close();}
});
