// Keep existing IDs stable: older RSVP rows, drafts and Telegram filters depend on them.
const imageRoot='/images/menu/';
export const hotAppetizerOptions=[
 {id:'hot_meat',label:'Жульен с мясом цыпленка и грибами',shortLabel:'Жульен с цыпленком и грибами',image:imageRoot+'hot-chicken-julienne-card.webp',fullImage:imageRoot+'hot-chicken-julienne-full.webp'},
 {id:'hot_fish',label:'Тарт с копченым лососем и цукини',shortLabel:'Тарт с лососем и цукини',image:imageRoot+'hot-salmon-zucchini-tart-card.webp',fullImage:imageRoot+'hot-salmon-zucchini-tart-full.webp'}
];
export const mainCourseOptions=[
 {id:'main_meat',label:'Стейк «Филе миньон» с трюфельным соусом и картофелем конфи',shortLabel:'Филе миньон с картофелем конфи',image:imageRoot+'main-filet-mignon-card.webp',fullImage:imageRoot+'main-filet-mignon-full.webp'},
 {id:'main_fish',label:'Стейк из лосося со сливочным соусом с овощами гриль',shortLabel:'Лосось со сливочным соусом',image:imageRoot+'main-grilled-salmon-card.webp',fullImage:imageRoot+'main-grilled-salmon-full.webp'}
];
export const banquetMenu={hotAppetizer:{title:'Горячая закуска',options:hotAppetizerOptions},mainCourse:{title:'Основное блюдо',options:mainCourseOptions}};
export const menuHint='Нажми на блюдо, чтобы посмотреть поближе';
export function validMenuChoice(kind,value){return typeof value==='string'&&banquetMenu[kind]?.options.some(option=>option.id===value)===true;}
export function menuLabel(kind,value){return banquetMenu[kind]?.options.find(option=>option.id===value)?.label||'Пока не выбрано';}
