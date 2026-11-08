import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {validateRsvp,InputError} from '../src/server/rsvp/validation.mjs';
import {rsvpReady} from '../src/content/rsvp-limits.mjs';
import {rsvpFieldIssues} from '../src/content/rsvp-field-issues.mjs';
import {rsvpDetail,rsvpDetailText} from '../src/server/rsvp/detail.mjs';

const attending={guestName:'Анна Иванова',attendance:'yes',partyInterest:'yes',who:'Подруга',congratulationChoice:'public',congratulationCompanion:'',hotAppetizer:'hot_meat',mainCourse:'main_fish',food:'',musicRequest:'',returnTransfer:'not_needed',transfer:'self',dressCodeConfirmed:true,venueRulesAccepted:true,alcoholDrinks:['none'],alcoholOther:'',softDrinks:['none'],softOther:''};

test('yes/no choice is required and validated on the server for an attending guest',()=>{
 for(const partyInterest of [undefined,null,'','maybe',true]){
  const data={...attending,partyInterest};
  assert.equal(rsvpReady(data),false);
  assert.equal(typeof rsvpFieldIssues(data).partyInterest,'string');
  assert.throws(()=>validateRsvp(data),InputError);
 }
 for(const partyInterest of ['yes','no']){
  const data={...attending,partyInterest};
  assert.equal(rsvpReady(data),true);
  assert.equal(rsvpFieldIssues(data).partyInterest,undefined);
  assert.equal(validateRsvp(data).partyInterest,partyInterest);
 }
});

test('declining guests do not need a choice and cannot save a stale choice',()=>{
 assert.equal(rsvpReady({guestName:'Иван',attendance:'no'}),true);
 assert.equal(validateRsvp({guestName:'Иван',attendance:'no',partyInterest:'yes'}).partyInterest,null);
 assert.deepEqual(rsvpFieldIssues({guestName:'Иван',attendance:'no'}),{});
});

test('Telegram details distinguish yes, no and missing historical answers',()=>{
 for(const [choice,label] of [['yes','Да, хочу'],['no','Нет, не хочу'],[null,'Ответ не указан']]){
  const row={guest_name:'Анна Иванова',attendance:'yes',who:'Подруга',party_interest:choice,alcohol_drinks:['none'],soft_drinks:['none'],transfer:'self'};
  assert.equal(rsvpDetail(row).fields.find(field=>field.label==='Девичник / мальчишник').value,label);
  assert.ok(rsvpDetailText(row).includes('Девичник / мальчишник: '+label));
 }
});

test('migration preserves old RSVP records without invented consent and restricts values',async()=>{
 const db=new PGlite();
 try {
  const files=fs.readdirSync('migrations').filter(name=>name.endsWith('.sql')).sort();
  await db.exec(files.filter(name=>!name.startsWith('017')).map(name=>fs.readFileSync('migrations/'+name,'utf8')).join('\n'));
  const sessionId='a'.repeat(64),guestId=randomUUID();
  await db.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[sessionId]);
  await db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance,who,transfer,dress_code,alcohol_drinks,soft_drinks) VALUES($1,$2,'Прежняя Гостья','yes','Подруга','self',true,ARRAY['none'],ARRAY['none'])",[guestId,sessionId]);
  await db.exec(fs.readFileSync('migrations/017_party_interest.sql','utf8'));
  let row=(await db.query('SELECT party_interest FROM rsvps WHERE id=$1',[guestId])).rows[0];
  assert.equal(row.party_interest,null);
  await db.query("UPDATE rsvps SET party_interest='yes' WHERE id=$1",[guestId]);
  row=(await db.query('SELECT party_interest FROM rsvps WHERE id=$1',[guestId])).rows[0];
  assert.equal(row.party_interest,'yes');
  await assert.rejects(db.query("UPDATE rsvps SET party_interest='maybe' WHERE id=$1",[guestId]));
  await assert.rejects(db.query("UPDATE rsvps SET attendance='no' WHERE id=$1",[guestId]));
 } finally {await db.close();}
});
