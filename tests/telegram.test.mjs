import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAllowedUserIds, privateSender, assertTelegramAdmin, createTelegramHandler} from '../src/server/telegram/access.mjs';
import {createTelegramApi, TelegramApiError} from '../src/server/telegram/api.mjs';
const update = (id = 123, text = '/start', type = 'private') => ({message:{from:{id,is_bot:false,username:'organizer'},chat:{id,type},text}});
const fakeToken = [123456789, 'synthetic'.repeat(4)].join(':');

test('empty whitelist denies access; numeric IDs are strict and duplicate-safe', () => {
  assert.equal(parseAllowedUserIds().size,0);
  assert.deepEqual([...parseAllowedUserIds('123, 456,123')],['123','456']);
  for(const value of ['organizer','123,','-1','0','1.5','1e3','0123','9007199254740992','123;456']) assert.throws(()=>parseAllowedUserIds(value));
});
test('setup returns only the sender own ID, never dispatches admin', async () => {
  let calls=0;
  const handler=createTelegramHandler({allowedIds:new Set(),setup:true,runAdmin:async()=>{calls++;return 'RSVP data';}});
  const reply=await handler(update(123));assert.match(reply.text,/123/);assert.equal(reply.diagnostic,true);assert.equal(calls,0);
  const denied=await handler(update(123,'/rsvp'));assert.equal(denied.diagnostic,true);assert.doesNotMatch(denied.text,/RSVP data/);assert.equal(calls,0);
});
test('unknown users cannot invoke admin even when other organizers are whitelisted', async () => {
  let calls=0;const handler=createTelegramHandler({allowedIds:parseAllowedUserIds('456'),runAdmin:async()=>{calls++;return 'private';}});
  for(const command of ['/start','/rsvp','/delete 1','/stats','plain text']) assert.equal((await handler(update(123,command))).diagnostic,true);
  assert.equal(calls,0);assert.throws(()=>assertTelegramAdmin(update(123).message,parseAllowedUserIds('456')));
});
test('only numeric from.id controls authorization, not usernames', async () => {
  let calls=0;const handler=createTelegramHandler({allowedIds:parseAllowedUserIds('456'),runAdmin:async({userId})=>{calls++;return userId;}});
  const message=update(456);message.message.from.username='unrelated';
  assert.equal((await handler(message)).text,'456');assert.equal(calls,1);
});
test('groups, bots, mismatched chat IDs and forged callback payloads never dispatch', async () => {
  let calls=0;const handler=createTelegramHandler({allowedIds:parseAllowedUserIds('123'),setup:true,runAdmin:async()=>{calls++;return 'private';}});
  const bot=update();bot.message.from.is_bot=true;
  const mismatch=update();mismatch.message.chat.id=456;
  const callback={callback_query:{from:{id:123},message:update().message,data:'/rsvp'}};
  for(const item of [update(123,'/rsvp','group'),update(123,'/rsvp','supergroup'),bot,mismatch,callback,{edited_message:update().message},{}]) assert.equal(await handler(item),null);
  assert.equal(calls,0);assert.equal(privateSender({}),null);
});
test('setup is unavailable outside development', () => {
  assert.throws(()=>createTelegramHandler({allowedIds:new Set(),setup:true,environment:'production'}));
});
test('API uses fixed Telegram origin, POST and refuses redirects', async () => {
  const api=createTelegramApi(fakeToken,async(url,options)=>{
    assert.equal(url,'https://api.telegram.org/bot'+fakeToken+'/getMe');assert.equal(options.method,'POST');assert.equal(options.redirect,'error');
    return {ok:true,json:async()=>({ok:true,result:{username:'amwed_bot'}})};
  });assert.equal((await api('getMe')).username,'amwed_bot');
  await assert.rejects(api('unknownMethod'),TelegramApiError);
});
test('network, API and JSON errors cannot expose token, raw URLs or response contents', async () => {
  for(const implementation of [async()=>{throw new Error('https://api.telegram.org/bot'+fakeToken+'/getMe');},async()=>({ok:false,status:401,json:async()=>({ok:false,error_code:401,description:fakeToken})}),async()=>({ok:true,json:async()=>{throw new Error(fakeToken);}})]){
    const api=createTelegramApi(fakeToken,implementation);
    try{await api('getMe');assert.fail('request should fail');}catch(error){assert.ok(error instanceof TelegramApiError);assert.equal(error.cause,undefined);assert.ok(!String(error.stack).includes(fakeToken));assert.ok(!JSON.stringify(error).includes(fakeToken));}
  }
});
