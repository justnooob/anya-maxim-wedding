import {randomUUID} from 'node:crypto';
import {resolvedStoreLabel} from '../../content/store-names.mjs';
import {WishlistError} from './validation.mjs';
export async function wishlistData(client,sessionId=null,admin=false){
 const settings=(await client.query('SELECT * FROM wishlist_settings WHERE id=1')).rows[0];
 const categories=(await client.query('SELECT id,title FROM wishlist_categories ORDER BY sort_order,id')).rows;
 const rows=(await client.query('SELECT * FROM wishlist_items WHERE archived_at IS NULL'+(admin?' ORDER BY sort_order,id':' AND is_visible ORDER BY priority DESC,sort_order,id'))).rows;
 const ids=rows.map(row=>row.id);
 const links=ids.length?(await client.query('SELECT * FROM wishlist_links WHERE wishlist_item_id=ANY($1::uuid[]) ORDER BY sort_order,id',[ids])).rows:[];
 const reservations=ids.length?(await client.query("SELECT * FROM wishlist_reservations WHERE wishlist_item_id=ANY($1::uuid[]) AND status='active' ORDER BY reserved_at,id",[ids])).rows:[];
 const items=rows.map(row=>{
  const active=reservations.filter(r=>r.wishlist_item_id===row.id),own=active.find(r=>r.anonymous_session_id===sessionId);
  // Explicit DTO: tokens, owner IDs and history never enter public responses.
  const item={id:row.id,title:row.title,comment:row.comment,category:row.category,price:row.price,currency:row.currency,image:row.image,priority:row.priority,reservationMode:row.reservation_mode,
   links:links.filter(link=>link.wishlist_item_id===row.id).map(link=>({label:resolvedStoreLabel(link.label,link.url),url:link.url})),reserved:active.length>0,available:row.reservation_mode==='multiple'||active.length===0,own:!!own};
  if(settings.show_reserver_names&&active.length)item.reserverNames=active.map(r=>r.reserver_name);
  if(admin)Object.assign(item,{version:row.version,isVisible:row.is_visible,sortOrder:row.sort_order,reservations:active.map(r=>({id:r.id,name:r.reserver_name,reservedAt:r.reserved_at}))});
  return item;
 });
 return {categories,items,...(admin?{showReserverNames:settings.show_reserver_names,stats:{total:items.length,free:items.filter(i=>!i.reserved).length,reserved:items.filter(i=>i.reserved).length,priority:items.filter(i=>i.priority).length}}:{})};
}
async function lockedItem(client,id){const row=(await client.query('SELECT * FROM wishlist_items WHERE id=$1 AND archived_at IS NULL FOR UPDATE',[id])).rows[0];if(!row)throw new WishlistError('Этот подарок больше недоступен.',404);return row;}
export async function reserveItem(client,id,sessionId,name){
 const item=await lockedItem(client,id);if(!item.is_visible)throw new WishlistError('Этот подарок больше недоступен.',404);
 const active=(await client.query("SELECT anonymous_session_id FROM wishlist_reservations WHERE wishlist_item_id=$1 AND status='active'",[id])).rows;
 if(active.some(r=>r.anonymous_session_id===sessionId))return false;
 if(item.reservation_mode==='single'&&active.length)throw new WishlistError('Упс, этот подарок только что кто-то забронировал.',409);
 await client.query('INSERT INTO wishlist_reservations(id,wishlist_item_id,reservation_mode,reserver_name,anonymous_session_id) VALUES($1,$2,$3,$4,$5)',[randomUUID(),id,item.reservation_mode,name,sessionId]);return true;
}
export async function cancelOwn(client,id,sessionId){
 await lockedItem(client,id);
 const result=await client.query("UPDATE wishlist_reservations SET status='cancelled',cancelled_at=now(),cancelled_by='guest' WHERE wishlist_item_id=$1 AND anonymous_session_id=$2 AND status='active' RETURNING id",[id,sessionId]);
 if(!result.rows.length)throw new WishlistError('С этого устройства можно отменить только свою бронь.',403);
}
async function writeLinks(client,id,links){await client.query('DELETE FROM wishlist_links WHERE wishlist_item_id=$1',[id]);for(const [index,link]of links.entries())await client.query('INSERT INTO wishlist_links(id,wishlist_item_id,label,url,sort_order) VALUES($1,$2,$3,$4,$5)',[randomUUID(),id,link.label,link.url,index]);}
export async function saveItem(client,id,data,version){
 const category=(await client.query('SELECT id FROM wishlist_categories WHERE id=$1',[data.category])).rows[0];if(!category)throw new WishlistError('Выбери существующую категорию.');
 const values=[data.title,data.comment,data.category,data.price,data.image,data.priority,data.reservationMode,data.isVisible];
 if(id){const item=await lockedItem(client,id);if(item.version!==version)throw new WishlistError('Подарок уже изменён. Обнови список и повтори.',409);
  if(item.reservation_mode!==data.reservationMode){const any=(await client.query('SELECT id FROM wishlist_reservations WHERE wishlist_item_id=$1 LIMIT 1',[id])).rows[0];if(any)throw new WishlistError('Способ бронирования нельзя менять после появления истории броней. Создай отдельный подарок.');}
  await client.query('UPDATE wishlist_items SET title=$1,comment=$2,category=$3,price=$4,image=$5,priority=$6,reservation_mode=$7,is_visible=$8,updated_at=now(),version=version+1 WHERE id=$9',[...values,id]);
 }else{id=randomUUID();await client.query('INSERT INTO wishlist_items(id,title,comment,category,price,image,priority,reservation_mode,is_visible,sort_order) VALUES($9,$1,$2,$3,$4,$5,$6,$7,$8,(SELECT coalesce(max(sort_order),-1)+1 FROM wishlist_items))',[...values,id]);}
 await writeLinks(client,id,data.links);return id;
}
export async function adminMutation(client,input){
 // Serialize admin edits/order/settings, while reservations lock only their item.
 await client.query('SELECT id FROM wishlist_settings WHERE id=1 FOR UPDATE');
 if(input.action==='privacy'){if(typeof input.showReserverNames!=='boolean')throw new WishlistError('Проверь настройку приватности.');await client.query('UPDATE wishlist_settings SET show_reserver_names=$1 WHERE id=1',[input.showReserverNames]);return;}
 if(input.action==='save')return saveItem(client,input.id||null,input.data,input.version);
 const item=await lockedItem(client,input.id);
 if(input.action==='visibility'){if(typeof input.isVisible!=='boolean')throw new WishlistError('Проверь видимость.');await client.query('UPDATE wishlist_items SET is_visible=$2,version=version+1,updated_at=now() WHERE id=$1',[item.id,input.isVisible]);return;}
 if(input.action==='move'){
  if(![-1,1].includes(input.direction))throw new WishlistError('Некорректный порядок.');
  const rows=(await client.query('SELECT id FROM wishlist_items WHERE archived_at IS NULL ORDER BY sort_order,id FOR UPDATE')).rows;
  const at=rows.findIndex(r=>r.id===item.id),next=at+input.direction;if(next<0||next>=rows.length)return;
  [rows[at],rows[next]]=[rows[next],rows[at]];for(const [index,row]of rows.entries())await client.query('UPDATE wishlist_items SET sort_order=$2,version=version+1,updated_at=now() WHERE id=$1',[row.id,index]);return;
 }
 if(input.confirm!==true)throw new WishlistError('Подтверди действие.');
 if(input.action==='archive'){
  const active=(await client.query("SELECT id FROM wishlist_reservations WHERE wishlist_item_id=$1 AND status='active' LIMIT 1",[item.id])).rows[0];
  if(active&&input.confirmReserved!==true)throw new WishlistError('Этот подарок уже забронирован. Удалить его вместе с бронью?',409);
  await client.query("UPDATE wishlist_reservations SET status='cancelled',cancelled_at=now(),cancelled_by='archive' WHERE wishlist_item_id=$1 AND status='active'",[item.id]);
  await client.query('UPDATE wishlist_items SET archived_at=now(),is_visible=false,version=version+1,updated_at=now() WHERE id=$1',[item.id]);return;
 }
 if(input.action==='cancel'){
  const result=await client.query("UPDATE wishlist_reservations SET status='cancelled',cancelled_at=now(),cancelled_by='admin' WHERE id=$1 AND wishlist_item_id=$2 AND status='active' RETURNING id",[input.reservationId,item.id]);if(!result.rows.length)throw new WishlistError('Бронь уже отменена. Обнови список.',409);return;
 }
 throw new WishlistError('Некорректное действие.');
}
