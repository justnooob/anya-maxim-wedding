import {approvedImportAdminRequest} from '../src/server/wishlist/approved-admin.mjs';
import {verifyApprovedAsset} from '../src/server/wishlist/approved-assets.mjs';
const definitions=JSON.parse(fs.readFileSync('src/server/wishlist/approved-2026-11-04.json','utf8'));
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHmac} from 'node:crypto';import {PGlite} from '@electric-sql/pglite';import {wishlistRequest,wishlistAdminRequest} from '../src/server/wishlist/http.mjs';import {saveItem,reserveItem} from '../src/server/wishlist/repository.mjs';import {itemInput} from '../src/server/wishlist/validation.mjs';
const migrations=fs.readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort();
const env={TELEGRAM_BOT_TOKEN:'synthetic-wishlist-key',TELEGRAM_ALLOWED_USER_IDS:'123,456'};
function signed(id=123,date=Math.floor(Date.now()/1000)){const p=new URLSearchParams({auth_date:String(date),user:JSON.stringify({id})});const key=createHmac('sha256','WebAppData').update(env.TELEGRAM_BOT_TOKEN).digest();p.set('hash',createHmac('sha256',key).update([...p.entries()].sort().map(([k,v])=>k+'='+v).join('\n')).digest('hex'));return p.toString();}
const gift=(extra={})=>({title:'Подарок',comment:'Цвет не принципиален',category:'home',price:8000,image:'',priority:false,isVisible:true,reservationMode:'single',links:[{label:'Ozon',url:'https://example.com/ozon'},{label:'Другой магазин',url:'https://example.com/shop'}],...extra});
async function fixture(){const db=new PGlite();await db.exec(migrations.map(n=>fs.readFileSync('migrations/'+n,'utf8')).join('\n'));let tail=Promise.resolve();const source={async connect(){const previous=tail;let release;tail=new Promise(r=>release=r);await previous;return{query:async(s,a)=>{const result=await db.query(s,a);return {...result,rowCount:result.affectedRows};},release};}};return{db,source,close:()=>db.close()};}
async function admin(source,body,auth=signed()){
 const importing=body?.action==='import-preview'||body?.action==='import-apply';
 const payload=importing?{action:body.action==='import-preview'?'preview':'apply',previewId:body.fingerprint,confirm:body.confirm?'IMPORT_19_HIDDEN_DRAFTS':undefined}:body;
 const request=new Request('https://example.com/api/telegram/wishlist'+(importing?'/approved-import':''),{method:body?'POST':'GET',headers:{'x-telegram-init-data':auth,'content-type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{})});
 const response=importing?await approvedImportAdminRequest(request,{source,env,definitions,verifyAsset:verifyApprovedAsset}):await wishlistAdminRequest(request,{source,env});
 const raw=await response.json();return{response,data:importing&&raw.outcome?{...raw.outcome,fingerprint:raw.previewId,canApply:raw.canApply}:raw};
}
async function session(source,cookie=''){const response=await wishlistRequest(new Request('http://localhost:3000/api/wishlist',{headers:{cookie}}),{source});return{cookie:response.headers.get('set-cookie')?.split(';')[0]||cookie,data:await response.json(),response};}
test('new review and import actions always require verified whitelisted Telegram authorization',async()=>{
 const denied={connect(){assert.fail('Unauthorized DB access');}};for(const action of ['replace','review','import-preview','import-apply'])for(const auth of ['',signed(999),signed(123,1),signed()+'x'])assert.equal((await admin(denied,{action},auth)).response.status,403);
});
test('server preview, confirmed hidden import, repeated imports, approval, rejection, restore and replacement',async()=>{const f=await fixture();try{
 const preview=await admin(f.source,{action:'import-preview'});assert.equal(preview.response.status,200);assert.equal(preview.data.items.length,19);assert.equal((await f.db.query('SELECT count(*)::int n FROM wishlist_items')).rows[0].n,0);
 assert.equal((await admin(f.source,{action:'import-apply',confirm:true,fingerprint:'0'.repeat(64)})).response.status,409);
 const applied=await admin(f.source,{action:'import-apply',confirm:true,fingerprint:preview.data.fingerprint});assert.equal(applied.data.created,19);assert.equal((await session(f.source)).data.items.length,0);
 let items=(await admin(f.source)).data.items;assert.ok(items.every(i=>i.reviewStatus==='pending'&&!i.isVisible&&i.batch==='approved-nov-2026'&&i.productModel));let item=items[0];const id=item.id;
 const fresh=()=>admin(f.source).then(r=>r.data.items.find(i=>i.id===id));
 assert.equal((await admin(f.source,{action:'visibility',id,version:item.version,isVisible:true})).response.status,409);
 await admin(f.source,{action:'review',id,version:item.version,status:'approved'});assert.equal((await session(f.source)).data.items.length,0);item=await fresh();
 assert.equal((await admin(f.source,{action:'review',id,version:item.version-1,status:'rejected'})).response.status,409);
 await admin(f.source,{action:'visibility',id,version:item.version,isVisible:true,confirm:true});assert.equal((await session(f.source)).data.items.length,1);item=await fresh();
 await admin(f.source,{action:'visibility',id,version:item.version,isVisible:false});item=await fresh();
 await admin(f.source,{action:'review',id,version:item.version,status:'rejected'});item=await fresh();assert.equal(item.reviewStatus,'rejected');
 const retry=await admin(f.source,{action:'import-preview'});assert.equal(retry.data.skipped,19);const again=await admin(f.source,{action:'import-apply',confirm:true,fingerprint:retry.data.fingerprint});assert.equal(again.response.status,409);assert.equal((await fresh()).reviewStatus,'rejected');
 await admin(f.source,{action:'review',id,version:item.version,status:'pending'});item=await fresh();
 await admin(f.source,{action:'save',id,version:item.version,data:{...item,price:1234,comment:'Новая цена и описание',image:'/images/wishlist-v2/approved-2026-11-04/gift-09.webp',links:[{label:'Ozon',url:'https://www.ozon.ru/product/new-12345/'}]}});item=await fresh();assert.equal(item.price,1234);assert.equal(item.links[0].url,'https://www.ozon.ru/product/new-12345/');assert.match(item.image,/gift-09/);
 await admin(f.source,{action:'replace',id,version:item.version,data:{...item,title:'Совсем другой товар',productModel:'Новая модель',price:5678,isVisible:true}});item=await fresh();assert.equal(item.title,'Совсем другой товар');assert.equal(item.productModel,'Новая модель');assert.equal(item.reviewStatus,'pending');assert.equal(item.isVisible,false);assert.equal((await f.db.query('SELECT count(*)::int n FROM wishlist_items')).rows[0].n,19);
 }finally{await f.close();}});
test('reserved product cannot silently change identity or replace, and reservation history is untouched',async()=>{const f=await fixture();try{
 const id=await saveItem(f.db,null,itemInput(gift()));const owner='a'.repeat(64);await f.db.query("INSERT INTO wishlist_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[owner]);await reserveItem(f.db,id,owner,'Синтетическая бронь');const before=(await f.db.query('SELECT * FROM wishlist_reservations')).rows;
 const item=(await admin(f.source)).data.items[0];for(const action of ['save','replace'])assert.equal((await admin(f.source,{action,id,version:item.version,data:{...item,title:'Другой товар'}})).response.status,409);
 assert.equal((await admin(f.source,{action:'review',id,version:item.version,status:'rejected'})).response.status,409);
 assert.deepEqual((await f.db.query('SELECT * FROM wishlist_reservations')).rows,before);assert.equal((await admin(f.source)).data.items[0].title,item.title);
 }finally{await f.close();}});
test('ambiguous duplicate matches block the whole server import without changing any gift',async()=>{const f=await fixture();try{
 const defs=JSON.parse(fs.readFileSync('src/server/wishlist/approved-2026-11-04.json'));for(const title of ['Первый дубль','Второй дубль'])await saveItem(f.db,null,itemInput({...defs[0],title}));
 const before=(await f.db.query('SELECT * FROM wishlist_items ORDER BY id')).rows;const p=await admin(f.source,{action:'import-preview'});assert.equal(p.data.canApply,false);assert.ok(p.data.items.some(i=>i.status==='BLOCKED CONFLICT'));
 assert.equal((await admin(f.source,{action:'import-apply',confirm:true,fingerprint:p.data.fingerprint})).response.status,409);assert.deepEqual((await f.db.query('SELECT * FROM wishlist_items ORDER BY id')).rows,before);
 }finally{await f.close();}});
