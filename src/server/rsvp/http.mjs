import {transaction} from '../db/index.mjs';
import {parseAllowedUserIds} from '../telegram/access.mjs';
import {validateRsvp,InputError} from './validation.mjs';
import {cookieHeader,requestToken,hash,newSession,sessionAge,csrfFor,equalSecret,trustedOrigin,limitedJson} from './session.mjs';
import {activeSession,ownRsvps,saveRsvp,publicRsvp,allowRate} from './repository.mjs';
const reply=(body,status=200,headers={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store',...headers}});
export async function getRsvp(request,source){
  try{
    let token=requestToken(request),setCookie=false;
    const result=await transaction(async client=>{
      let sessionId=token?await activeSession(client,token):null;
      if(!sessionId){
        // IP is used only as a hashed rate-limit key, never saved in plain text.
        const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local';
        if(!await allowRate(client,'init:'+hash(ip),60))return null;
        token=newSession();setCookie=true;sessionId=hash(token);
        await client.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+($2 * interval '1 second'))",[sessionId,sessionAge]);
      }
      const rows=(await ownRsvps(client,sessionId)).map(publicRsvp);
      return {csrf:csrfFor(token),rsvps:rows,rsvp:rows.at(-1)||null,remaining:Math.max(0,2-rows.length)};
    },source);
    if(!result)return reply({error:'Слишком много запросов. Попробуй позже.'},429);
    return reply(result,200,setCookie?{'Set-Cookie':cookieHeader(token)}:{});
  }catch{return reply({error:'Форма временно недоступна. Попробуй чуть позже.'},503);}
}
export async function postRsvp(request,source){
  if(!trustedOrigin(request))return reply({error:'Обнови страницу и попробуй снова.'},403);
  const token=requestToken(request);
  if(!token||!equalSecret(request.headers.get('x-csrf-token'),csrfFor(token)))return reply({error:'Обнови страницу и попробуй снова.'},403);
  let data;
  try{data=validateRsvp(await limitedJson(request));}
  catch(error){return reply({error:error instanceof InputError?error.message:'Проверь данные формы.'},400);}
  try{
    const recipients=parseAllowedUserIds(process.env.TELEGRAM_ALLOWED_USER_IDS||'');
    const result=await transaction(async client=>{
      const sessionId=await activeSession(client,token);if(!sessionId)return {expired:true};
      if(!await allowRate(client,'submit:'+sessionId,20))return {limited:true};
      const saved=await saveRsvp(client,sessionId,data,recipients);
      return {...saved,rsvps:(await ownRsvps(client,sessionId)).map(publicRsvp)};
    },source);
    if(result.expired)return reply({error:'Сессия истекла. Обнови страницу.'},403);
    if(result.limited)return reply({error:'Слишком много запросов. Попробуй позже.'},429);
    if(result.full)return reply({error:'На этом устройстве уже сохранены два ответа.',rsvps:result.rsvps,remaining:0},409);
    return reply({rsvp:publicRsvp(result.rsvp),rsvps:result.rsvps,remaining:Math.max(0,2-result.rsvps.length),created:result.created},result.created?201:200);
  }catch{return reply({error:'Не удалось сохранить ответ. Попробуй ещё раз.'},503);}
}
