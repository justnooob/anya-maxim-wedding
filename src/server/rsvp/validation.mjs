import {drinkChoices} from '../../content/drinks.mjs';
export class InputError extends Error {constructor(){super('Проверь имя и обязательные ответы.');}}
export function validateRsvp(input){
  if(!input || typeof input!=='object'||Array.isArray(input))throw new InputError();
  const str=(key,max,required=false)=>{
    const value=input[key]??'';
    if(typeof value!=='string')throw new InputError();
    const clean=value.trim().normalize('NFC');
    if(clean.length>max||(required&&!clean)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(clean))throw new InputError();
    return clean;
  };
  const drinks=(kind)=>{
    const values=input[kind+'Drinks']??[];
    const choices=drinkChoices[kind].options.map(option=>option.id);
    if(!Array.isArray(values)||values.length>choices.length||values.some(value=>typeof value!=='string'||!choices.includes(value))||new Set(values).size!==values.length||(values.includes('none')&&values.length!==1))throw new InputError();
    return {selected:choices.filter(id=>values.includes(id)),other:values.includes('other')?str(kind+'Other',120,true):''};
  };
  const guestName=str('guestName',120,true).replace(/\s+/g,' ');
  if(!['yes','no'].includes(input.attendance))throw new InputError();
  if(input.attendance==='no')return {guestName,attendance:'no',who:'',food:'',transfer:null,overnight:null,dressCode:false,alcoholDrinks:[],alcoholOther:'',softDrinks:[],softOther:''};
  if(!['needed','self'].includes(input.transfer)||!['stay','leave'].includes(input.overnight)||input.dressCode!==true)throw new InputError();
  const alcohol=drinks('alcohol'),soft=drinks('soft');
  return {guestName,attendance:'yes',who:str('who',240),food:str('food',600),transfer:input.transfer,overnight:input.overnight,dressCode:true,alcoholDrinks:alcohol.selected,alcoholOther:alcohol.other,softDrinks:soft.selected,softOther:soft.other};
}
