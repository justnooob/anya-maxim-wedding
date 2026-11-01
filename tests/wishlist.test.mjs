import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID,createHmac} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {wishlistRequest,wishlistAdminRequest} from '../src/server/wishlist/http.mjs';
import {wishlistCookie} from '../src/server/wishlist/session.mjs';
import {itemInput,safeUrl,reservationName} from '../src/server/wishlist/validation.mjs';
import {matchesPrice} from '../src/content/wishlist.mjs';
import {saveItem} from '../src/server/wishlist/repository.mjs';
import {seedInitialWishlist,wishlistSeedKey} from '../src/server/wishlist/seed.mjs';
import {seedWishlistCatalogue,catalogueSeedKey} from '../src/server/wishlist/catalog-seed.mjs';
const migrations=fs.readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort();
test('initial catalogue import refuses unmarked existing gifts and rolls back its marker',async()=>{
 const f=await fixture();try{
  const id=await saveItem({query:(sql,args)=>f.db.query(sql,args)},null,itemInput(gift({title:'Личный подарок'})));
  await assert.rejects(seedInitialWishlist(f.source),/requires review/);
  assert.equal((await f.db.query('SELECT count(*)::int n FROM wishlist_items')).rows[0].n,1);
  assert.equal((await f.db.query('SELECT title FROM wishlist_items WHERE id=$1',[id])).rows[0].title,'Личный подарок');
  assert.equal((await f.db.query('SELECT count(*)::int n FROM app_seed_history WHERE key=$1',[wishlistSeedKey])).rows[0].n,0);
 }finally{await f.close();}
});

test('Catalogue v2 publishes all 54 seed gifts including 12 budget choices and shares records with Mini App',async()=>{const f=await fixture();try{
 await seedInitialWishlist(f.source);assert.deepEqual(await seedWishlistCatalogue(f.source),{applied:true,created:14,updated:40,preserved:0});
 const publicData=(await session(f.source)).data,organizer=(await admin(f.source)).data;
 assert.equal(publicData.items.length,54);assert.equal(organizer.items.length,54);
 assert.deepEqual(new Set(publicData.items.map(i=>i.id)),new Set(organizer.items.map(i=>i.id)));
 assert.equal(publicData.items.filter(i=>matchesPrice(i.price,'low')).length,12);
 for(const item of publicData.items){assert.ok(item.links.length);assert.ok(item.links.every(link=>new URL(link.url).protocol==='https:'));assert.ok(fs.existsSync('public'+item.image));assert.ok(!/[—–]/u.test(item.title+item.comment));}
 const again=await seedWishlistCatalogue(f.source);assert.equal(again.applied,false);assert.equal((await session(f.source)).data.items.length,54);
 assert.equal((await f.db.query('SELECT count(*)::int n FROM app_seed_history WHERE key=$1',[catalogueSeedKey])).rows[0].n,1);
}finally{await f.close();}});

test('Catalogue upgrade preserves organizer edits, hide/archive/order and reservation history',async()=>{const f=await fixture();try{
 await seedInitialWishlist(f.source);const data=(await admin(f.source)).data;
 const [edited,hidden,archived,reserved]=data.items;
 await admin(f.source,{action:'save',id:edited.id,version:edited.version,data:{...edited,title:'Мой подарок',price:123}});
 await admin(f.source,{action:'visibility',id:hidden.id,isVisible:false});
 await admin(f.source,{action:'archive',id:archived.id,confirm:true});
 const owner=await session(f.source);await write(f.source,owner,{action:'reserve',id:reserved.id,name:'Бронь сохраняется'});
 const result=await seedWishlistCatalogue(f.source);assert.equal(result.preserved,4);
 const after=(await admin(f.source)).data;
 assert.equal(after.items.find(i=>i.id===edited.id).title,'Мой подарок');assert.equal(after.items.find(i=>i.id===hidden.id).isVisible,false);assert.ok(!after.items.some(i=>i.id===archived.id));
 assert.equal(after.items.find(i=>i.id===reserved.id).reservations[0].name,'Бронь сохраняется');assert.equal(after.items.find(i=>i.id===reserved.id).image,reserved.image);
}finally{await f.close();}});

