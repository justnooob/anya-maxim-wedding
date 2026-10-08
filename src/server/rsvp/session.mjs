import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
export const cookieName=process.env.NODE_ENV==='production'?'__Host-wedding_session':'wedding_session';
export const sessionAge=60*60*24*365;
export const hash=value=>createHash('sha256').update(value).digest('hex');
export const newSession=()=>randomBytes(32).toString('hex');
export const validToken=token=>typeof token==='string'&&/^[a-f0-9]{64}$/.test(token);
export const csrfFor=token=>hash('wedding-csrf:'+token);
export function equalSecret(left,right){
  if(typeof left!=='string'||typeof right!=='string'||!left||!right)return false;
  const a=Buffer.from(left),b=Buffer.from(right);
  return a.length===b.length&&timingSafeEqual(a,b);
}
export function cookieHeader(token){
  return cookieName+'='+token+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+sessionAge+(process.env.NODE_ENV==='production'?'; Secure':'');
}
export function requestToken(request){
  const value=request.headers.get('cookie')?.split(';').map(part=>part.trim()).find(part=>part.startsWith(cookieName+'='))?.slice(cookieName.length+1);
  return validToken(value)?value:null;
}
export function trustedOrigin(request){
  const site=process.env.PUBLIC_SITE_URL||(process.env.NODE_ENV==='production'?'':'http://localhost:3000');
  try{return !!site&&new URL(site).origin===request.headers.get('origin');}catch{return false;}
}
export async function limitedJson(request,limit=8192){
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw new Error('Invalid body');
  const reader=request.body?.getReader();if(!reader)throw new Error('Empty body');
  let length=0;const chunks=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit){await reader.cancel();throw new Error('Body too large');}chunks.push(value);}
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
  finally{reader.releaseLock();}
}
