// Shared verifier for the explicit approved-gifts CLI and Telegram organizer import.
// No network activity or database writes. Only files under this batch are eligible.
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
const imageRoot=resolve(process.cwd(),'public/images/wishlist-v2/approved-2026-11-04');
export async function verifyApprovedAsset(def){
 if(typeof def?.image!=='string'||!/^\/images\/wishlist-v2\/approved-2026-11-04\/[a-z0-9-]+\.webp$/.test(def.image))return false;
 const file=resolve(process.cwd(),'public'+def.image);
 if(!file.startsWith(imageRoot+sep))return false;
 try{
  if((await stat(file)).size<=1000)return false;
  return (await readFile(file)).subarray(8,12).toString()==='WEBP';
 }catch{return false;}
}