test('Catalogue v2 safely recovers legacy seed records without duplicating renamed/archived gifts',async()=>{const f=await fixture();try{
 await seedInitialWishlist(f.source);await f.db.query('UPDATE wishlist_items SET seed_key=NULL');
 const [edited,archived]=(await admin(f.source)).data.items;
 await admin(f.source,{action:'save',id:edited.id,version:edited.version,data:{...edited,title:'Совсем другое имя'}});
 await admin(f.source,{action:'archive',id:archived.id,confirm:true});
 const result=await seedWishlistCatalogue(f.source);assert.equal(result.preserved,2);
 assert.equal((await f.db.query('SELECT count(*)::int n FROM wishlist_items')).rows[0].n,54);
 assert.equal((await f.db.query('SELECT count(*)::int n FROM wishlist_items WHERE archived_at IS NOT NULL')).rows[0].n,1);
}finally{await f.close();}});

test('Visible linkless gift remains public and reservable',async()=>{const f=await fixture();try{
 const id=await saveItem({query:(s,a)=>f.db.query(s,a)},null,gift({links:[]}));const owner=await session(f.source);
 assert.equal(owner.data.items[0].id,id);assert.deepEqual(owner.data.items[0].links,[]);assert.equal((await write(f.source,owner,{action:'reserve',id,name:'Сергей'})).response.status,200);
}finally{await f.close();}});
test('Initial seed commits once; archive/edit/hide/manual items persist across startup simulation',async()=>{const f=await fixture();try{
 const first=await seedInitialWishlist(f.source);assert.deepEqual(first,{applied:true,total:40,published:19,drafts:21});
 let data=(await admin(f.source)).data;assert.equal(data.items.length,40);assert.equal((await session(f.source)).data.items.length,19);assert.ok(data.categories.some(c=>c.id==='experiences'));
 const [archived,edited,hidden]=data.items;
 await admin(f.source,{action:'archive',id:archived.id,confirm:true});
 await admin(f.source,{action:'save',id:edited.id,version:edited.version,data:{...edited,title:'Наше название',price:12345}});
 await admin(f.source,{action:'visibility',id:hidden.id,isVisible:false});
 await admin(f.source,{action:'save',data:gift({title:'Добавлен вручную'})});
 assert.equal((await seedInitialWishlist(f.source)).applied,false);data=(await admin(f.source)).data;
 assert.equal(data.items.length,40);assert.ok(!data.items.some(i=>i.id===archived.id));assert.equal(data.items.find(i=>i.id===edited.id).title,'Наше название');assert.equal(data.items.find(i=>i.id===edited.id).price,12345);assert.equal(data.items.find(i=>i.id===hidden.id).isVisible,false);assert.ok(data.items.some(i=>i.title==='Добавлен вручную'));
 assert.equal((await f.db.query('SELECT count(*)::int n FROM app_seed_history WHERE key=$1',[wishlistSeedKey])).rows[0].n,1);
}finally{await f.close();}});
test('Seed marker rolls back with failed import and allows retry',async()=>{const f=await fixture();try{
 await f.db.query("DELETE FROM wishlist_categories WHERE id='experiences'");await assert.rejects(seedInitialWishlist(f.source));assert.equal((await f.db.query('SELECT count(*)::int n FROM app_seed_history')).rows[0].n,0);assert.equal((await f.db.query('SELECT count(*)::int n FROM wishlist_items')).rows[0].n,0);
 await f.db.query("INSERT INTO wishlist_categories(id,title) VALUES('experiences','Впечатления')");assert.equal((await seedInitialWishlist(f.source)).total,40);
}finally{await f.close();}});
test('Simultaneous initial seed attempts claim a single ledger entry',async()=>{const f=await fixture();try{const results=await Promise.all([seedInitialWishlist(f.source),seedInitialWishlist(f.source)]);assert.equal(results.filter(r=>r.applied).length,1);assert.equal((await f.db.query('SELECT count(*)::int n FROM wishlist_items')).rows[0].n,40);}finally{await f.close();}});
const env={TELEGRAM_BOT_TOKEN:'synthetic-wishlist-key',TELEGRAM_ALLOWED_USER_IDS:'123,456'};
function signed(id=123,date=Math.floor(Date.now()/1000)){const p=new URLSearchParams({auth_date:String(date),user:JSON.stringify({id})});const key=createHmac('sha256','WebAppData').update(env.TELEGRAM_BOT_TOKEN).digest();p.set('hash',createHmac('sha256',key).update([...p.entries()].sort().map(([k,v])=>k+'='+v).join('\n')).digest('hex'));return p.toString();}
const gift=(extra={})=>({title:'Подарок',comment:'Цвет не принципиален',category:'home',price:8000,image:'',priority:false,isVisible:true,reservationMode:'single',links:[{label:'Ozon',url:'https://example.com/ozon'},{label:'Другой магазин',url:'https://example.com/shop'}],...extra});
async function fixture(){const db=new PGlite();await db.exec(migrations.map(n=>fs.readFileSync('migrations/'+n,'utf8')).join('\n'));let tail=Promise.resolve();const source={async connect(){const previous=tail;let release;tail=new Promise(r=>release=r);await previous;return{query:async(s,a)=>{const result=await db.query(s,a);return {...result,rowCount:result.affectedRows};},release};}};return{db,source,close:()=>db.close()};}
async function admin(source,body,auth=signed()){const response=await wishlistAdminRequest(new Request('https://example.com/api/telegram/wishlist',{method:body?'POST':'GET',headers:{'x-telegram-init-data':auth,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),{source,env});return{response,data:await response.json()};}
async function session(source,cookie=''){const response=await wishlistRequest(new Request('http://localhost:3000/api/wishlist',{headers:{cookie}}),{source});return{cookie:response.headers.get('set-cookie')?.split(';')[0]||cookie,data:await response.json(),response};}
async function write(source,owner,body,headers={}){const response=await wishlistRequest(new Request('http://localhost:3000/api/wishlist',{method:'POST',headers:{origin:'http://localhost:3000',cookie:owner.cookie,'content-type':'application/json','x-csrf-token':owner.data.csrf,...headers},body:JSON.stringify(body)}),{source});return{response,data:await response.json()};}
test('Wishlist validation rejects dangerous URLs, invalid price, name and settings',()=>{
 assert.equal(itemInput(gift()).links.length,2);assert.equal(reservationName('  Сергей  '),'Сергей');assert.equal(safeUrl('/images/test.webp',{image:true}),'/images/test.webp');
 for(const url of ['javascript:alert(1)','data:image/svg+xml,x','https://user:password@example.com','/images/../private'])assert.throws(()=>safeUrl(url));
 for(const value of ['', '  ','x'.repeat(81),'a\nB'])assert.throws(()=>reservationName(value));
 for(const patch of [{title:''},{price:-1},{price:NaN},{price:1.5},{category:'bad value'},{priority:'yes'},{isVisible:1},{reservationMode:'none'},{links:[{label:'x',url:'javascript:x'}]}])assert.throws(()=>itemInput(gift(patch)));
});
test('Wishlist price buckets include missing prices only in All and have stable boundaries',()=>{assert.equal(matchesPrice(null,'all'),true);assert.equal(matchesPrice(null,'low'),false);for(const [price,filter]of [[2999,'low'],[3000,'low'],[3001,'middle'],[9999,'middle'],[10000,'high'],[24999,'high'],[25000,'premium']])assert.equal(matchesPrice(price,filter),true);});
test('Wishlist migration works on clean/current schema and retains existing RSVP',async()=>{const db=new PGlite();try{await db.exec(migrations.filter(n=>n<'012').map(n=>fs.readFileSync('migrations/'+n,'utf8')).join('\n'));await db.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",['a'.repeat(64)]);await db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance) VALUES($1,$2,'Сохранённый гость','no')",[randomUUID(),'a'.repeat(64)]);await db.exec(fs.readFileSync('migrations/012_wishlist.sql','utf8'));assert.equal((await db.query('SELECT guest_name FROM rsvps')).rows[0].guest_name,'Сохранённый гость');assert.equal((await db.query('SELECT count(*)::int n FROM wishlist_categories')).rows[0].n,6);assert.equal((await db.query('SELECT count(*)::int n FROM wishlist_items')).rows[0].n,0);}finally{await db.close();}});
test('Every wishlist admin operation denies absent, fake, tampered, expired and non-whitelisted initData before DB access',async()=>{
 const source={connect(){assert.fail('Unauthorized DB access');}};for(const auth of ['', '123', signed()+'x',signed(123,1),signed(999)])for(const action of [undefined,'save','move','visibility','cancel','archive','privacy']){const result=await admin(source,action?{action}:undefined,auth);assert.equal(result.response.status,403);assert.ok(!JSON.stringify(result.data).includes('items'));}
});
test('Wishlist admin CRUD, link order, priority, visibility, privacy and optimistic version',async()=>{const f=await fixture();try{
 const created=await admin(f.source,{action:'save',data:gift()});assert.equal(created.response.status,200);let item=created.data.items[0];const id=item.id;
 const second=await admin(f.source,{action:'save',data:gift({title:'Второй',priority:true,price:null})});assert.equal(second.data.stats.total,2);assert.equal(second.data.stats.priority,1);
 const moved=await admin(f.source,{action:'move',id:second.data.savedId,direction:-1});assert.equal(moved.data.items[0].title,'Второй');
 item=moved.data.items.find(i=>i.id===id);const updated=await admin(f.source,{action:'save',id,version:item.version,data:gift({title:'Изменённый',links:[{label:'Новый',url:'https://example.com/new'}]})});assert.equal(updated.data.items.find(i=>i.id===id).links[0].label,'Новый');
 assert.equal((await admin(f.source,{action:'save',id,version:item.version,data:gift()})).response.status,409);
 await admin(f.source,{action:'visibility',id,isVisible:false});let publicData=(await session(f.source)).data;assert.equal(publicData.items.length,1);assert.equal(publicData.items[0].priority,true);assert.ok(!JSON.stringify(publicData).includes('version'));
 await admin(f.source,{action:'visibility',id,isVisible:true});await admin(f.source,{action:'privacy',showReserverNames:true});assert.equal((await admin(f.source)).data.showReserverNames,true);
 assert.equal((await admin(f.source,{action:'archive',id})).response.status,400);await admin(f.source,{action:'archive',id,confirm:true});assert.equal((await session(f.source)).data.items.length,1);assert.ok((await f.db.query('SELECT archived_at FROM wishlist_items WHERE id=$1',[id])).rows[0].archived_at);
}finally{await f.close();}});
test('Anonymous reserve, private names, own cancel and lost/corrupted cookie isolation',async()=>{const f=await fixture();try{
 const id=await saveItem({query:(s,a)=>f.db.query(s,a)},null,gift());const a=await session(f.source),b=await session(f.source);assert.notEqual(a.cookie,b.cookie);assert.match(a.response.headers.get('set-cookie'),/HttpOnly; SameSite=Lax/);assert.ok(!a.data.csrf.includes(a.cookie.split('=')[1]));
 assert.equal((await write(f.source,a,{action:'reserve',id,name:'Сергей'})).response.status,200);
 const mine=(await session(f.source,a.cookie)).data.items[0];assert.equal(mine.own,true);assert.equal(mine.available,false);assert.ok(!JSON.stringify((await session(f.source,b.cookie)).data).includes('Сергей'));
 assert.equal((await write(f.source,b,{action:'cancel',id,confirm:true,name:'Сергей'})).response.status,403);
 assert.equal((await write(f.source,a,{action:'cancel',id})).response.status,400);assert.equal((await write(f.source,a,{action:'cancel',id,confirm:true})).response.status,200);
 assert.equal((await session(f.source,b.cookie)).data.items[0].available,true);assert.equal((await f.db.query("SELECT cancelled_by FROM wishlist_reservations WHERE status='cancelled'")).rows[0].cancelled_by,'guest');
 const broken=await session(f.source,wishlistCookie+'=broken');assert.equal(broken.response.status,200);assert.notEqual(broken.cookie,wishlistCookie+'=broken');
 assert.equal((await write(f.source,a,{action:'reserve',id,name:'A'},{origin:'https://evil.example'})).response.status,403);assert.equal((await write(f.source,a,{action:'reserve',id,name:'A'},{'x-csrf-token':'bad'})).response.status,403);
}finally{await f.close();}});
test('Two independent sessions race: exactly one winner, controlled conflict and one active DB row',async()=>{const f=await fixture();try{
 const id=await saveItem({query:(s,a)=>f.db.query(s,a)},null,gift());const a=await session(f.source),b=await session(f.source);
 const results=await Promise.all([write(f.source,a,{action:'reserve',id,name:'Первый'}),write(f.source,b,{action:'reserve',id,name:'Второй'})]);assert.deepEqual(results.map(r=>r.response.status).sort(),[200,409]);assert.match(results.find(r=>r.response.status===409).data.error,/только что/);assert.equal((await f.db.query("SELECT count(*)::int n FROM wishlist_reservations WHERE status='active'")).rows[0].n,1);
 // Bypassing repository/application checks still cannot create a second row.
 const owner=(await f.db.query('SELECT id FROM wishlist_sessions ORDER BY id')).rows[0].id;await assert.rejects(f.db.query("INSERT INTO wishlist_reservations(id,wishlist_item_id,reservation_mode,reserver_name,anonymous_session_id) VALUES($1,$2,'single','Bypass',$3)",[randomUUID(),id,owner]),e=>e.code==='23505');
}finally{await f.close();}});
test('Admin can inspect/cancel reservations, archive reserved item needs extra confirmation and history survives',async()=>{const f=await fixture();try{
 const id=await saveItem({query:(s,a)=>f.db.query(s,a)},null,gift());const a=await session(f.source);await write(f.source,a,{action:'reserve',id,name:'Тайное имя'});let item=(await admin(f.source)).data.items[0];assert.equal(item.reservations[0].name,'Тайное имя');
 await admin(f.source,{action:'privacy',showReserverNames:true});assert.deepEqual((await session(f.source)).data.items[0].reserverNames,['Тайное имя']);
 assert.equal((await admin(f.source,{action:'archive',id,confirm:true})).response.status,409);
 await admin(f.source,{action:'cancel',id,reservationId:item.reservations[0].id,confirm:true});assert.equal((await session(f.source)).data.items[0].available,true);
 await write(f.source,a,{action:'reserve',id,name:'Повторная'});await admin(f.source,{action:'archive',id,confirm:true,confirmReserved:true});assert.equal((await session(f.source)).data.items.length,0);assert.equal((await f.db.query('SELECT count(*)::int n FROM wishlist_reservations')).rows[0].n,2);
}finally{await f.close();}});
test('Hidden and archived IDs cannot be reserved; multiple mode supports independent owners',async()=>{const f=await fixture();try{
 const client={query:(s,a)=>f.db.query(s,a)},hidden=await saveItem(client,null,gift({isVisible:false})),multi=await saveItem(client,null,gift({reservationMode:'multiple'}));const a=await session(f.source),b=await session(f.source);
 assert.equal((await write(f.source,a,{action:'reserve',id:hidden,name:'X'})).response.status,404);
 assert.equal((await write(f.source,a,{action:'reserve',id:multi,name:'X'})).response.status,200);assert.equal((await write(f.source,b,{action:'reserve',id:multi,name:'Y'})).response.status,200);assert.equal((await write(f.source,a,{action:'reserve',id:multi,name:'X'})).response.status,200);assert.equal((await f.db.query("SELECT count(*)::int n FROM wishlist_reservations WHERE status='active'")).rows[0].n,2);
 const row=(await admin(f.source)).data.items.find(i=>i.id===multi);assert.equal((await admin(f.source,{action:'save',id:multi,version:row.version,data:gift()})).response.status,400);
}finally{await f.close();}});
