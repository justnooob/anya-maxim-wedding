// Organizer-only command. No startup/deploy integration.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {database,transaction} from '../src/server/db/index.mjs';
import {importApproved,validateApproved} from '../src/server/wishlist/approved-import.mjs';
export {verifyApprovedAsset} from '../src/server/wishlist/approved-assets.mjs';
import {verifyApprovedAsset} from '../src/server/wishlist/approved-assets.mjs';
async function main(){
 let source;
 try{
  const definitions=JSON.parse(await readFile(new URL('../src/server/wishlist/approved-2026-11-04.json',import.meta.url),'utf8'));
  validateApproved(definitions);source=database();const apply=process.argv.includes('--apply');
  const outcome=await transaction(client=>importApproved(client,definitions,{apply,verifyAsset:verifyApprovedAsset}),source);
  console.log(JSON.stringify(outcome,null,2));
  console.log(apply?'Only verified missing hidden drafts were created. Existing items and reservations were not changed.':'Dry-run only. No data changed. Review skips/blocks before explicitly using --apply.');
 }catch(error){
  // Never echo raw pg/network errors: they may contain credentials.
  const code=typeof error?.code==='string'&&/^[A-Z0-9_]{2,30}$/.test(error.code)?error.code:'UNAVAILABLE';
  console.error('Wishlist import failed ('+code+'). No batch changes committed. Check configuration and review report; sensitive details hidden.');process.exitCode=1;
 }finally{if(source)await source.end();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
