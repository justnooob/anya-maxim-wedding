import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {dressCode} from '../src/content/dress-code.ts';
import {dressMaterials,dressMaterialItems} from '../src/content/dress-materials.mjs';

test('four material states each contain exactly six stable items split into two distinct trios',()=>{
 assert.equal(Object.keys(dressMaterialItems).length,4);
 const items=Object.values(dressMaterialItems).flat();assert.equal(items.length,24);
 assert.deepEqual(items.map(item=>item.reference),Array.from({length:24},(_,i)=>i+1));
 assert.equal(new Set(items.map(item=>item.id)).size,24);
 for(const [state,groups]of Object.entries(dressMaterials)){
  assert.equal(groups.length,2);assert.deepEqual(groups.map(group=>group.items.length),[3,3]);
  assert.equal(dressMaterialItems[state].length,6);
 }
 assert.deepEqual(dressMaterials['women-accessories'].map(g=>g.title),['Материалы аксессуаров','Украшения']);
 assert.deepEqual(dressMaterials['men-accessories'].map(g=>g.title),['Для обуви и ремня','Примеры аксессуаров']);
});

test('material titles and semantic texture/object mapping follow references 1 through 24',()=>{
 assert.deepEqual(Object.values(dressMaterialItems).flat().map(i=>i.title),['Шёлк','Атлас','Фатин','Шёлк','Атлас','Атлас','Лён','Вискоза','Вельвет','Лён','Вискоза','Хлопок','Кожа','Органза','Бархат','Жемчуг','Золото','Бижутерия в цвет','Кожа','Замша','Кожа','Галстук и цветок','Бабочка и платок','Ботинки']);
 const objects=Object.values(dressMaterialItems).flat().filter(i=>i.kind==='object');assert.deepEqual(objects.map(i=>i.reference),[16,17,18,22,23,24]);
});

test('all 24 materials have separate decodable new local square WebP assets',async()=>{
 const manifest=JSON.parse(fs.readFileSync('MATERIAL_ASSETS.json','utf8'));
 const hashes=new Set();assert.equal(manifest.length,24);
 for(const item of Object.values(dressMaterialItems).flat()){
  const record=manifest.find(m=>m.reference===item.reference);assert.equal(record.status,'generated');assert.equal(record.image,item.image);
  assert.equal(record.id,item.id);assert.match(item.image,/^\/images\/dress-materials\/[a-z-]+\.webp$/);
  const bytes=fs.readFileSync('public'+item.image);assert.ok(bytes.length>1000);
  const meta=await sharp(bytes).metadata();assert.equal(meta.format,'webp');assert.equal(meta.width,800);assert.equal(meta.height,800);
  hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));
 }
 assert.equal(hashes.size,24);
});

test('men accessory colour groups change position without changing their swatches',()=>{
 const groups=dressCode.categories[1].pages[1].paletteFamilies;assert.deepEqual(groups.map(g=>g.id),['brown','olive']);
 assert.deepEqual(groups[0].shades.map(s=>s.color),['#EEE5D4','#DACCBA','#B7A183','#96734F','#72583F']);
 assert.deepEqual(groups[1].shades.map(s=>s.color),['#909B7D','#859077','#788064','#6F785B','#626B4F']);
});

test('the jacket requirement and black warning are explicit, and hints stay optional',()=>{
 const men=dressCode.categories[1].pages[0];assert.match(men.explanation,/Основной цвет пиджака должен быть в оливковой гамме\./);
 assert.equal(dressCode.jacketEmphasis,'должен');assert.equal(dressCode.blackWarning,'Черный мы не используем, даже на носках. Мы их увидим.');
 assert.equal(dressMaterialItems['women-accessories'][0].desktopHint,'Для сумок, перчаток и обуви');
 assert.equal(dressMaterialItems['men-accessories'][1].desktopHint,'Для обуви и ремня');
});
