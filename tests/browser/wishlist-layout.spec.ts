import {test,expect,type Page} from 'playwright/test';
async function setup(page:Page){
 await page.emulateMedia({reducedMotion:'reduce'});await page.request.post('/qa/wishlist-fixtures');await page.goto('/telegram');await expect(page.getByRole('button',{name:'Вишлист ↗'})).toBeVisible();
 const raw=await page.evaluate(()=>window.Telegram!.WebApp.initData),headers={'X-Telegram-Init-Data':raw};
 const data=await (await page.request.get('/api/telegram/wishlist',{headers})).json();
 for(const [index,item]of data.items.entries()){
  const titles=['Плед','Совместные путешествия и маленькие открытия','Очень длинное русское название подарка для уютных совместных вечеров, путешествий и воспоминаний, которое не помещается в две строки','LongLatinProductNameWithoutSpaces'.repeat(4),'Без указанной цены'];
  const response=await page.request.post('/api/telegram/wishlist',{headers,data:{action:'save',id:item.id,version:item.version,data:{...item,title:titles[index],comment:index===0?'':index===1?'Подробный комментарий о подарке. '.repeat(8):item.comment,links:Array.from({length:index===1?3:1},(_,i)=>({label:'',url:'https://'+['ozon.ru','wildberries.ru','market.yandex.ru'][i]+'/product/123'}))}}});expect(response.ok()).toBe(true);
 }
 await page.goto('/wishlist');await expect(page.locator('.gift-print')).toHaveCount(5);await page.evaluate(()=>document.fonts.ready);
}
async function aligned(page:Page){
 await page.evaluate(async()=>{await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));});
 const rows=await page.locator('.gift-print').evaluateAll(cards=>{
  const out:Record<string,number[][]>={};for(const card of cards){const r=card.getBoundingClientRect(),key=String(Math.round(r.top));(out[key]??=[]).push([r.height,...['.gift-image','.gift-eyebrow','.gift-title','.gift-description','.gift-price','.gift-shops','.gift-status','.gift-actions'].flatMap(sel=>{const b=card.querySelector(sel)!.getBoundingClientRect();return sel==='.gift-image'?[b.top,b.bottom]:[b.top];})]);}return Object.values(out);
 });
 for(const row of rows)for(let column=0;column<row[0].length;column++)expect(Math.max(...row.map(c=>c[column]))-Math.min(...row.map(c=>c[column])),`track ${column}: ${JSON.stringify(row)}`).toBeLessThan(2);
}
for(const width of [320,768,1440])test('Wishlist shared rows, clamp, accessible tooltip and responsive reflow '+width,async({page})=>{
 await page.setViewportSize({width,height:900});await setup(page);const headings=page.locator('.gift-title');await expect(headings.first()).not.toHaveAttribute('data-truncated');await headings.first().hover();await expect(page.getByRole('tooltip')).toHaveCount(0);
 const long=headings.nth(2);await expect(long).toHaveAttribute('data-truncated','true');await expect(long).toHaveText(/Очень длинное русское/);await long.focus();await expect(page.getByRole('tooltip')).toBeVisible();await expect(long).toHaveAttribute('aria-describedby',/.+/);
 const tip=(await page.getByRole('tooltip').boundingBox())!;expect(tip.x).toBeGreaterThanOrEqual(0);expect(tip.x+tip.width).toBeLessThanOrEqual(width+1);await page.keyboard.press('Escape');await expect(page.getByRole('tooltip')).toHaveCount(0);await long.blur();await long.click();await expect(page.getByRole('tooltip')).toBeVisible();await page.keyboard.press('Escape');
 for(const h of await headings.all()){const size=await h.evaluate(el=>({height:el.clientHeight,line:parseFloat(getComputedStyle(el).lineHeight)}));expect(size.height).toBeLessThanOrEqual(size.line*2+1);}
 await long.blur();if(width>600)await aligned(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
 await expect(page).toHaveScreenshot('wishlist-aligned-'+width+'.png',{fullPage:true,timeout:30000});
 await page.getByLabel('Наличие').selectOption('free');if(width>600)await aligned(page);await page.getByLabel('Ориентировочная цена').selectOption('middle');if(width>600)await aligned(page);
 await page.setViewportSize({width:720,height:450});await page.getByLabel('Ориентировочная цена').selectOption('all');await aligned(page);
});
test('Wishlist Mini App draft filters, automatic label/manual override and publishing',async({page})=>{
 await setup(page);await page.goto('/telegram');await page.getByRole('button',{name:'Вишлист ↗'}).click();await page.getByRole('button',{name:'Добавить подарок',exact:true}).click();const form=page.locator('.wishlist-admin-form');await form.getByLabel('Название',{exact:true}).fill('Черновик для публикации');await form.getByRole('button',{name:'Добавить магазин'}).click();await form.getByLabel('Ссылка магазина').fill('https://www.ozon.ru/product/1?q=2');await expect(form.getByLabel('Название магазина')).toHaveValue('Ozon');await form.getByLabel('Название магазина').fill('Наш выбранный магазин');await form.getByLabel('Ссылка магазина').fill('https://wildberries.ru/catalog/2');await expect(form.getByLabel('Название магазина')).toHaveValue('Наш выбранный магазин');await form.getByRole('button',{name:'Сохранить подарок'}).click();
 await page.getByLabel('Статус подарка').selectOption('draft');await expect(page.locator('.wishlist-admin-row')).toHaveCount(1);await page.locator('.wishlist-admin-open').click();await page.getByRole('button',{name:'Опубликовать',exact:true}).click();await expect(page.getByRole('switch',{name:'Показывать на сайте'})).toBeChecked();await page.getByRole('button',{name:'К подаркам'}).click();await expect(page.locator('.wishlist-admin-row')).toHaveCount(0);await page.getByLabel('Статус подарка').selectOption('published');await expect(page.locator('.wishlist-admin-row')).toHaveCount(6);await page.goto('/wishlist');await expect(page.locator('.gift-print').filter({hasText:'Черновик для публикации'})).toBeVisible();
});
test('Wishlist tooltip supports hover, Latin titles, 200 percent reflow and real touch input',async({page,browser})=>{
 await page.setViewportSize({width:1440,height:900});await setup(page);const title=page.locator('.gift-title').nth(2);await title.hover();await expect(page.getByRole('tooltip')).toBeVisible();await page.mouse.move(0,0);await expect(page.getByRole('tooltip')).toHaveCount(0);
 await page.setViewportSize({width:720,height:450});const latin=page.locator('.gift-title').nth(3);await latin.focus();await expect(page.getByRole('tooltip')).toHaveText('LongLatinProductNameWithoutSpaces'.repeat(4));let box=(await page.getByRole('tooltip').boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(721);expect(box.y+box.height).toBeLessThanOrEqual(451);
 const touch=await browser.newContext({baseURL:'http://localhost:3310',viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});try{const p=await touch.newPage();await p.goto('/wishlist');await expect(p.locator('.gift-print')).toHaveCount(5);await p.evaluate(()=>document.fonts.ready);await p.locator('.gift-title').nth(2).tap();await expect(p.getByRole('tooltip')).toBeVisible();box=(await p.getByRole('tooltip').boundingBox())!;expect(box.x+box.width).toBeLessThanOrEqual(391);await p.getByLabel('Категория',{exact:true}).tap();await expect(p.getByRole('tooltip')).toHaveCount(0);}finally{await touch.close();}
});

test('Wishlist title search, canonical store filter, availability and linkless cards',async({page})=>{
 await setup(page);await page.getByLabel('Магазин',{exact:true}).selectOption('Wildberries');await expect(page.locator('.gift-print')).toHaveCount(1);
 await page.getByLabel('Поиск по названию').fill('СОВМЕСТНЫЕ');await expect(page.locator('.gift-print')).toHaveCount(1);
 await page.getByLabel('Поиск по названию').fill('Такого подарка нет');await expect(page.locator('.gift-print')).toHaveCount(0);await expect(page.getByText('По этим условиям подарков нет. Попробуй другой фильтр.')).toBeVisible();
 await page.getByLabel('Поиск по названию').fill('');await page.getByLabel('Магазин',{exact:true}).selectOption('all');await page.getByLabel('Наличие').selectOption('reserved');await expect(page.locator('.gift-print')).toHaveCount(1);await page.getByLabel('Наличие').selectOption('all');
 const link=page.locator('.gift-shops a').first();await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('rel','noopener noreferrer');await expect(link).toHaveText('Открыть в Ozon ↗');
 await page.goto('/telegram');await expect(page.getByRole('button',{name:'Вишлист ↗'})).toBeVisible();const raw=await page.evaluate(()=>window.Telegram!.WebApp.initData),headers={'X-Telegram-Init-Data':raw};const data=await (await page.request.get('/api/telegram/wishlist',{headers})).json(),item=data.items[0];
 const changed=await page.request.post('/api/telegram/wishlist',{headers,data:{action:'save',id:item.id,version:item.version,data:{...item,links:[]}}});expect(changed.ok()).toBe(true);
 await page.goto('/wishlist');const card=page.locator('.gift-print').filter({hasText:item.title});await expect(card).toBeVisible();await expect(card.locator('.gift-shops a')).toHaveCount(0);await expect(card.getByRole('button',{name:'Забронировать',exact:true})).toBeEnabled();
});

test('Complete catalogue shows all 54 gifts, local artwork, budgets and the same Mini App records',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:900});const seeded=await page.request.post('/qa/wishlist-catalog');expect(seeded.ok()).toBe(true);
 await page.goto('/wishlist');await expect(page.locator('.gift-print')).toHaveCount(54);await page.evaluate(()=>document.fonts.ready);
 const station=page.locator('.gift-print').filter({hasText:'Яндекс Станция Макс с Zigbee, 65 Вт'});await expect(station.locator('.gift-shops a')).toHaveAttribute('href','https://www.ozon.ru/product/umnaya-kolonka-yandeks-stantsiya-maks-zigbee-alisa-65w-1-0-bt-10m-grafit-1259349956/');await station.locator('img').evaluate(async img=>{await (img as HTMLImageElement).decode();});await expect(station).toHaveScreenshot('wishlist-station-max.png');
 await page.getByLabel('Ориентировочная цена').selectOption('low');await expect(page.locator('.gift-print')).toHaveCount(12);await aligned(page);
 await page.screenshot({path:'qa-artifacts/wishlist-v2-budget-desktop.png',fullPage:true});
 await page.getByLabel('Магазин',{exact:true}).selectOption('Ozon');await expect(page.locator('.gift-print')).toHaveCount(4);
 await page.getByLabel('Ориентировочная цена').selectOption('all');await page.getByLabel('Магазин',{exact:true}).selectOption('all');
 const sources=await page.locator('.gift-image img').evaluateAll(images=>images.map(i=>(i as HTMLImageElement).getAttribute('src')));expect(new Set(sources).size).toBe(54);
 for(const src of sources){const response=await page.request.get(src!);expect(response.ok()).toBe(true);expect(response.headers()['content-type']).toContain('image/webp');}
 await page.screenshot({path:'qa-artifacts/wishlist-v2-catalog-desktop.png',fullPage:true});
 for(const width of [280,320,375,390,430,768,1024,1366,1440,1920,2560,3440]){
  await page.setViewportSize({width,height:width<600?844:900});await page.evaluate(async()=>{await document.fonts.ready;await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));});expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);if(width>600)await aligned(page);
 }
 await page.setViewportSize({width:390,height:844});await page.getByLabel('Ориентировочная цена').selectOption('low');await page.screenshot({path:'qa-artifacts/wishlist-v2-budget-mobile.png',fullPage:true});
 await page.goto('/telegram');await page.getByRole('button',{name:'Вишлист ↗'}).click();await expect(page.locator('.wishlist-admin-row')).toHaveCount(54);
});
