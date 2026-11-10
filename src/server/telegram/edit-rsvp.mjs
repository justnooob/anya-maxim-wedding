import {rsvpLimits,cleanText,textLength,validGuestName} from '../../content/rsvp-limits.mjs';
import {drinkChoices} from '../../content/drinks.mjs';
import {validMenuChoice} from '../../content/menu.mjs';
import {validCongratulation,companionLimit} from '../../content/congratulations.mjs';
import {validPartyInterest} from '../../content/party-interest.mjs';
import {validReturnTransfer} from '../../content/return-transfer.mjs';

// Admins may correct submitted answers, but may NOT forge a guest's venue consent.
export class AdminRsvpEditError extends Error {
 constructor(message,status=400){super(message);this.name='AdminRsvpEditError';this.status=status;}
}
const invalid=(message='Проверь заполненные поля.')=>{throw new AdminRsvpEditError(message);};
const editable=['guestName','attendance','who','partyInterest','congratulationChoice','congratulationCompanion','hotAppetizer','mainCourse','food','musicRequest','transfer','returnTransfer','alcoholDrinks','alcoholOther','softDrinks','softOther','dressCodeConfirmed'];
const column={
 guestName:'guest_name',attendance:'attendance',who:'who',partyInterest:'party_interest',
 congratulationChoice:'congratulation_choice',congratulationCompanion:'congratulation_companion',
 hotAppetizer:'hot_appetizer_choice',mainCourse:'main_course_choice',
 food:'food',musicRequest:'music_request',transfer:'transfer',returnTransfer:'return_transfer',
 alcoholDrinks:'alcohol_drinks',alcoholOther:'alcohol_other',softDrinks:'soft_drinks',softOther:'soft_other',
 dressCodeConfirmed:'dress_code'
};

export function editableRsvp(row){
 return {
  guestName:row.guest_name,attendance:row.attendance,who:row.who||'',
  partyInterest:row.party_interest||'',congratulationChoice:row.congratulation_choice||'',
  congratulationCompanion:row.congratulation_companion||'',
  hotAppetizer:row.hot_appetizer_choice||'',mainCourse:row.main_course_choice||'',
  food:row.food||'',musicRequest:row.music_request||'',transfer:row.transfer||'',
  returnTransfer:row.return_transfer||'',alcoholDrinks:row.alcohol_drinks||[],
  alcoholOther:row.alcohol_other||'',softDrinks:row.soft_drinks||[],softOther:row.soft_other||'',
  dressCodeConfirmed:row.dress_code===true,
  venueRulesAccepted:row.venue_rules_accepted===true,
 };
}
const text=(key,value,required=false)=>{
 if(typeof value!=='string')invalid();
 const clean=cleanText(value);
 if(textLength(clean)>rsvpLimits[key]||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(clean)||(required&&!clean))invalid(key+': проверь текст и ограничение по длине.');
 return clean;
};
const menu=(kind,value)=>{
 if(value===''||value===null)return null;
 if(!validMenuChoice(kind,value))invalid('Некорректный вариант меню.');
 return value;
};
const drinks=(kind,value,existing)=>{
 if(!Array.isArray(value)||value.length>12||value.some(x=>typeof x!=='string'))invalid('Некорректные напитки.');
 const allowed=drinkChoices[kind].options.map(x=>x.id);
 // Early guests could select wine before red/white were split.
 if(kind==='alcohol'&&(existing||[]).includes('wine'))allowed.push('wine');
 if(new Set(value).size!==value.length||value.some(x=>!allowed.includes(x))||(value.includes('none')&&value.length!==1))invalid('Выбери совместимые напитки.');
 return allowed.filter(x=>value.includes(x));
};
const fieldsForNo={
 who:'',partyInterest:null,congratulationChoice:null,congratulationCompanion:null,
 hotAppetizer:null,mainCourse:null,food:'',musicRequest:null,transfer:null,returnTransfer:null,
 alcoholDrinks:[],alcoholOther:'',softDrinks:[],softOther:'',dressCodeConfirmed:false
};

