import {drinkChoices} from '../../content/drinks.mjs';
import {rsvpLimits,fieldLabels,cleanText,textLength} from '../../content/rsvp-limits.mjs';
export class InputError extends Error {constructor(message='Проверь имя и обязательные ответы.'){super(message);this.name='InputError';}}
export function validateRsvp(input){
  if(!input || typeof input!=='object'||Array.isArray(input))throw new InputError();
  if(input.submissionKey!==undefined&&(typeof input.submissionKey!=='string'||! /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(input.submissionKey)))throw new InputError('Обнови статус формы и попробуй снова.');
  const submission=input.submissionKey?{submissionKey:input.submissionKey}:{};
  const str=(key,required=false)=>{
    const value=input[key]??'';
    if(typeof value!=='string')throw new InputError();
    const clean=cleanText(value);
    if(textLength(clean)>rsvpLimits[key])throw new InputError(fieldLabels[key]+': не больше '+rsvpLimits[key]+' символов.');
    if((required&&!clean)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(clean))throw new InputError();
    return clean;
  };
  const drinks=(kind)=>{
    const values=input[kind+'Drinks']??[];
    const choices=drinkChoices[kind].options.map(option=>option.id);
    if(!Array.isArray(values)||values.length===0||values.length>choices.length||values.some(value=>typeof value!=='string'||!choices.includes(value))||new Set(values).size!==values.length||(values.includes('none')&&values.length!==1))throw new InputError();
    return {selected:choices.filter(id=>values.includes(id)),other:values.includes('other')?str(kind+'Other',true):''};
  };
  const guestName=str('guestName',true).replace(/\s+/g,' ');
  if(!['yes','no'].includes(input.attendance))throw new InputError();
  if(input.attendance==='no')return {...submission,guestName,attendance:'no',who:'',food:'',transfer:null,overnight:null,dressCode:false,alcoholDrinks:[],alcoholOther:'',softDrinks:[],softOther:'',musicRequest:null};
  if(!['needed','self'].includes(input.transfer)||!['stay','leave'].includes(input.overnight)||input.dressCode!==true)throw new InputError();
  const alcohol=drinks('alcohol'),soft=drinks('soft');
  return {...submission,guestName,attendance:'yes',who:str('who',true),food:str('food'),musicRequest:str('musicRequest')||null,transfer:input.transfer,overnight:input.overnight,dressCode:true,alcoholDrinks:alcohol.selected,alcoholOther:alcohol.other,softDrinks:soft.selected,softOther:soft.other};
}
