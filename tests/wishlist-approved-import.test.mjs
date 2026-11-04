import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {importApproved,approvedMatch,productUrl} from '../src/server/wishlist/approved-import.mjs';
import {saveItem,reserveItem} from '../src/server/wishlist/repository.mjs';
import {itemInput} from '../src/server/wishlist/validation.mjs';
import {verifyApprovedAsset} from '../scripts/import-approved-wishlist.mjs';
const original=JSON.parse(fs.readFileSync('src/server/wishlist/approved-2026-11-04.json','utf8'));
const ready=()=>original.map(def=>({...def,image:'/images/wishlist-v2/approved-2026-11-04/synthetic.webp',review:{model:'verified',image:'verified',links:'verified'}}));
async function fixture(){const db=new PGlite();await db.exec(fs.readdirSync('migrations').filter(x=>x.endsWith('.sql')).sort().map(x=>fs.readFileSync('migrations/'+x,'utf8')).join('\n'));return db;}
async function snapshot(db){return Promise.all(['wishlist_items','wishlist_links','wishlist_reservations'].map(async table=>(await db.query('SELECT * FROM '+table+' ORDER BY id')).rows));}
test('approved dry-run changes no records; apply creates 19 hidden drafts once',async()=>{
 const db=await fixture();try{
  const before=await snapshot(db);const defs=ready();
  const preview=await importApproved(db,defs,{verifyAsset:async()=>true});assert.equal(preview.items.length,19);assert.equal(preview.created,0);assert.deepEqual(await snapshot(db),before);
  const applied=await importApproved(db,defs,{apply:true,verifyAsset:async()=>true});assert.equal(applied.created,19);assert.equal((await db.query('SELECT count(*)::int n FROM wishlist_items WHERE is_visible')).rows[0].n,0);
  const saved=await snapshot(db);const again=await importApproved(db,defs,{apply:true,verifyAsset:async()=>true});assert.equal(again.skipped,19);assert.deepEqual(await snapshot(db),saved);
 }finally{await db.close();}
});
test('approved import preserves renamed/hidden/archived matches and every reservation and shop edit',async()=>{
 const db=await fixture();try{
  const defs=ready();const id=await saveItem(db,null,itemInput({...defs[0],title:'Наш Dyson HD16, новое название',isVisible:true}));
  await db.query('UPDATE wishlist_items SET seed_key=$2 WHERE id=$1',[id,defs[0].seedKey]);
  const owner='1'.repeat(64);await db.query("INSERT INTO wishlist_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[owner]);await reserveItem(db,id,owner,'Синтетическая бронь');
  const archived=await saveItem(db,null,itemInput({...defs[1],title:'Переименованные подушки'}));await db.query('UPDATE wishlist_items SET archived_at=now() WHERE id=$1',[archived]);
  const hidden=await saveItem(db,null,itemInput({...defs[2],title:'Белая витрина Скаген, своё название'}));
  const before=await snapshot(db);const result=await importApproved(db,defs,{apply:true,verifyAsset:async()=>true});assert.equal(result.skipped,3);assert.equal(result.created,16);assert.ok(result.items.some(i=>i.status==='SKIP ARCHIVED'));
  const after=await snapshot(db);for(let table=0;table<3;table++)for(const row of before[table])assert.deepEqual(after[table].find(r=>r.id===row.id),row);
  assert.equal((await db.query('SELECT is_visible FROM wishlist_items WHERE id=$1',[hidden])).rows[0].is_visible,false);
 }finally{await db.close();}
});
test('unreviewed, mismatched or missing local assets cannot be imported',async()=>{
 const db=await fixture();try{
  const defs=ready();defs[0].review.model='blocked';defs[1].review.image='pending';defs[2].review.links='pending';
  const result=await importApproved(db,defs,{apply:true,verifyAsset:async def=>def.seedKey!==defs[3].seedKey});assert.equal(result.blocked,4);assert.equal(result.created,15);
 }finally{await db.close();}
});
test('normalized direct URLs and model aliases match renamed archived products conservatively',()=>{
 assert.equal(productUrl('https://www.ozon.ru/product/old-name-12345/?from=search'),productUrl('https://ozon.ru/product/new-name-12345/'));
 assert.equal(productUrl('https://hoff.ru/product/?articul=1&tracking=2'),'hoff.ru/product?articul=1');assert.equal(productUrl('javascript:x'),null);
 const row={id:randomUUID(),title:'Мой G735',archived_at:new Date(),links:[]};assert.equal(approvedMatch(original[6],[row]),row);
 const sameLink={title:'Название организатора',links:[{url:original[16].links[0].url+'?utm_source=test'}]};assert.equal(approvedMatch(original[16],[sameLink]),sameLink);
});
test('runtime startup cannot automatically import this batch',()=>{
 for(const file of ['scripts/start-amvera.mjs','scripts/seed-wishlist.mjs','src/server/wishlist/catalog-seed.mjs'])assert.ok(!fs.readFileSync(file,'utf8').includes('import-approved-wishlist'));
});
test('batch assets are real local WebP; absent or external images never pass the import gate',async()=>{
 for(const def of original){
  if(def.image)assert.equal(await verifyApprovedAsset(def),true,def.seedKey);
  else assert.notEqual(def.review.image,'verified');
 }
 for(const image of ['', 'https://example.org/product.webp','/images/wishlist-v2/gift-1.webp','/images/wishlist-v2/approved-2026-11-04/../gift-1.webp','/images/wishlist-v2/approved-2026-11-04/missing.webp'])assert.equal(await verifyApprovedAsset({image}),false);
});
