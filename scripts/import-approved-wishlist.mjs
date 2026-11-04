// Explicit organizer-only CLI import. Nothing here runs at deploy time.
// Dry-run by default; --apply creates only missing, hidden drafts and leaves
// archived/deleted items, existing edits, links, order, and reservations intact.
import {readFile} from 'node:fs/promises';
import {database,transaction} from '../src/server/db/index.mjs';
import {saveItem} from '../src/server/wishlist/repository.mjs';
import {itemInput} from '../src/server/wishlist/validation.mjs';

const apply=process.argv.includes('--apply');
const definitions=JSON.parse(await readFile(new URL('../src/server/wishlist/approved-2026-11-04.json',import.meta.url),'utf8'));
if(definitions.length!==19||new Set(definitions.map(x=>x.seedKey)).size!==19)throw new Error('Approved gift count/provenance mismatch');
for(const d of definitions){
 if(d.isVisible!==false||!d.seedKey?.startsWith('approved-nov-2026:'))throw new Error('Only unpublished approved drafts can be imported');
 itemInput(d);
}
let source;
try{
 source=database();
 const result=await transaction(async client=>{
  // Matches admin writes and serializes imports without locking public readers.
  await client.query('SELECT id FROM wishlist_settings WHERE id=1 FOR UPDATE');
  const outcome={mode:apply?'APPLY':'DRY RUN',created:0,skipped:0,items:[]};
  for(const def of definitions){
   const match=(await client.query('SELECT id,title,seed_key,archived_at,is_visible FROM wishlist_items WHERE seed_key=$1 OR lower(btrim(title))=lower(btrim($2)) LIMIT 1',[def.seedKey,def.title])).rows[0];
   if(match){outcome.skipped++;outcome.items.push({title:def.title,status:match.archived_at?'SKIP ARCHIVED':'SKIP ALREADY EXISTS'});continue;}
   if(!apply){outcome.items.push({title:def.title,status:'WOULD CREATE HIDDEN DRAFT'});continue;}
   const id=await saveItem(client,null,itemInput(def));
   await client.query('UPDATE wishlist_items SET seed_key=$2 WHERE id=$1',[id,def.seedKey]);
   outcome.created++;outcome.items.push({title:def.title,status:'CREATED HIDDEN DRAFT'});
  }
  return outcome;
 },source);
 console.log(JSON.stringify(result,null,2));
 console.log(apply?'Drafts created. Add confirmed images and enable visibility manually in Telegram Mini App.':'Dry-run only. No data was changed. Append --apply after reviewing all 19 items.');
}catch(error){
 console.error('Wishlist import failed. Transaction was rolled back. '+(error instanceof Error?error.message:String(error)));
 process.exitCode=1;
}finally{if(source)await source.end();}
