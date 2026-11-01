import {resolvedStoreLabel} from '../../content/store-names.mjs';
export class WishlistError extends Error{constructor(message,status=400){super(message);this.status=status;}}
export const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
function text(value,max,label,required=false,multiline=false){if(typeof value!=='string')throw new WishlistError('Проверь поле «'+label+'».');const result=value.trim();const controls=multiline?/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/:/[\u0000-\u001f\u007f]/;if(result.length>max||(required&&!result)||controls.test(result))throw new WishlistError('Проверь поле «'+label+'».');return result;}
export function reservationName(value){return text(value,80,'Как тебя зовут?',true);}
export function safeUrl(value,{image=false}={}){
 if(typeof value!=='string'||value.length>2048)throw new WishlistError('Некорректная ссылка.');
 if(image&&/^\/images\/[a-zA-Z0-9_./-]+$/.test(value)&&!value.includes('..'))return value;
 try{const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||!url.hostname)throw new Error();return url.href;}catch{throw new WishlistError('Используй ссылку с http:// или https://.');}
}
export function itemInput(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new WishlistError('Проверь данные подарка.');
 const title=text(input.title,140,'Название',true),comment=text(input.comment??'',500,'Комментарий',false,true);
 const category=text(input.category,60,'Категория',true);if(!/^[a-z0-9_-]+$/.test(category))throw new WishlistError('Выбери категорию.');
 const price=input.price??null;
 if(price!==null&&(!Number.isSafeInteger(price)||price<0||price>100000000))throw new WishlistError('Цена должна быть целым числом от 0 до 100 000 000 ₽.');
 for(const key of ['priority','isVisible'])if(typeof input[key]!=='boolean')throw new WishlistError('Проверь настройки подарка.');
 if(!['single','multiple'].includes(input.reservationMode))throw new WishlistError('Выбери способ бронирования.');
 if(input.image!=null&&typeof input.image!=='string')throw new WishlistError('Проверь ссылку фотографии.');
 const image=input.image?safeUrl(input.image,{image:true}):'';
 if(!Array.isArray(input.links)||input.links.length>8)throw new WishlistError('Можно добавить до 8 магазинов.');
 const links=input.links.map(link=>{const url=safeUrl(typeof link?.url==='string'?link.url.trim():link?.url);return {label:text(resolvedStoreLabel(link?.label,url),60,'Магазин',true),url};});
 return {title,comment,category,price,image,priority:input.priority,isVisible:input.isVisible,reservationMode:input.reservationMode,links};
}
