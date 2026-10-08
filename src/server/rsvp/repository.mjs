import {randomUUID} from 'node:crypto';
import {hash} from './session.mjs';
export async function activeSession(client,token){
  const result=await client.query('SELECT id FROM guest_sessions WHERE id=$1 AND expires_at>now() FOR UPDATE',[hash(token)]);
  return result.rows[0]?.id||null;
}
export async function ownRsvp(client,sessionId){
  const result=await client.query('SELECT * FROM rsvps WHERE session_id=$1',[sessionId]);return result.rows[0]||null;
}
export async function saveRsvp(client,sessionId,data,recipients){
  const existing=await ownRsvp(client,sessionId);if(existing)return {rsvp:existing,created:false};
  const id=randomUUID();
  const result=await client.query('INSERT INTO rsvps(id,session_id,guest_name,attendance,who,food,transfer,overnight,dress_code,alcohol_drinks,alcohol_other,soft_drinks,soft_other) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
    [id,sessionId,data.guestName,data.attendance,data.who,data.food,data.transfer,data.overnight,data.dressCode,data.alcoholDrinks,data.alcoholOther,data.softDrinks,data.softOther]);
  for(const recipient of recipients)await client.query('INSERT INTO telegram_outbox(id,rsvp_id,recipient,payload) VALUES($1,$2,$3,$4)',[randomUUID(),id,recipient,JSON.stringify({notification:true})]);
  return {rsvp:result.rows[0],created:true};
}
export async function allowRate(client,key,limit){
  const bucket=Math.floor(Date.now()/3600000);
  const result=await client.query('INSERT INTO rate_limits(key,bucket,count) VALUES($1,$2,1) ON CONFLICT(key,bucket) DO UPDATE SET count=rate_limits.count+1 RETURNING count',[key,bucket]);
  return result.rows[0].count<=limit;
}
export function publicRsvp(row){return row?{guestName:row.guest_name,attendance:row.attendance}:null;}
