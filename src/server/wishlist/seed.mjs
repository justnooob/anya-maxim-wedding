// Server/CLI only. This module is never imported by public or Mini App components.
import {readFile} from 'node:fs/promises';
import {saveItem} from './repository.mjs';
import {itemInput} from './validation.mjs';
import {transaction} from '../db/index.mjs';
export const wishlistSeedKey='wishlist-initial-v1';
export async function seedInitialWishlist(source){
 return transaction(async client=>{
  // The marker and records commit together. A concurrent importer waits on the
  // unique key; it cannot create a second copy or replay defaults over edits.
  const claim=await client.query('INSERT INTO app_seed_history(key,version) VALUES($1,1) ON CONFLICT DO NOTHING RETURNING key',[wishlistSeedKey]);
  if(!claim.rows.length)return {applied:false,total:0,published:0,drafts:0};
  await client.query('SELECT id FROM wishlist_settings WHERE id=1 FOR UPDATE');
  // An unmarked non-empty production catalogue may contain organizer-owned
  // records. Do not guess provenance, duplicate them or overwrite edits.
  if((await client.query('SELECT id FROM wishlist_items LIMIT 1')).rows.length)throw new Error('Existing unmarked catalogue requires review');
  const definitions=JSON.parse(await readFile(new URL('./initial-v1.json',import.meta.url),'utf8'));
  for(const [index,definition]of definitions.entries()){
   const id=await saveItem(client,null,itemInput(definition));
   await client.query('UPDATE wishlist_items SET seed_key=$2 WHERE id=$1',[id,'initial-v1:'+String(index+1).padStart(2,'0')]);
  }
  const published=definitions.filter(i=>i.isVisible).length;
  return {applied:true,total:definitions.length,published,drafts:definitions.length-published};
 },source);
}
