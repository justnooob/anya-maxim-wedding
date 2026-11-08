import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {validateRsvp,InputError} from '../src/server/rsvp/validation.mjs';
import {rsvpReady} from '../src/content/rsvp-limits.mjs';
import {VENUE_RULES_VERSION} from '../src/content/venue-consent.mjs';
import {saveRsvp} from '../src/server/rsvp/repository.mjs';
import {rsvpDetail} from '../src/server/rsvp/detail.mjs';
const yes={guestName:'Тестовый Гость',attendance:'yes',partyInterest:'yes',who:'Друг',food:'',musicRequest:'',congratulationChoice:'public',hotAppetizer:'hot_meat',mainCourse:'main_fish',transfer:'self',returnTransfer:'needed',dressCodeConfirmed:true,venueRulesAccepted:true,alcoholDrinks:['none'],softDrinks:['none'],alcoholOther:'',softOther:''};
test('venue consent is a strict separate boolean, mandatory in client/server for GOING',()=>{
 assert.ok(rsvpReady(yes));const result=validateRsvp(yes);assert.equal(result.venueRulesAccepted,true);assert.equal(result.dressCodeConfirmed,true);
 for(const value of [undefined,null,false,0,1,'true',[],{}]){assert.equal(rsvpReady({...yes,venueRulesAccepted:value}),false);assert.throws(()=>validateRsvp({...yes,venueRulesAccepted:value}),InputError);}
 assert.throws(()=>validateRsvp({...yes,dressCodeConfirmed:false,dressCode:true}),InputError);
 assert.throws(()=>validateRsvp({...yes,venueRulesAccepted:false,dressCode:true}),InputError);
 assert.ok(validateRsvp({...yes,dressCodeConfirmed:undefined,dressCode:true}).venueRulesAccepted);
});
test('NOT_GOING needs no consents and strips stale confirmations',()=>{
 for(const input of [{guestName:'Тестовый Гость',attendance:'no'},{...yes,attendance:'no'}]){
  assert.ok(rsvpReady(input));const result=validateRsvp(input);assert.equal(result.venueRulesAccepted,false);assert.equal(result.dressCodeConfirmed,false);assert.equal(result.dressCode,false);
 }
});
test('additive consent migration preserves legacy rows; new consent timestamp/version are server-owned and idempotent',async()=>{
 const db=new PGlite();try{
  const files=fs.readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort();await db.exec(files.filter(n=>n<'015').map(n=>fs.readFileSync('migrations/'+n,'utf8')).join('\n'));
  const session='e'.repeat(64),legacy=randomUUID();await db.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[session]);
  await db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance,who,transfer,dress_code,alcohol_drinks,soft_drinks) VALUES($1,$2,'Старый Гость','yes','Друг','self',true,ARRAY['none'],ARRAY['none'])",[legacy,session]);
  const before=(await db.query('SELECT * FROM rsvps WHERE id=$1',[legacy])).rows[0];
  await db.exec(fs.readFileSync('migrations/015_venue_rules_consent.sql','utf8'));
  const old=(await db.query('SELECT * FROM rsvps WHERE id=$1',[legacy])).rows[0];
  for(const [key,value] of Object.entries(before))assert.deepEqual(old[key],value);
  assert.equal(old.venue_rules_accepted,null);assert.equal(old.venue_rules_accepted_at,null);assert.equal(old.venue_rules_version,null);
  assert.equal(rsvpDetail(old).fields.find(f=>f.label==='Правила площадки').value,'Нет сохранённого подтверждения');
  const client={query:(sql,args)=>db.query(sql,args)},key=randomUUID();
  const data=validateRsvp({...yes,submissionKey:key,venueRulesAcceptedAt:'1900-01-01',venueRulesVersion:'forged'});
  const saved=await saveRsvp(client,session,data,new Set());
  assert.equal(saved.rsvp.venue_rules_accepted,true);assert.equal(saved.rsvp.venue_rules_version,VENUE_RULES_VERSION);assert.ok(new Date(saved.rsvp.venue_rules_accepted_at).getFullYear()>=2026);
  const repeated=await saveRsvp(client,session,data,new Set());assert.equal(repeated.created,false);assert.deepEqual(repeated.rsvp.venue_rules_accepted_at,saved.rsvp.venue_rules_accepted_at);
  const declined=await saveRsvp(client,session,validateRsvp({guestName:'Другой Гость',attendance:'no',submissionKey:randomUUID()}),new Set());assert.equal(declined.rsvp.venue_rules_accepted,false);assert.equal(declined.rsvp.venue_rules_accepted_at,null);assert.equal(declined.rsvp.venue_rules_version,null);assert.equal(rsvpDetail(declined.rsvp).fields.length,1);
  await assert.rejects(db.query('UPDATE rsvps SET venue_rules_accepted=true WHERE id=$1',[legacy]));
  await assert.rejects(db.query('UPDATE rsvps SET venue_rules_accepted=true,venue_rules_accepted_at=now(),venue_rules_version=$1 WHERE id=$2',[VENUE_RULES_VERSION,declined.rsvp.id]));
 }finally{await db.close();}
});
