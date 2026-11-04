import {createHash} from 'node:crypto';
import {importApproved} from './approved-import.mjs';
import {verifyApprovedAsset} from './approved-assets.mjs';
// Shared current-database snapshot for the existing organizer import endpoint.
export async function approvedPreview(client,definitions,verifyAsset=verifyApprovedAsset){
 const outcome=await importApproved(client,definitions,{verifyAsset});
 const rows=(await client.query('SELECT id,version,title,seed_key,archived_at,is_visible FROM wishlist_items ORDER BY id')).rows;
 const links=(await client.query('SELECT wishlist_item_id,url FROM wishlist_links ORDER BY wishlist_item_id,id')).rows;
 const fingerprint=createHash('sha256').update(JSON.stringify({rows,links,definitions})).digest('hex');
 return {outcome,previewId:fingerprint,canApply:outcome.blocked===0&&outcome.items.some(item=>item.status==='WOULD CREATE HIDDEN DRAFT')};
}
