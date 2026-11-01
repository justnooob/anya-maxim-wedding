// Explicitly synthetic, local QA only. Never imported by production code/migrations.
import {randomUUID} from 'node:crypto';
import {saveItem} from '../../src/server/wishlist/repository.mjs';
export async function seedWishlist(client){
 const definitions=[['Плед для тихих вечеров',2500,'cozy',true],['Кофейная пара',8000,'kitchen',false],['Чемодан для первого путешествия',18000,'travel',false],['Хороший звук дома',35000,'tech',false],['Что-то для дома без указанной цены',null,'home',false]];
 const ids=[];for(const [title,price,category,priority]of definitions)ids.push(await saveItem(client,null,{title,price,category,priority,comment:'Демонстрационный подарок для локального QA. Не утверждённый вишлист.',image:'/images/wishlist-demo.svg',isVisible:true,reservationMode:'single',links:[{label:'Первый магазин',url:'https://example.com/one'},{label:'Другой магазин',url:'https://example.com/two'}]}));
 const session='d'.repeat(64);await client.query("INSERT INTO wishlist_sessions(id,expires_at) VALUES($1,now()+interval '1 year') ON CONFLICT DO NOTHING",[session]);await client.query("INSERT INTO wishlist_reservations(id,wishlist_item_id,reservation_mode,reserver_name,anonymous_session_id,reserved_at) VALUES($1,$2,'single','Тестовый организатор', $3,'2026-10-29T09:00:00Z')",[randomUUID(),ids[3],session]);return ids;
}
