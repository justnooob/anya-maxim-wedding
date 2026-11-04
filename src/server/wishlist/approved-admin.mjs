// One-time, organizer-initiated import of the approved 19-gift batch.
// Only signed Telegram Mini App organizers may preview and explicitly apply.
// Never invoked from startup, migrations, public API or automatic deployments.
import {approvedPreview} from './approved-server.mjs';
import {miniAppUser} from '../telegram/mini-app.mjs';
import {limitedJson} from '../rsvp/session.mjs';
import {transaction} from '../db/index.mjs';
import {importApproved} from './approved-import.mjs';
import {WishlistError} from './validation.mjs';

const reply=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store','Vary':'X-Telegram-Init-Data'}});

/**
 * @param {Request} request
 * @param {{source?: object, env?: NodeJS.ProcessEnv, definitions?: object[], verifyAsset?: (definition: object) => Promise<boolean>}} options
 */
export async function approvedImportAdminRequest(request,{source,env=process.env,definitions,verifyAsset}={}){
 try{miniAppUser(request.headers.get('x-telegram-init-data'),env);}
 catch{return reply({error:'Импорт доступен только организаторам через Telegram.'},403);}
 if(request.method!=='POST')return reply({error:'Метод не поддерживается.'},405);
 let input;
 try{input=await limitedJson(request,512);}catch{return reply({error:'Некорректный запрос.'},400);}
 if(!input||!['preview','apply'].includes(input.action))return reply({error:'Некорректное действие.'},400);
 if(input.action==='apply'&&(input.confirm!=='IMPORT_19_HIDDEN_DRAFTS'||typeof input.previewId!=='string'||!/^[a-f0-9]{64}$/.test(input.previewId)))return reply({error:'Сначала проверь состав импорта и подтверди действие.'},400);
 try{
  const result=await transaction(async client=>{
   const {outcome:before,previewId,canApply}=await approvedPreview(client,definitions,verifyAsset);
   if(input.action==='preview')return {outcome:before,previewId,canApply};
   if(previewId!==input.previewId)throw new WishlistError('Список подарков изменился. Обнови предпросмотр перед импортом.',409);
   if(before.blocked)throw new WishlistError('Некоторые товары не прошли проверку. Импорт заблокирован.',409);
   if(!canApply)throw new WishlistError('Новых подарков для добавления не найдено.',409);
   const outcome=await importApproved(client,definitions,{apply:true,verifyAsset});
   if(outcome.blocked)throw new WishlistError('Импорт заблокирован: не все фотографии проверены.',409);
   if(outcome.items.some(item=>item.status==='CREATED HIDDEN DRAFT')&&outcome.created===0)throw new WishlistError('Неожиданный результат импорта.',503);
   return {outcome,imported:true};
  },source);
  return reply(result);
 }catch(error){
  return reply({error:error instanceof WishlistError?error.message:'Не удалось подключиться к базе. Данные не изменены.'},error instanceof WishlistError?error.status:503);
 }
}
