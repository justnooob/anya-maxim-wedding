import {describeDrinks} from '../../content/drinks.mjs';
// One presentation model for Telegram details and the authenticated Mini App.
export function rsvpDetail(row){
  const fields=[{label:'Имя',value:row.guest_name}];
  if(row.attendance==='yes'){
    fields.push({label:'Кто',value:row.who||'Не указано'},
      {label:'Алкоголь',value:describeDrinks('alcohol',row.alcohol_drinks,row.alcohol_other)},
      {label:'Безалкогольное',value:describeDrinks('soft',row.soft_drinks,row.soft_other)},
      {label:'Трансфер',value:row.transfer==='needed'?'Нужен':'Доедет самостоятельно'});
    if(row.music_request)fields.push({label:'Музыка',value:row.music_request});
    fields.push({label:'Ночёвка',value:row.overnight==='stay'?'Останется':'Уедет'});
    if(row.food)fields.push({label:'Аллергии / особенности питания',value:row.food});
    fields.push({label:'Дресс-код',value:row.dress_code?'Подтверждён':'Не подтверждён'});
  }
  return {status:row.attendance==='yes'?'GOING':'NOT_GOING',fields};
}
export function rsvpDetailText(row){
  const {fields,status}=rsvpDetail(row);
  return row.guest_name+'\n'+(status==='GOING'?'Придёт':'Не придёт')+fields.slice(1).map(field=>'\n'+field.label+': '+field.value).join('');
}
