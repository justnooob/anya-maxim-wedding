import test from 'node:test';
import assert from 'node:assert/strict';
import {storeNameFromUrl,resolvedStoreLabel,updateShopUrl,storeDomains} from '../src/content/store-names.mjs';
for(const [url,name] of [
 [' https://WWW.OZON.RU/product/very-long-marketplace-path-123456/?utm_source=test&sku=123 ','Ozon'],
 ['https://global.wildberries.ru/catalog/123/detail.aspx?targetUrl=GP','Wildberries'],
 ['https://marketapp.integration.market.yandex.ru/product/123?offerid=abc','Яндекс Маркет'],
 ['https://wowlife.club/vpechatleniya/den-spa/','WOWlife'],
 ['https://xpresent.ru/spb/set/test','Xpresent'],
 ['https://example-shop.ru/product/123?x=1','Example Shop'],
 ['https://ozon.ru.example.com/path','ozon.ru.example.com'],
 ['not a URL',''],['javascript:alert(1)',''],['https://name:password@ozon.ru',''],
])test('Store detection '+name+' '+url.slice(0,45),()=>assert.equal(storeNameFromUrl(url),name));
test('Every known domain and www variant is recognized',()=>{for(const [domain,label] of Object.entries(storeDomains))for(const host of [domain,'www.'+domain])assert.equal(storeNameFromUrl('https://'+host+'/p?q=1'),label);});
test('Legacy generated labels repaired; explicit manual names survive read and edit',()=>{
 for(const label of ['Первый магазин','Второй магазин','Магазин 3',''])assert.equal(resolvedStoreLabel(label,'https://ozon.ru/p'),'Ozon');
 assert.equal(resolvedStoreLabel('Уютный дом','https://ozon.ru/p'),'Уютный дом');
 assert.equal(updateShopUrl({label:'Ozon',url:'https://ozon.ru/p'},'https://wildberries.ru/p').label,'Wildberries');
 assert.equal(updateShopUrl({label:'Мой магазин',url:'https://ozon.ru/p',manualLabel:true},'https://wildberries.ru/p').label,'Мой магазин');
 assert.equal(updateShopUrl({label:'Ozon',url:'https://ozon.ru/p',manualLabel:true},'https://wildberries.ru/p').label,'Ozon');
});