export function prepareAdminRsvpEdit(row,changes,{confirmAttendance=false}={}){
 if(!changes||typeof changes!=='object'||Array.isArray(changes))invalid();
 const keys=Object.keys(changes);
 if(!keys.length||keys.length>editable.length||keys.some(key=>!editable.includes(key)))invalid('Некорректный набор полей.');
 const before=editableRsvp(row),after={...before};
 for(const key of keys){
  const v=changes[key];
  if(key==='guestName'){after[key]=text(key,v,true).replace(/\s+/g,' ');if(!validGuestName(after[key]))invalid('Укажи имя гостя.');}
  else if(key==='attendance'){if(v!=='yes'&&v!=='no')invalid('Некорректный статус.');after[key]=v;}
  else if(key==='who')after[key]=text(key,v,true);
  else if(key==='food'||key==='musicRequest'||key==='alcoholOther'||key==='softOther')after[key]=text(key,v);
  else if(key==='partyInterest'){if(!validPartyInterest(v))invalid('Выбери ответ про девичник или мальчишник.');after[key]=v;}
  else if(key==='congratulationChoice'){if(!validCongratulation(v))invalid('Выбери вариант поздравления.');after[key]=v;}
  else if(key==='congratulationCompanion'){if(typeof v!=='string'||textLength(v)>companionLimit||/[\u0000-\u001f\u007f]/.test(v))invalid('Проверь, с кем будет поздравление.');after[key]=cleanText(v);}
  else if(key==='hotAppetizer'||key==='mainCourse'){if(!validMenuChoice(key,v))invalid('Выбери блюдо.');after[key]=menu(key,v);}
  else if(key==='transfer'){if(!['self','kupchino','pavlovsk'].includes(v))invalid('Выбери трансфер.');after[key]=v;}
  else if(key==='returnTransfer'){if(!validReturnTransfer(v))invalid('Выбери обратный трансфер.');after[key]=v;}
  else if(key==='alcoholDrinks'||key==='softDrinks')after[key]=drinks(key==='alcoholDrinks'?'alcohol':'soft',v,before[key]);
  else if(key==='dressCodeConfirmed'){if(v!==true)invalid('Подтверди, что гость знает о дресс-коде.');after[key]=true;}
 }
 if(after.attendance!==before.attendance&&!confirmAttendance)invalid('Подтверди изменение статуса участия.');
 if(after.attendance==='no'){
  // This removes previous attendance-dependent selections and invalidates consent,
  // but never changes the stable RSVP ID, session, or submission key.
  Object.assign(after,fieldsForNo);
 }else{
  if(!after.who.trim()||!['self','kupchino','pavlovsk'].includes(after.transfer)||
    !after.alcoholDrinks.length||!after.softDrinks.length)invalid('Заполни «Кто вы?», трансфер и напитки.');
  if(after.attendance!==before.attendance){
    if(changes.dressCodeConfirmed!==true)invalid('Подтверди, что гость знает о дресс-коде.');
    if(!validPartyInterest(after.partyInterest)||!validMenuChoice('hotAppetizer',after.hotAppetizer)||
      !validMenuChoice('mainCourse',after.mainCourse)||!validCongratulation(after.congratulationChoice)||
      !validReturnTransfer(after.returnTransfer))invalid('Заполни остальные обязательные ответы.');
  }
  if(after.congratulationChoice==='public_with_someone'){
   if(!after.congratulationCompanion?.trim()||textLength(after.congratulationCompanion)>companionLimit)invalid('Укажи, с кем будет поздравление.');
  }else after.congratulationCompanion='';
  for(const kind of ['alcohol','soft']) {
   const selected=after[kind+'Drinks'],key=kind+'Other';
   if(selected.includes('other')&&!after[key].trim())invalid('Укажи свой вариант напитка.');
   if(!selected.includes('other'))after[key]='';
  }
 }
 const updates={};
 for(const key of editable){
  if(key==='attendance'&&after.attendance===before.attendance)continue;
  if(JSON.stringify(after[key])!==JSON.stringify(before[key]))updates[column[key]]=key==='musicRequest'||key==='partyInterest'||key==='congratulationChoice'||
   key==='congratulationCompanion'||key==='hotAppetizer'||key==='mainCourse'||key==='returnTransfer'
    ?(after[key]||null):after[key];
 }
 // A declined RSVP cannot retain an affirmed venue-rules consent.
 if(after.attendance==='no'&&before.attendance==='yes'){
  updates.venue_rules_accepted=false;
  updates.venue_rules_accepted_at=null;
  updates.venue_rules_version=null;
 }
 // A newly attending guest must explicitly confirm rules in their own form;
 // organizer editing never sets venue_rules_accepted=true.
 if(after.attendance==='yes'&&before.attendance==='no'){
  updates.venue_rules_accepted=false;
  updates.venue_rules_accepted_at=null;
  updates.venue_rules_version=null;
 }
 if(!Object.keys(updates).length)invalid('Ничего не изменилось.');
 return updates;
}

export async function updateAdminRsvp(client,{id,updatedAt,changes,confirmAttendance}){
 if(typeof updatedAt!=='string'||updatedAt.length>50||!Number.isFinite(Date.parse(updatedAt)))invalid('Обнови карточку гостя.');
 const row=(await client.query('SELECT * FROM rsvps WHERE id=$1 FOR UPDATE',[id])).rows[0];
 if(!row)throw new AdminRsvpEditError('Ответ уже удалён.',404);
 if(new Date(row.updated_at).toISOString()!==updatedAt)throw new AdminRsvpEditError('Этот ответ уже изменился. Обнови карточку перед сохранением.',409);
 const updates=prepareAdminRsvpEdit(row,changes,{confirmAttendance:confirmAttendance===true});
 const names=Object.keys(updates),params=names.map(name=>updates[name]);
 params.push(id);
 const set=names.map((name,i)=>name+'=$'+(i+1)).join(', ');
 const result=await client.query('UPDATE rsvps SET '+set+", updated_at=GREATEST(clock_timestamp(),updated_at+interval '1 millisecond') WHERE id=$"+params.length+' RETURNING *',params);
 return result.rows[0];
}
