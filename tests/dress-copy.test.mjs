import test from 'node:test';
import assert from 'node:assert/strict';
import {dressCode as dress} from '../src/content/dress-code.ts';
import {dressPalettes} from '../src/content/dress-palettes.mjs';

const women=dress.categories[0].pages,men=dress.categories[1].pages;
const colors=family=>family.shades.map(shade=>shade.color);
test('Dress Code visible copy uses Russian without enumeration colons or long dashes',()=>{
 const technical=new Set(['id','image','color','helpUrl','kind','status']);
 function visit(value){for(const [key,item] of Object.entries(value)){
  if(typeof item==='string'&&!technical.has(key))assert.doesNotMatch(item,/[a-zA-Z—–:]/,key+': '+item);
  else if(item&&typeof item==='object')visit(item);
 }}visit(dress);
 assert.equal(dress.helpUrl,'https://t.me/Selesssta');
 assert.match(women[0].avoid[0].description,/воздушный фатин/);
 assert.match(women[0].avoid[3].title,/шампань/);
});
test('women clothing palettes retain all five exact art-directed swatches in order',()=>{
 assert.deepEqual(colors(women[0].paletteFamilies[0]),['#D1D9C2','#B5C29D','#829264','#77835F','#5B6745']);
 assert.deepEqual(colors(women[0].paletteFamilies[1]),['#E8E4CD','#E2DAAC','#D8CD90','#DBCE80','#D4C158']);
});
test('men clothing shares the olive config and retains the explicit milk order',()=>{
 assert.strictEqual(men[0].paletteFamilies[0].shades,women[0].paletteFamilies[0].shades);
 assert.strictEqual(men[0].paletteFamilies[0].shades,dressPalettes.olive);
 assert.deepEqual(colors(men[0].paletteFamilies[1]),['#EDE7D2','#E8DFC2','#FCF6E0','#F8EEDA','#F8F3C3']);
 assert.ok(!colors(men[0].paletteFamilies[1]).includes('#FFFFFF'));
});
test('women accessories groups depend on the clothing base with exact swatch order',()=>{
 assert.deepEqual(women[1].paletteFamilies.map(f=>f.name),['Если основа оливковая','Если основа сливочно-золотая']);
 assert.deepEqual(colors(women[1].paletteFamilies[0]),['#E8E2C7','#DED4B0','#D2C69D','#DADDA6','#839365']);
 assert.deepEqual(colors(women[1].paletteFamilies[1]),['#E8E2C7','#DED4B0','#D2C69D','#F6F2C8','#FFEB9A']);
 assert.doesNotMatch(women[1].paletteFamilies.map(f=>f.name).join(' '),/Светлые аксессуары|Украшения/);
});
test('neither accessory category recommends pure white',()=>{
 for(const page of [women[1],men[1]]){
  const values=[];function collect(v){for(const [key,item]of Object.entries(v))if(typeof item==='string'&&!['id','image','color'].includes(key))values.push(item);else if(item&&typeof item==='object')collect(item);}collect(page);
  assert.doesNotMatch(values.join(' '),/\bwhite\b|бел(?:ый|ая|ые|ого|ому|ым|ую)/iu);
 }
});
test('milk shirt is explicitly distinguished from a white shirt',()=>{
 assert.match(men[0].explanation,/Рубашка молочная, не белая\./);
 assert.match(men[0].rules.find(rule=>rule.title==='Рубашка').text,/Рубашка молочная, не белая\./);
});
test('prominent examples notice preserves the requested wording and existing Anya help',()=>{
 assert.equal(dress.notice,'Дорогие гости, мы не обязуем вас покупать то же самое, что и на картинках. Это всё примеры. Вы можете выбрать одежду и аксессуары, которые вам больше нравятся. Основное правило в том, чтобы цвет одежды и аксессуаров совпадал с нашей цветовой гаммой.');
 assert.equal(dress.helpBefore+' '+dress.helpLink+dress.helpAfter,'Если сомневаетесь в образе или не уверены, подходит ли выбранный оттенок, обязательно напишите Ане. Она подскажет.');
});
