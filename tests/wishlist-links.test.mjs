import assert from 'node:assert/strict';
import test from 'node:test';
import {isGiftBundle} from '../src/content/wishlist-links.mjs';
import {itemInput} from '../src/server/wishlist/validation.mjs';

const mainStrip = {label: 'Яндекс: основные ленты, 2 шт.', url: 'https://alice.yandex.ru/store/products/led-strip-3m-100343'};
const extension = {label: 'Яндекс: удлинители по 1 м, 4 шт.', url: 'https://alice.yandex.ru/store/products/led-strip-1m-100296/?source=wishlist'};

test('shop alternatives and individual links are not bundles', () => {
 assert.equal(isGiftBundle([]), false);
 assert.equal(isGiftBundle([{...mainStrip, label: 'Товар 1'}]), false);
 assert.equal(isGiftBundle([mainStrip, {...mainStrip, label: 'Ozon', url: 'https://ozon.ru/product/one-123/'}]), false);
 assert.equal(isGiftBundle([mainStrip, mainStrip]), false);
 assert.equal(isGiftBundle([mainStrip, {...extension, url: extension.url.replace('alice.yandex.ru', 'alice.yandex.ru.example.org')}]), false);
});

test('current Alice kit and custom product labels use bundle mode', () => {
 assert.equal(isGiftBundle([extension, mainStrip]), true);
 const links = [{label:'Товар 1: основа', url:'https://ozon.ru/product/one-123/'}, {label:'Товар 2', url:'https://ozon.ru/product/two-124/'}];
 const gift = itemInput({title:'Комплект', category:'tech', priority:false, isVisible:false, reservationMode:'single', links});
 assert.deepEqual(gift.links, links);
 assert.equal(isGiftBundle(gift.links), true);
 assert.equal(isGiftBundle([links[0], {...links[1], label:'Ozon'}]), false);
});
