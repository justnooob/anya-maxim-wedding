export const drinkChoices = {
  alcohol: {
    title: 'Что пьем? Шампанское будут все.',
    options: [
      {id:'red_wine',label:'Вино красное'}, {id:'white_wine',label:'Вино белое'}, {id:'cognac',label:'Коньяк'}, {id:'vodka',label:'Водка'},
      {id:'whisky',label:'Виски'}, {id:'rum',label:'Ром'}, {id:'gin',label:'Джин'},
      {id:'jagermeister',label:'Ягермейстер'}, {id:'none',label:'Не пью алкоголь'}, {id:'other',label:'Свой вариант'},
    ],
    otherLabel: 'Твой вариант алкогольного напитка',
  },
  soft: {
    title: 'А безалкогольное?',
    options: [
      {id:'cola',label:'Кола'}, {id:'sprite',label:'Спрайт'}, {id:'fanta',label:'Фанта'}, {id:'tonic',label:'Тоник'},
      {id:'apple_juice',label:'Сок яблочный'}, {id:'multifruit_juice',label:'Сок мультифрукт'}, {id:'orange_juice',label:'Сок апельсиновый'}, {id:'tomato_juice',label:'Сок томатный'},
      {id:'sparkling_water',label:'Вода газированная'}, {id:'still_water',label:'Вода негазированная'},
      {id:'none',label:'Не пью безалкогольное'}, {id:'other',label:'Свой вариант'},
    ],
    otherLabel: 'Твой вариант безалкогольного напитка',
  },
  hint: 'Можно выбрать несколько вариантов.',
};
export function toggleDrink(selected,id){
  if(selected.includes(id))return selected.filter(value=>value!==id);
  if(id==='none')return ['none'];
  return [...selected.filter(value=>value!=='none'),id];
}
export function describeDrinks(kind,selected=[],other=''){
  const choices=drinkChoices[kind];
  return selected.map(id=>id==='other'?'Свой вариант: '+other:id==='wine'&&kind==='alcohol'?'Вино (цвет не указан)':choices.options.find(option=>option.id===id)?.label).filter(Boolean).join(', ')||'Не указано';
}
