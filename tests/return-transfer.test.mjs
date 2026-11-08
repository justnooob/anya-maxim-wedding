import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {validateRsvp,InputError} from '../src/server/rsvp/validation.mjs';
import {rsvpReady} from '../src/content/rsvp-limits.mjs';
import {saveRsvp} from '../src/server/rsvp/repository.mjs';
import {parseDraft} from '../src/client/rsvp-draft.mjs';
import {adminGuest} from '../src/server/telegram/analytics.mjs';
import {notificationPayload} from '../src/server/telegram/outbox.mjs';
const yes={guestName:'Тестовый Гость',attendance:'yes',partyInterest:'yes',who:'Друг',food:'',musicRequest:'',congratulationChoice:'public',hotAppetizer:'hot_meat',mainCourse:'main_fish',transfer:'self',returnTransfer:'needed',venueRulesAccepted:true,dressCode:true,alcoholDrinks:['none'],softDrinks:['none'],alcoholOther:'',softOther:''};
for(const [transfer,returnTransfer]of [['self','needed'],['kupchino','not_needed'],['pavlovsk','needed'],['self','not_needed']])test('outbound '+transfer+' and return '+returnTransfer+' are independent valid choices',()=>{const input={...yes,transfer,returnTransfer};assert.ok(rsvpReady(input));const value=validateRsvp(input);assert.equal(value.transfer,transfer);assert.equal(value.returnTransfer,returnTransfer);});
test('new GOING must explicitly choose return transfer on server and client',()=>{for(const returnTransfer of [undefined,null,'',false,'self','Нужен',[],{}]){assert.equal(rsvpReady({...yes,returnTransfer}),false);assert.throws(()=>validateRsvp({...yes,returnTransfer}),InputError);}});
test('NOT_GOING ignores stale return transfer and keeps the minimal result',()=>{const value=validateRsvp({...yes,attendance:'no',returnTransfer:{broken:true}});assert.equal(value.returnTransfer,null);assert.equal(value.transfer,null);assert.ok(rsvpReady({guestName:'Тестовый Гость',attendance:'no'}));assert.ok(!adminGuest({guest_name:'Тестовый Гость',attendance:'no',return_transfer:'needed'}).fields.some(f=>f.label.includes('Обратный')));});
test('versioned draft restores return choice, accepts legacy missing choice and rejects corrupt value',()=>{
 const fields={name:'Тестовый Гость',attendance:'yes',partyInterest:'yes',who:'Друг',food:'',musicRequest:'',alcoholOther:'',softOther:'',hotAppetizer:'hot_meat',mainCourse:'main_fish',transfer:'self',returnTransfer:'not_needed',dress:true,venueRules:true,alcoholDrinks:['none'],softDrinks:['none'],congratulationChoice:'public',congratulationCompanion:''};
 assert.equal(parseDraft(JSON.stringify({version:2,fields})).returnTransfer,'not_needed');const old={...fields};delete old.returnTransfer;assert.equal(parseDraft(JSON.stringify({version:2,fields:old})).returnTransfer,'');assert.equal(parseDraft(JSON.stringify({version:2,fields:{...fields,returnTransfer:'fake'}})),null);
});
test('migration 011 preserves historical RSVP and stores return choice for authenticated detail',async()=>{
 const db=new PGlite();try{
  const files=fs.readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort();await db.exec(files.filter(n=>n<'011').map(n=>fs.readFileSync('migrations/'+n,'utf8')).join('\n'));
  const session='b'.repeat(64),legacy=randomUUID();await db.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[session]);await db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance) VALUES($1,$2,'Старый Гость','no')",[legacy,session]);
  await db.exec(fs.readFileSync('migrations/011_return_transfer.sql','utf8'));await db.exec(fs.readFileSync('migrations/015_venue_rules_consent.sql','utf8'));const old=(await db.query('SELECT * FROM rsvps WHERE id=$1',[legacy])).rows[0];assert.equal(old.return_transfer,null);assert.equal(old.guest_name,'Старый Гость');
  for(const choice of ['needed','not_needed']){const saved=await saveRsvp({query:(sql,args)=>db.query(sql,args)},session,validateRsvp({...yes,returnTransfer:choice,submissionKey:randomUUID()}),new Set());assert.equal(saved.rsvp.return_transfer,choice);assert.equal(adminGuest(saved.rsvp).fields.find(f=>f.label==='Обратный трансфер до Купчино').value,choice==='needed'?'Нужен':'Не нужен');}
  assert.equal((await db.query('SELECT count(*)::int n FROM rsvps')).rows[0].n,3);await assert.rejects(db.query('UPDATE rsvps SET return_transfer=$1 WHERE id=$2',['needed',legacy]));await assert.rejects(db.query('UPDATE rsvps SET return_transfer=$1 WHERE attendance=$2',['invalid','yes']));
 }finally{await db.close();}
});
test('short push still contains no transport details',()=>{const value=notificationPayload({guest_name:'Тестовый Гость',transfer:'self',return_transfer:'needed'},'https://example.com');assert.equal(value.text,'Новый ответ от гостя "Тестовый Гость"');assert.doesNotMatch(JSON.stringify(value),/needed|Обратный|Купчино/);});
