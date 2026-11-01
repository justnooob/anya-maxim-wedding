import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDraft} from '../src/client/rsvp-draft.mjs';
const fields={returnTransfer:'',attendance:'yes',name:'Анна Иванова',who:'Подруга',food:'',musicRequest:'Музыка',alcoholOther:'',softOther:'',hotAppetizer:'hot_meat',mainCourse:'main_fish',alcoholDrinks:['none'],softDrinks:['cola'],transfer:'self',dress:true,venueRules:true};
test('RSVP draft restores only guest input, never technical credentials',()=>{const result=parseDraft(JSON.stringify({version:1,fields:{...fields,csrf:'never-restore',token:'never-restore'}}));assert.deepEqual(result,{...fields,congratulationChoice:'',congratulationCompanion:''});assert.equal(result.csrf,undefined);});
test('RSVP draft gracefully discards corrupt, incompatible or oversized storage',()=>{for(const raw of [null,'{bad',JSON.stringify({version:2,fields}),JSON.stringify({version:1,fields:{...fields,food:'x'.repeat(1001)}}),JSON.stringify({version:1,fields:{...fields,attendance:'fake'}}),JSON.stringify({version:1,fields:{...fields,softDrinks:[{}]}})])assert.equal(parseDraft(raw),null);});
