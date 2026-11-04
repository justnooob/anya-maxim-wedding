// Explicit batch import only. Never called by application startup or migrations.
import {itemInput} from './validation.mjs';
import {saveItem} from './repository.mjs';
const normalize=value=>String(value??'').normalize('NFKC').toLowerCase().replaceAll('ё','е').replace(/[^a-zа-я0-9]/gu,'');
export function productUrl(value){
 try{
  const url=new URL(value);const host=url.hostname.toLowerCase().replace(/^www\./,'');
  if(!['https:','http:'].includes(url.protocol))return null;
  // Searches/categories/store fronts are not product identities; otherwise
  // unrelated Ozon search results would incorrectly collapse into one gift.
  if(!url.pathname.replaceAll('/','')||/\/(search|category|categories)(\/|$)/i.test(url.pathname)||url.pathname==='/store/')return null;
  if(host==='ozon.ru'){const id=url.pathname.match(/-(\d+)\/?$/)?.[1];if(id)return host+'/product/'+id;}
  if(host.endsWith('wildberries.ru')){const id=url.pathname.match(/\/catalog\/(\d+)/)?.[1];if(id)return 'wildberries.ru/catalog/'+id;}
  const article=url.searchParams.get('articul');
  return host+decodeURI(url.pathname).replace(/\/+$/,'').toLowerCase()+(article?'?articul='+article:'');
 }catch{return null;}
}
export function approvedMatch(def,rows){
 const urls=new Set(def.links.map(link=>productUrl(link.url)).filter(Boolean));const model=normalize(def.modelIdentity);
 return rows.find(row=>row.seed_key===def.seedKey||normalize(row.title)===normalize(def.title)||
  (model&&normalize(row.title).includes(model))||
  (def.identityAliases??[]).some(alias=>normalize(row.title).includes(normalize(alias)))||
  row.links?.some(link=>urls.has(productUrl(link.url))));
}
export function validateApproved(definitions){
 if(definitions.length!==19||new Set(definitions.map(x=>x.seedKey)).size!==19||new Set(definitions.map(x=>normalize(x.title))).size!==19)throw new Error('Approved batch must contain 19 unique gifts');
 for(const def of definitions){if(def.isVisible!==false||!/^approved-nov-2026:\d{2}$/.test(def.seedKey))throw new Error('Only hidden approved drafts are allowed');itemInput(def);}
}
export async function importApproved(client,definitions,{apply=false,verifyAsset=async()=>false}={}){
 validateApproved(definitions);
 // Same lock as Mini App admin writes. Include archived and hidden records.
 await client.query('SELECT id FROM wishlist_settings WHERE id=1 FOR UPDATE');
 const rows=(await client.query('SELECT id,title,seed_key,archived_at,is_visible FROM wishlist_items ORDER BY id')).rows;
 const links=(await client.query('SELECT wishlist_item_id,url FROM wishlist_links')).rows;
 for(const row of rows)row.links=links.filter(link=>link.wishlist_item_id===row.id);
 const outcome={mode:apply?'APPLY':'DRY RUN',created:0,skipped:0,blocked:0,items:[]};
 for(const def of definitions){
  const match=approvedMatch(def,rows);
  if(match){outcome.skipped++;outcome.items.push({seedKey:def.seedKey,title:def.title,status:match.archived_at?'SKIP ARCHIVED':'SKIP ALREADY EXISTS'});continue;}
  const ready=def.review?.model==='verified'&&def.review?.image==='verified'&&def.review?.links==='verified'&&await verifyAsset(def);
  if(!ready){outcome.blocked++;outcome.items.push({seedKey:def.seedKey,title:def.title,status:'BLOCKED REVIEW',reason:def.review?.note||'Model, local image and direct shop links must be verified'});continue;}
  if(!apply){outcome.items.push({seedKey:def.seedKey,title:def.title,status:'WOULD CREATE HIDDEN DRAFT'});continue;}
  const id=await saveItem(client,null,itemInput(def));await client.query('UPDATE wishlist_items SET seed_key=$2 WHERE id=$1',[id,def.seedKey]);
  rows.push({id,title:def.title,seed_key:def.seedKey,links:def.links});outcome.created++;outcome.items.push({seedKey:def.seedKey,title:def.title,status:'CREATED HIDDEN DRAFT'});
 }
 return outcome;
}
