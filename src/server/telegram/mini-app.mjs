import {createHmac,timingSafeEqual} from 'node:crypto';
import {parseAllowedUserIds} from './access.mjs';
import {transaction} from '../db/index.mjs';
import {adminReply} from './admin.mjs';
import {rsvpDetail} from '../rsvp/detail.mjs';
import {limitedJson} from '../rsvp/session.mjs';
export function miniAppUser(raw,env=process.env,now=Math.floor(Date.now()/1000)){
  if(typeof raw!=='string'||!raw||raw.length>8192||!env.TELEGRAM_BOT_TOKEN)throw new Error('Denied');
  const values=new URLSearchParams(raw);
  if(new Set(values.keys()).size!==[...values.keys()].length)throw new Error('Denied');
  const hash=values.get('hash');if(!/^[a-f0-9]{64}$/.test(hash||''))throw new Error('Denied');
  values.delete('hash');
  const check=[...values.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,value])=>key+'='+value).join('\n');
  const key=createHmac('sha256','WebAppData').update(env.TELEGRAM_BOT_TOKEN).digest();
  const expected=createHmac('sha256',key).update(check).digest();
  if(!timingSafeEqual(expected,Buffer.from(hash,'hex')))throw new Error('Denied');
  const date=Number(values.get('auth_date'));
  if(!Number.isSafeInteger(date)||date>now+30||date<now-3600)throw new Error('Denied');
  const user=JSON.parse(values.get('user')||'null');
  if(!Number.isSafeInteger(user?.id)||user.id<=0||user.is_bot===true||!parseAllowedUserIds(env.TELEGRAM_ALLOWED_USER_IDS||'').has(String(user.id)))throw new Error('Denied');
  return String(user.id);
}
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
const response=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Vary':'X-Telegram-Init-Data'}});
export async function miniAppRequest(request,{source,env=process.env}={}){
  let userId;try{userId=miniAppUser(request.headers.get('x-telegram-init-data'),env);}catch{return response({error:'Открой приложение в Telegram с аккаунта организатора.'},403);}
  try{
    const url=new URL(request.url);
    if(request.method==='GET')return await transaction(async client=>{
      const id=url.searchParams.get('id');
      if(id){if(!uuid(id))return response({error:'Некорректный ответ.'},400);const row=(await client.query('SELECT * FROM rsvps WHERE id=$1',[id])).rows[0];return row?response({guest:{id:row.id,...rsvpDetail(row)}}):response({error:'Ответ уже удалён.'},404);}
      const filter=url.searchParams.get('filter')||'all';
      const predicates={all:'TRUE',yes:"attendance='yes'",no:"attendance='no'",transfer:"transfer='needed'",overnight:"overnight='stay'"};
      if(!Object.hasOwn(predicates,filter))return response({error:'Некорректный фильтр.'},400);
      const offset=Number(url.searchParams.get('offset')||0);if(!Number.isSafeInteger(offset)||offset<0||offset>10000)return response({error:'Некорректная страница.'},400);
      const stats=(await client.query("SELECT count(*)::int total,count(*) FILTER(WHERE attendance='yes')::int going,count(*) FILTER(WHERE attendance='no')::int not_going,count(*) FILTER(WHERE transfer='needed')::int transfer,count(*) FILTER(WHERE overnight='stay')::int overnight FROM rsvps")).rows[0];
      const rows=(await client.query('SELECT * FROM rsvps WHERE '+predicates[filter]+' ORDER BY created_at,id LIMIT 21 OFFSET $1',[offset])).rows;
      return response({stats,guests:rows.slice(0,20).map(row=>({id:row.id,...rsvpDetail(row)})),hasMore:rows.length>20});
    },source);
    if(request.method==='POST'){
      let input;try{input=await limitedJson(request,2048);}catch{return response({error:'Некорректный запрос.'},400);}
      const command=input?.action==='delete'&&uuid(input.id)?'delete:'+input.id:input?.action==='confirm'&&typeof input.token==='string'&&/^[a-f0-9]{32}$/.test(input.token)?'confirm:'+input.token:null;
      if(!command)return response({error:'Некорректное действие.'},400);
      return await transaction(async client=>{
        const reply=await adminReply(client,userId,command);
        const data=reply.reply_markup?.inline_keyboard?.[0]?.[0]?.callback_data;
        return response({message:reply.text,...(data?.startsWith('confirm:')?{confirmation:data.slice(8)}:{})});
      },source);
    }
    return response({error:'Метод не поддерживается.'},405);
  }catch{return response({error:'Сервис временно недоступен.'},503);}
}
