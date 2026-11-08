import {validCongratulation} from '../content/congratulations.mjs';
import {validReturnTransfer} from '../content/return-transfer.mjs';
import {validPartyInterest} from '../content/party-interest.mjs';
// Browser-only, versioned guest input. Never store cookies, CSRF, or session tokens here.
export const DRAFT_KEY='anya-maxim-rsvp-draft-v2';
export const LEGACY_DRAFT_KEY='anya-maxim-rsvp-draft-v1';
const texts=['name','who','food','musicRequest','alcoholOther','softOther','hotAppetizer','mainCourse'];
export function parseDraft(raw){
 try{
  const value=JSON.parse(raw);if(![1,2].includes(value?.version)||!value.fields||typeof value.fields!=='object')return null;
  const f=value.fields;if(![null,'yes','no'].includes(f.attendance))return null;
  for(const key of texts)if(typeof f[key]!=='string'||f[key].length>1000)return null;
  for(const key of ['alcoholDrinks','softDrinks'])if(!Array.isArray(f[key])||f[key].length>20||f[key].some(v=>typeof v!=='string'||v.length>80))return null;
  if(!['','self','kupchino','pavlovsk'].includes(f.transfer)||typeof f.dress!=='boolean'||typeof f.venueRules!=='boolean')return null;
  const partyInterest=f.partyInterest??'';if(partyInterest!==''&&!validPartyInterest(partyInterest))return null;
  const returnTransfer=f.returnTransfer??'';if(returnTransfer!==''&&!validReturnTransfer(returnTransfer))return null;
  const congratulation=value.version===1?{congratulationChoice:'',congratulationCompanion:''}:{congratulationChoice:f.congratulationChoice,congratulationCompanion:f.congratulationCompanion};
  if((congratulation.congratulationChoice!==''&&!validCongratulation(congratulation.congratulationChoice))||typeof congratulation.congratulationCompanion!=='string'||[...congratulation.congratulationCompanion].length>1000)return null;
  return {...congratulation,name:f.name,attendance:f.attendance,who:f.who,partyInterest,food:f.food,musicRequest:f.musicRequest,alcoholOther:f.alcoholOther,softOther:f.softOther,hotAppetizer:f.hotAppetizer,mainCourse:f.mainCourse,transfer:f.transfer,returnTransfer,alcoholDrinks:f.alcoholDrinks,softDrinks:f.softDrinks,dress:f.dress,venueRules:f.venueRules};
 }catch{return null;}
}
