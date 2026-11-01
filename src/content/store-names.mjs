// Shared by the editor, validation and read-time repair of legacy placeholders.
// Host matching is boundary-aware: ozon.ru.example.com is never treated as Ozon.
export const storeDomains={
 'ozon.ru':'Ozon','wildberries.ru':'Wildberries','market.yandex.ru':'Яндекс Маркет','yandex.market':'Яндекс Маркет','market.yandex.net':'Яндекс Маркет',
 'lamoda.ru':'Lamoda','dns-shop.ru':'DNS','mvideo.ru':'М.Видео','eldorado.ru':'Эльдорадо',
 'citilink.ru':'Ситилинк','hoff.ru':'Hoff','askona.ru':'Askona','tefal.ru':'Tefal',
 'dreame.ru':'Dreame','karcher.ru':'Kärcher','kitchentrade.ru':'KitchenAid','mi.com':'Xiaomi','mi-shop.com':'Xiaomi','xiaomi.ru':'Xiaomi',
 'wowlife.club':'WOWlife','xpresent.ru':'Xpresent','presentcity.ru':'PresentCity','regions.rest':'Regions',
 'sima-land.ru':'Сима-ленд','bagohome.com':'BAGO Home','giftery.ru':'Giftery','digift.ru':'Дигифт','hobbyworld.ru':'Hobby World','shop-luminarc.ru':'Luminarc','batyastore.ru':'Batya Store','sunrise-spa.ru':'Sunrise SPA','moremotions.ru':'Море Эмоций',
 'zwilling.ru':'ZWILLING','smeg-store.ru':'SMEG','smeg.com':'SMEG','ecotex.ru':'ECOTEX','delonghi.ru':'DeLonghi',
};
export function storeNameFromUrl(value){
 try{if(typeof value!=='string')return '';const url=new URL(value.trim());if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return '';
  const host=url.hostname.toLowerCase().replace(/^www\./,'').replace(/\.$/,'');
  for(const [domain,name]of Object.entries(storeDomains))if(host===domain||host.endsWith('.'+domain))return name;
  // Preserve complicated/IDN/IP hosts literally instead of inventing a brand.
  const parts=host.split('.'),stem=parts[0];if(parts.length===2&&/^[a-z]+(?:-[a-z]+)*$/.test(stem)&&!stem.startsWith('xn--')&&stem.length<=40)return stem.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join(' ');
  return host.slice(0,60);
 }catch{return '';}
}
export function placeholderStoreLabel(label){return typeof label!=='string'||!label.trim()||/^(?:(?:первый|второй|третий|четв[её]ртый|пятый|другой|официальный)\s+магазин|магазин\s*(?:[№#]?\s*\d+)?|(?:shop|store|link|ссылка)\s*[№#]?\s*\d*)$/iu.test(label.trim());}
export function resolvedStoreLabel(label,url){return placeholderStoreLabel(label)?storeNameFromUrl(url):(label||'').trim();}
export function updateShopUrl(link,url){
 // No hidden provenance is needed: preserve a custom label, while an untouched
 // auto label follows the next pasted URL. An empty label resumes auto naming.
 const automatic=link.manualLabel!==true&&(placeholderStoreLabel(link.label)||link.label.trim()===storeNameFromUrl(link.url));
 return {...link,url,label:automatic?storeNameFromUrl(url):link.label};
}
