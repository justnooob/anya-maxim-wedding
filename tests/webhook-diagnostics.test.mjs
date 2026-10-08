import test from 'node:test';
import assert from 'node:assert/strict';
import {createTelegramApi} from '../src/server/telegram/api.mjs';
import {safeWebhookDiagnostic} from '../src/server/telegram/diagnostics.mjs';
import {registerWebhook} from '../src/server/telegram/register-webhook.mjs';
const token=[123456789,'synthetic'.repeat(4)].join(':');
const secret=Array(45).fill('s').join('');
test('Telegram error diagnostics preserve status and redact token, secret and URL',async()=>{
  const api=createTelegramApi(token,async()=>({ok:false,status:400,json:async()=>({ok:false,error_code:400,description:'Bad Request: '+token+' '+secret+' https://api.telegram.org/bot'+token+'/setWebhook'})}),{diagnostics:true,secrets:[secret]});
  await assert.rejects(api('setWebhook'),error=>{
    const diagnostic=safeWebhookDiagnostic(error,{stage:'setWebhook request',hostname:'example.com',pathname:'/api/telegram/webhook'},[token,secret]);
    assert.equal(diagnostic.http_status,400);assert.equal(diagnostic.error_code,400);assert.match(diagnostic.description,/Bad Request/);
    const output=JSON.stringify(diagnostic);assert.ok(!output.includes(token));assert.ok(!output.includes(secret));assert.ok(!output.includes('api.telegram.org'));return true;
  });
});
test('response parsing errors preserve HTTP status without raw response body',async()=>{
  const api=createTelegramApi(token,async()=>({status:502,json:async()=>{throw new Error(token+secret);}}),{diagnostics:true,secrets:[secret]});
  await assert.rejects(api('getMe'),error=>{
    const diagnostic=safeWebhookDiagnostic(error,{stage:'token validation'},[token,secret]);assert.equal(diagnostic.stage,'response parsing');assert.equal(diagnostic.http_status,502);assert.ok(!JSON.stringify(diagnostic).includes(token));return true;
  });
});
test('getMe failure prevents setWebhook and exposes token validation stage',async()=>{
  let context;const methods=[];
  await assert.rejects(registerWebhook({PUBLIC_SITE_URL:'https://example.com?hidden=query',TELEGRAM_BOT_TOKEN:token,TELEGRAM_WEBHOOK_SECRET:secret},()=>async method=>{methods.push(method);throw new Error('network');},{onStage:value=>{context=value;}}));
  assert.deepEqual(methods,['getMe']);assert.equal(context.stage,'token validation');assert.equal(context.hostname,'example.com');assert.equal(context.pathname,'/api/telegram/webhook');assert.ok(!JSON.stringify(context).includes('hidden'));
});
