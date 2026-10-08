import test from 'node:test';
import assert from 'node:assert/strict';
import {renderRsvp} from './helpers/render-rsvp.mjs';
import {notificationPayload} from '../src/server/telegram/outbox.mjs';
for(const attendance of ['yes','no'])test('RSVP '+attendance+' success removes intro, form and refresh action from markup',()=>{
 const html=renderRsvp({attendance,sent:true});
 assert.match(html,/Сергей/);
 assert.doesNotMatch(html,/Ты придёшь|Оставь нам пару слов|Обновить статус ответа|<form|<input/);
 assert.match(html,/aria-labelledby="rsvp-success-title"/);
 assert.match(html,/id="rsvp-success-title"/);
 if(attendance==='yes')assert.match(html,/Если появятся вопросы, обязательно пиши Ане или Максиму/);
 else assert.match(html,/Не придёт/);
 assert.match(html,/Добавить второго гостя/);
 assert.doesNotMatch(html,/Оставили для тебя место в нашей истории/);
 assert.doesNotMatch(renderRsvp({attendance,sent:true,error:'Offline'}),/Обновить статус ответа/);
});
test('RSVP form retains intro and updated privacy copy before submission',()=>{
 const html=renderRsvp({sent:false,attendance:null});
 assert.match(html,/Ты придёшь/);assert.match(html,/Оставь нам пару слов/);
 assert.match(html,/Твои ответы увидят только Аня и Максим/);
 assert.match(html,/<form/);
});
test('notification contains only guest name and launches existing Mini App list',()=>{
 for(const attendance of ['yes','no']){
  const payload=notificationPayload({id:'test',guest_name:'Сергей',attendance,music_request:'Private song',food:'Private food',transfer:'needed'},'https://example.com/?ignored=true');
  assert.equal(payload.text,'Новый ответ от гостя "Сергей"');
  assert.deepEqual(payload.reply_markup,{inline_keyboard:[[{text:'Открыть',web_app:{url:'https://example.com/telegram'}}]]});
  assert.doesNotMatch(JSON.stringify(payload),/Private|transfer|callback_data/);
 }
 assert.throws(()=>notificationPayload({guest_name:'Сергей'},'http://example.com'));
});
