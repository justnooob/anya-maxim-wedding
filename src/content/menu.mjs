export const hotAppetizerOptions=[{id:'hot_meat',label:'Мясная горячая закуска',shortLabel:'Мясная'},{id:'hot_fish',label:'Рыбная горячая закуска',shortLabel:'Рыбная'}];
export const mainCourseOptions=[{id:'main_meat',label:'Мясное основное блюдо',shortLabel:'Мясное'},{id:'main_fish',label:'Рыбное основное блюдо',shortLabel:'Рыбное'}];
export const banquetMenu={hotAppetizer:{title:'Горячая закуска',options:hotAppetizerOptions},mainCourse:{title:'Основное блюдо',options:mainCourseOptions}};
export const menuHint='Выберите один вариант';
export function validMenuChoice(kind,value){return typeof value==='string'&&banquetMenu[kind]?.options.some(option=>option.id===value)===true;}
export function menuLabel(kind,value){return banquetMenu[kind]?.options.find(option=>option.id===value)?.label||'Пока не выбрано';}
