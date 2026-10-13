import {banquetMenu} from '../../content/menu.mjs';
import {drinkChoices} from '../../content/drinks.mjs';
import {rsvpDetail} from '../rsvp/detail.mjs';
const filled=value=>typeof value==='string'&&value.trim().length>0;
export function adminGuest(row){
 const going=row.attendance==='yes';
 return {id:row.id,...rsvpDetail(row),name:row.guest_name,who:going?row.who||'':'',
  hotAppetizer:going?row.hot_appetizer_choice:null,mainCourse:going?row.main_course_choice:null,transfer:going?row.transfer:null,music:going&&filled(row.music_request)?row.music_request:'',
  diet:going&&filled(row.food)?row.food:'',createdAt:row.created_at};
}
export function adminAnalytics(rows){
 const going=rows.filter(row=>row.attendance==='yes');
 const guests=going.map(adminGuest);
 const transfers={kupchino:guests.filter(g=>g.transfer==='kupchino'),pavlovsk:guests.filter(g=>g.transfer==='pavlovsk'),unassigned:guests.filter(g=>g.transfer==='needed')};
 const music=guests.filter(g=>g.music),diet=guests.filter(g=>g.diet);
 const food={};
 for(const [kind,column] of [['hotAppetizer','hot_appetizer_choice'],['mainCourse','main_course_choice']]){
  food[kind]=banquetMenu[kind].options.map(option=>{const selected=guests.filter(g=>g[kind]===option.id).map(({id,name})=>({id,name}));return {...option,count:selected.length,guests:selected};});
  const missing=going.filter(row=>row[column]==null).map(({id,guest_name:name})=>({id,name}));
  if(missing.length)food[kind].push({id:'unspecified',label:'Пока не выбрано',count:missing.length,guests:missing});
 }
 const drinks={};const custom=[];
 for(const kind of ['alcohol','soft']){
  const field=kind==='alcohol'?'alcohol_drinks':'soft_drinks';
  const options=[...drinkChoices[kind].options];
  if(kind==='alcohol')options.push({id:'wine',label:'Вино (цвет не указан)'});
  drinks[kind]=options.filter(o=>o.id!=='other').map(o=>{const selected=going.filter(row=>(row[field]||[]).includes(o.id)).map(({id,guest_name:name})=>({id,name}));return {...o,count:selected.length,guests:selected};}).filter(o=>o.count>0);
  for(const row of going)if((row[field]||[]).includes('other')&&filled(row[kind+'_other']))custom.push({id:row.id,name:row.guest_name,kind,text:row[kind+'_other']});
 }
 return {transfers,music,diet,drinks,custom,food};
}

// All SQL identifiers/order clauses are chosen from fixed sets; user input is bound.
export function guestQuery(params){
 const filters={all:'TRUE',yes:"attendance='yes'",no:"attendance='no'",transfer:"transfer IN ('needed','kupchino','pavlovsk')",kupchino:"transfer='kupchino'",pavlovsk:"transfer='pavlovsk'"};
 const filter=params.get('filter')||'all',sort=params.get('sort')||'oldest';
 const orders={newest:'created_at DESC,id DESC',oldest:'created_at,id',az:'lower(guest_name) COLLATE "C",id',za:'lower(guest_name) COLLATE "C" DESC,id DESC'};
 const transfer=params.get('transfer')||'any',music=params.get('music')||'any',diet=params.get('diet')||'any';
 const alcohol=params.get('alcohol')||'any',soft=params.get('soft')||'any';
 const hotAppetizer=params.get('hotAppetizer')||'any',mainCourse=params.get('mainCourse')||'any';
 const offset=Number(params.get('offset')||0),search=(params.get('search')||'').trim();
 if(![[hotAppetizer,'hotAppetizer'],[mainCourse,'mainCourse']].every(([value,kind])=>value==='any'||banquetMenu[kind].options.some(o=>o.id===value))||!Object.hasOwn(filters,filter)||!Object.hasOwn(orders,sort)||!['any','self','kupchino','pavlovsk'].includes(transfer)||![music,diet].every(v=>['any','yes','no'].includes(v))||
  ![alcohol,soft].every((v,i)=>v==='any'||drinkChoices[i?'soft':'alcohol'].options.some(o=>o.id===v))||search.length>80||!Number.isSafeInteger(offset)||offset<0||offset>10000)throw new Error('Invalid filters');
 const args=[];const clauses=[filters[filter]];const bind=value=>{args.push(value);return '$'+args.length;};
 for(const [value,column] of [[hotAppetizer,'hot_appetizer_choice'],[mainCourse,'main_course_choice']])if(value!=='any')clauses.push(column+'='+bind(value));
 if(search)clauses.push('strpos(lower(guest_name),lower('+bind(search)+'))>0');
 if(transfer!=='any')clauses.push('transfer='+bind(transfer));
 for(const [value,column] of [[music,'music_request'],[diet,'food']])if(value!=='any'){
  const exists="(attendance='yes' AND length(trim(coalesce("+column+",'')))>0)";
  clauses.push(value==='yes'?exists:'NOT '+exists);
 }
 for(const [value,column] of [[alcohol,'alcohol_drinks'],[soft,'soft_drinks']])if(value!=='any')clauses.push(bind(value)+'=ANY('+column+')');
 return {sql:'SELECT * FROM rsvps WHERE '+clauses.join(' AND ')+' ORDER BY '+orders[sort]+' LIMIT 21 OFFSET '+bind(offset),args};
}
