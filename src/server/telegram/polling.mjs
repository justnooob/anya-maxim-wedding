import {setTimeout as delay} from 'node:timers/promises';
import {transaction} from '../db/index.mjs';
import {handleAdminUpdate,updateSender} from './admin.mjs';
import {drainOutbox} from './outbox.mjs';
export async function pause(ms,signal){try{await delay(ms,undefined,{signal});}catch{if(!signal.aborted)throw new Error('Worker delay failed');}}
// Static diagnostics: never expose raw errors, request URLs or credentials.
export function reportFailure(stage,error){
 const code=Number.isInteger(error?.code)&&error.code>=400&&error.code<=599?error.code:0;
 console.error('Bot worker retry: '+stage+'; Telegram code: '+code+'. Sensitive details hidden.');
}
export async function retry(work,{signal,stage,wait=pause,report=reportFailure}={}){
 let failures=0;
 while(!signal.aborted){
  try{return await work();}catch(error){
   if(signal.aborted)break;
   report(stage,error);
   await wait(Math.min(30000,1000*2**Math.min(failures++,5))+Math.floor(Math.random()*500),signal);
  }
 }
}
// Commit effects and offset together before acknowledging updates with getUpdates.
export async function acceptUpdate(source,botId,update,allowedIds){
 if(!Number.isSafeInteger(update?.update_id)||update.update_id<0)throw new Error('Invalid update');
 await transaction(async client=>{
  const state=(await client.query('SELECT next_offset FROM telegram_polling_state WHERE bot_id=$1 FOR UPDATE',[botId])).rows[0];
  if(!state)throw new Error('Missing polling state');
  if(update.update_id<Number(state.next_offset))return;
  if(allowedIds.has(updateSender(update)))await handleAdminUpdate(client,update,allowedIds);
  await client.query('UPDATE telegram_polling_state SET next_offset=$2,updated_at=now() WHERE bot_id=$1',[botId,update.update_id+1]);
 },source);
}
export async function poll({source,botId,api,allowedIds,signal}){
 while(!signal.aborted){
  await retry(async()=>{
   const state=(await source.query('SELECT next_offset FROM telegram_polling_state WHERE bot_id=$1',[botId])).rows[0];
   const updates=await api('getUpdates',{offset:Number(state.next_offset),timeout:20,limit:50,allowed_updates:['message','callback_query']},signal);
   if(!Array.isArray(updates))throw new Error('Invalid updates response');
   for(const update of updates){
    if(signal.aborted)return;
    await acceptUpdate(source,botId,update,allowedIds);
    if(update.callback_query&&allowedIds.has(updateSender(update))){
     try{await api('answerCallbackQuery',{callback_query_id:update.callback_query.id},signal);}catch{/* Durable reply already queued. */}
    }
   }
  },{signal,stage:'getUpdates / processing'});
 }
}
export async function deliver({source,api,allowedIds,signal}){
 while(!signal.aborted){
  await retry(()=>drainOutbox({source,api,allowedIds,signal}),{signal,stage:'outbox'});
  await pause(1000,signal);
 }
}
