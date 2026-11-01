import {transaction} from '../db/index.mjs';
import {newSession,hash,sessionAge,equalSecret,trustedOrigin,limitedJson} from '../rsvp/session.mjs';
import {allowRate} from '../rsvp/repository.mjs';
import {miniAppUser} from '../telegram/mini-app.mjs';
import {wishlistToken,wishlistCsrf,wishlistCookieHeader} from './session.mjs';
import {wishlistData,reserveItem,cancelOwn,adminMutation} from './repository.mjs';
import {WishlistError,itemInput,reservationName,uuid} from './validation.mjs';
const reply=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie, X-Telegram-Init-Data',...headers}});
const failed=error=>reply({error:error instanceof WishlistError?error.message:'Вишлист временно недоступен. Попробуй ещё раз.'},error instanceof WishlistError?error.status:503);
export async function wishlistRequest(request,{source}={}){
 try{
  if(request.method==='GET'){
   let token=wishlistToken(request),fresh=false;
   const result=await transaction(async client=>{
    let session=token?(await client.query('SELECT id FROM wishlist_sessions WHERE id=$1 AND expires_at>now()',[hash(token)])).rows[0]:null;
    if(!session){if(!await allowRate(client,'wishlist-init:'+hash(request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local'),120))throw new WishlistError('Слишком много запросов. Попробуй позже.',429);token=newSession();fresh=true;session={id:hash(token)};await client.query("INSERT INTO wishlist_sessions(id,expires_at) VALUES($1,now()+($2*interval '1 second'))",[session.id,sessionAge]);}
    return {...await wishlistData(client,session.id),csrf:wishlistCsrf(token)};
   },source);return reply(result,200,fresh?{'Set-Cookie':wishlistCookieHeader(token)}:{});
  }
  if(request.method!=='POST')return reply({error:'Метод не поддерживается.'},405);
  const token=wishlistToken(request);if(!trustedOrigin(request)||!token||!equalSecret(request.headers.get('x-csrf-token'),wishlistCsrf(token)))return reply({error:'Обнови страницу и попробуй снова.'},403);
  let input;try{input=await limitedJson(request,2048);}catch{throw new WishlistError('Проверь данные.');}
  if(!uuid(input?.id)||!['reserve','cancel'].includes(input.action))throw new WishlistError('Некорректное действие.');
  const name=input.action==='reserve'?reservationName(input.name):null;
  if(input.action==='cancel'&&input.confirm!==true)throw new WishlistError('Подтверди отмену брони.');
  const data=await transaction(async client=>{
   const session=(await client.query('SELECT id FROM wishlist_sessions WHERE id=$1 AND expires_at>now()',[hash(token)])).rows[0];if(!session)throw new WishlistError('Сессия устарела. Обнови страницу.',403);
   if(!await allowRate(client,'wishlist-write:'+session.id,80))throw new WishlistError('Слишком много попыток. Попробуй позже.',429);
   if(name!==null)await reserveItem(client,input.id,session.id,name);else await cancelOwn(client,input.id,session.id);
   return {...await wishlistData(client,session.id),csrf:wishlistCsrf(token)};
  },source);return reply(data);
 }catch(error){return failed(error);}
}
export async function wishlistAdminRequest(request,{source,env=process.env}={}){
 try{miniAppUser(request.headers.get('x-telegram-init-data'),env);}catch{return reply({error:'Открой приложение в Telegram с аккаунта организатора.'},403);}
 try{
  if(request.method==='GET')return reply(await transaction(client=>wishlistData(client,null,true),source));
  if(request.method!=='POST')return reply({error:'Метод не поддерживается.'},405);
  let input;try{input=await limitedJson(request,32768);}catch{throw new WishlistError('Проверь данные подарка.');}
  if(!input||!['save','move','visibility','archive','cancel','privacy'].includes(input.action))throw new WishlistError('Некорректное действие.');
  if(input.action==='save'){input.data=itemInput(input.data);if(input.id&&(!uuid(input.id)||!Number.isSafeInteger(input.version)))throw new WishlistError('Обнови подарок.');}
  else if(input.action!=='privacy'&&!uuid(input.id))throw new WishlistError('Некорректный подарок.');
  if(input.action==='cancel'&&!uuid(input.reservationId))throw new WishlistError('Некорректная бронь.');
  const result=await transaction(async client=>{const savedId=await adminMutation(client,input);return {...await wishlistData(client,null,true),savedId};},source);return reply(result);
 }catch(error){return failed(error);}
}
