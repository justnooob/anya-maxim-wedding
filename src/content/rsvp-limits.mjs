// One character means one Unicode code point after NFC normalization (emoji count as one).
export const rsvpLimits=Object.freeze({guestName:80,who:120,food:300,musicRequest:300,alcoholOther:80,softOther:80});
export const fieldLabels=Object.freeze({guestName:'Имя',who:'Кто вы',food:'Особенности питания',musicRequest:'Музыка',alcoholOther:'Свой вариант алкоголя',softOther:'Свой вариант безалкогольного'});
export function cleanText(value){return value.trim().normalize('NFC');}
export function textLength(value){return [...cleanText(value)].length;}
export function withinLimit(key,value){return typeof value==='string'&&textLength(value)<=rsvpLimits[key];}
export function rsvpReady(data){
 if(!data.guestName.trim()||!withinLimit('guestName',data.guestName)||!['yes','no'].includes(data.attendance))return false;
 if(data.attendance==='no')return true;
 return !!data.who.trim()&&withinLimit('who',data.who)&&withinLimit('food',data.food)&&withinLimit('musicRequest',data.musicRequest)&&
 data.alcoholDrinks.length>0&&data.softDrinks.length>0&&['needed','self'].includes(data.transfer)&&['stay','leave'].includes(data.overnight)&&data.dressCode===true&&
 (!data.alcoholDrinks.includes('other')||(!!data.alcoholOther.trim()&&withinLimit('alcoholOther',data.alcoholOther)))&&
 (!data.softDrinks.includes('other')||(!!data.softOther.trim()&&withinLimit('softOther',data.softOther)));
}
export function attendancePayload(data){return data.attendance==='no'?{guestName:data.guestName,attendance:'no'}:data;}
