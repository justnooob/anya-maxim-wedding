import test from 'node:test';
import assert from 'node:assert/strict';
import {rsvpFieldIssues} from '../src/content/rsvp-field-issues.mjs';
import {rsvpReady} from '../src/content/rsvp-limits.mjs';

const yes={guestName:'Аня',attendance:'yes',who:'Подруга',congratulationChoice:'public',congratulationCompanion:'',hotAppetizer:'hot_meat',mainCourse:'main_fish',food:'',alcoholDrinks:['none'],alcoholOther:'',softDrinks:['none'],softOther:'',transfer:'self',returnTransfer:'not_needed',musicRequest:'',dressCodeConfirmed:true,venueRulesAccepted:true};
test('one-word names are valid and max length is 80 characters',()=>{
 assert.equal(rsvpReady(yes),true);
 assert.deepEqual(rsvpFieldIssues(yes),{});
 assert.deepEqual(rsvpFieldIssues({...yes,guestName:'  '}),{guestName:'Укажи, как к тебе обращаться.'});
 assert.equal(rsvpReady({...yes,guestName:'А'.repeat(80)}),true);
 assert.equal(rsvpReady({...yes,guestName:'А'.repeat(81)}),false);
 assert.match(rsvpFieldIssues({...yes,guestName:'А'.repeat(81)}).guestName,/80/);
});
test('report each missing RSVP group, not just a single generic error',()=>{
 const issues=rsvpFieldIssues({...yes,who:'',congratulationChoice:'',hotAppetizer:'',mainCourse:'',alcoholDrinks:[],softDrinks:[],transfer:'',returnTransfer:'',dressCodeConfirmed:false,venueRulesAccepted:false});
 for(const key of ['who','congratulationChoice','hotAppetizer','mainCourse','alcoholDrinks','softDrinks','transfer','returnTransfer','dress','venueRules'])assert.equal(typeof issues[key],'string',key);
});
test('declined guest only needs a name and attendance choice',()=>{
 assert.deepEqual(rsvpFieldIssues({guestName:'Максим',attendance:'no'}),{});
});
