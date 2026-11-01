// Explicit, one-time catalogue upgrade. Never run this module in a request handler.
import {readFile} from 'node:fs/promises';
import {transaction} from '../db/index.mjs';
import {saveItem} from './repository.mjs';
import {itemInput} from './validation.mjs';
import {wishlistSeedKey} from './seed.mjs';

export const catalogueSeedKey='wishlist-catalog-v2';
export async function seedWishlistCatalogue(source){
 return transaction(async client=>{
  const claim=await client.query('INSERT INTO app_seed_history(key,version) VALUES($1,2) ON CONFLICT DO NOTHING RETURNING key',[catalogueSeedKey]);
  const result={applied:!!claim.rows.length,created:0,updated:0,preserved:0};
  if(!result.applied)return result;
  await client.query('SELECT id FROM wishlist_settings WHERE id=1 FOR UPDATE');
  const initial=(await client.query('SELECT key FROM app_seed_history WHERE key=$1',[wishlistSeedKey])).rows.length;
  if(!initial)throw new Error('Initial catalogue import required before catalogue v2');
  const definitions=JSON.parse(await readFile(new URL('./catalog-v2.json',import.meta.url),'utf8'));
  const legacy=JSON.parse(await readFile(new URL('./initial-v1.json',import.meta.url),'utf8'));
  for(const definition of definitions){
   const data=itemInput(definition);
   let row=(await client.query('SELECT * FROM wishlist_items WHERE seed_key=$1 FOR UPDATE',[definition.seedKey])).rows[0];
   if(!row&&definition.seedKey.startsWith('initial-v1:')){
    // Older v1 importers had no provenance column. Recover only an unambiguous
    // original title, including archived rows. Never recreate a renamed gift.
    const title=legacy[Number(definition.seedKey.split(':')[1])-1]?.title;
    const matches=(await client.query('SELECT * FROM wishlist_items WHERE seed_key IS NULL AND title=$1 FOR UPDATE',[title])).rows;
    if(matches.length===1){row=matches[0];await client.query('UPDATE wishlist_items SET seed_key=$2 WHERE id=$1',[row.id,definition.seedKey]);}
    else{result.preserved++;continue;}
   }
   if(row){
    const history=(await client.query('SELECT id FROM wishlist_reservations WHERE wishlist_item_id=$1 LIMIT 1',[row.id])).rows.length;
    // Explicit organizer edits, visibility, order, archives and reservation
    // history take precedence over defaults, including replacement product data.
    if(row.archived_at||row.version!==1||history){result.preserved++;continue;}
    await saveItem(client,row.id,data,row.version);result.updated++;
   }else{
    const id=await saveItem(client,null,data);
    await client.query('UPDATE wishlist_items SET seed_key=$2 WHERE id=$1',[id,definition.seedKey]);result.created++;
   }
  }
  return result;
 },source);
}
