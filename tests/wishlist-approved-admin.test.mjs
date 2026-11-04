import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHmac} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {approvedImportAdminRequest} from '../src/server/wishlist/approved-admin.mjs';
import {saveItem} from '../src/server/wishlist/repository.mjs';
import {itemInput} from '../src/server/wishlist/validation.mjs';

const definitions=JSON.parse(readFileSync('src/server/wishlist/approved-2026-11-04.json','utf8'));
const env={TELEGRAM_BOT_TOKEN:'test-signed-mini-app-token',TELEGRAM_ALLOWED_USER_IDS:'123'};
function signed(userId=123){
 const data=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id:userId})});
 const key=createHmac('sha256','WebAppData').update(env.TELEGRAM_BOT_TOKEN).digest();
 const check=[...data.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('\n');
 data.set('hash',createHmac('sha256',key).update(check).digest('hex'));
 return data.toString();
}
async function fixture(){
 const db=new PGlite();
 await db.exec(readdirSync('migrations').filter(x=>x.endsWith('.sql')).sort().map(x=>readFileSync('migrations/'+x,'utf8')).join('\n'));
 let queue=Promise.resolve();
 const source={async connect(){
  const previous=queue;let release;queue=new Promise(r=>{release=r;});await previous;
  return {query:async(sql,args)=>{const result=await db.query(sql,args);return {...result,rowCount:result.affectedRows};},release};
 }};
 return {db,source,close:()=>db.close()};
}
async function call(source,input,auth=signed(),opts={}){
 const request=new Request('https://wedding.example/api/telegram/wishlist/approved-import',{
  method:'POST',headers:{'content-type':'application/json','x-telegram-init-data':auth},body:JSON.stringify(input)
 });
 const response=await approvedImportAdminRequest(request,{source,env,definitions,verifyAsset:opts.verifyAsset|| (async()=>true)});
 return {status:response.status,data:await response.json()};
}
test('approved import denies unsigned and unauthorized callers before accessing database',async()=>{
 const f=await fixture();try{
  for(const auth of ['',signed(456)]){
   const response=await call(f.source,{action:'preview'},auth);
   assert.equal(response.status,403);
  }
  assert.equal((await f.db.query('SELECT count(*)::int n FROM wishlist_items')).rows[0].n,0);
 }finally{await f.close();}
});
test('signed preview is read-only, explicit confirmed apply imports 19 hidden once',async()=>{
 const f=await fixture();try{
  const before=(await f.db.query('SELECT count(*)::int n FROM wishlist_items')).rows[0].n;
  const preview=await call(f.source,{action:'preview'});
  assert.equal(preview.status,200);assert.equal(preview.data.canApply,true);
  assert.equal(preview.data.outcome.items.filter(x=>x.status==='WOULD CREATE HIDDEN DRAFT').length,19);
  assert.equal((await f.db.query('SELECT count(*)::int n FROM wishlist_items')).rows[0].n,before);
  const refused=await call(f.source,{action:'apply',previewId:preview.data.previewId});
  assert.equal(refused.status,400);
  const applied=await call(f.source,{action:'apply',previewId:preview.data.previewId,confirm:'IMPORT_19_HIDDEN_DRAFTS'});
  assert.equal(applied.status,200);assert.equal(applied.data.outcome.created,19);
  assert.equal((await f.db.query('SELECT count(*)::int n FROM wishlist_items WHERE is_visible=false')).rows[0].n,19);
  assert.equal((await f.db.query('SELECT count(*)::int n FROM wishlist_items WHERE is_visible=true')).rows[0].n,0);
  const again=await call(f.source,{action:'preview'});
  assert.equal(again.data.outcome.skipped,19);assert.equal(again.data.canApply,false);
  assert.equal((await f.db.query('SELECT count(*)::int n FROM wishlist_items')).rows[0].n,19);
 }finally{await f.close();}
});
test('preview version prevents applying a changed live import plan',async()=>{
 const f=await fixture();try{
  const preview=await call(f.source,{action:'preview'});
  const item=definitions[0];
  await saveItem(f.db,null,itemInput(item));
  const response=await call(f.source,{action:'apply',previewId:preview.data.previewId,confirm:'IMPORT_19_HIDDEN_DRAFTS'});
  assert.equal(response.status,409);
  assert.equal((await f.db.query('SELECT count(*)::int n FROM wishlist_items')).rows[0].n,1);
 }finally{await f.close();}
});
test('archived/renamed or existing products are skipped; blocked assets block apply',async()=>{
 const f=await fixture();try{
  const [first,second]=definitions;
  const id=await saveItem(f.db,null,itemInput({...first,title:'Наш фен Dyson HD16',isVisible:true}));
  await f.db.query('UPDATE wishlist_items SET seed_key=$2 WHERE id=$1',[id,first.seedKey]);
  const old=await saveItem(f.db,null,itemInput(second));
  await f.db.query('UPDATE wishlist_items SET archived_at=now() WHERE id=$1',[old]);
  const preview=await call(f.source,{action:'preview'});
  assert.equal(preview.data.outcome.skipped,2);
  assert.equal(preview.data.outcome.items[1].status,'SKIP ARCHIVED');
  const applied=await call(f.source,{action:'apply',previewId:preview.data.previewId,confirm:'IMPORT_19_HIDDEN_DRAFTS'});
  assert.equal(applied.data.outcome.created,17);
  assert.equal((await f.db.query('SELECT is_visible FROM wishlist_items WHERE id=$1',[id])).rows[0].is_visible,true);
  assert.equal((await f.db.query('SELECT archived_at IS NOT NULL AS archived FROM wishlist_items WHERE id=$1',[old])).rows[0].archived,true);
  const blocked=await call(f.source,{action:'preview'},signed(),{verifyAsset:async()=>false});
  assert.equal(blocked.data.outcome.skipped,19);
 }finally{await f.close();}
});
