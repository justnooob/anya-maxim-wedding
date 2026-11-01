import test from 'node:test';
import assert from 'node:assert/strict';
import {questions,MAXIM_TELEGRAM_URL} from '../src/content/questions.ts';

test('transfer FAQ entries follow speeches without reordering existing questions',()=>{
 assert.deepEqual(questions.items.map(item=>item.id),['flowers','gifts','speeches','transfer-to','transfer-back','own-car','leave-car','late','changed-plans','venue-rules','contacts']);
});
test('car and changed-plan FAQ use exact shared inline destinations and no long dashes',()=>{
 const find=id=>questions.items.find(item=>item.id===id);assert.match(find('own-car').answer[0].text,/парковка.*к 15:00/);
 assert.equal(find('leave-car').answer.find(p=>p.text==='Фёдоровского').href,'https://yandex.ru/maps/geo/gorodskoy_posyolok_fyodorovskoye/53152665/?ll=30.534765%2C59.661278&z=15');assert.equal(find('late').answer.find(p=>p.text==='Максиму').href,MAXIM_TELEGRAM_URL);assert.equal(find('changed-plans').answer.find(p=>p.text==='Ане').href,'https://t.me/Selesssta');assert.equal(find('changed-plans').answer.find(p=>p.text==='Максиму').href,MAXIM_TELEGRAM_URL);
 for(const id of ['own-car','leave-car','late','changed-plans'])assert.doesNotMatch(find(id).answer.map(p=>p.text).join(''),/[—–]/);
});
test('outbound transfer has three separate complete paragraphs and no long dashes',()=>{
 const item=questions.items.find(item=>item.id==='transfer-to');const paragraphs=[item.answer,...item.additionalParagraphs].map(parts=>parts.map(part=>part.text).join(''));
 assert.equal(paragraphs.length,3);assert.match(paragraphs[0],/к 15:00.*метро Купчино.*вокзала Павловска/);assert.match(paragraphs[1],/^В анкете ниже/);assert.match(paragraphs[2],/то есть до 17\.06\.2027\./);assert.doesNotMatch(paragraphs.join(' '),/[—–]/);
});
test('return transfer uses the existing shared Maxim Telegram destination',()=>{
 const back=questions.items.find(item=>item.id==='transfer-back');const contact=questions.items.find(item=>item.id==='contacts');const link=back.answer.find(part=>part.text==='Максиму');
 assert.equal(link.href,MAXIM_TELEGRAM_URL);assert.equal(MAXIM_TELEGRAM_URL,'https://t.me/sfokin1337');assert.equal(link.href,contact.answer.find(part=>part.text==='обращайтесь к Максиму').href);
});
