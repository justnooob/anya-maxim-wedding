import {test, expect} from 'playwright/test';

const first = {label:'Магазин один', url:'https://example.com/product/first'};
const second = {label:'Магазин два', url:'https://example.com/product/second'};
const gift = {image:'/images/wishlist-v2/gift-48.webp', comment:'', category:'home', price:1000, currency:'RUB', priority:false, reservationMode:'single', reserved:false, available:true, own:false};

test('wishlist new product images are served as WebP', async ({request}) => {
 for (const name of ['gold-apple', 'rgb-floor-lamps', 'ostin-cabinet', 'vita-musica', 'votex-stripe', 'votex-cappuccino', 'graf-burgundy', 'foxy-beige', 'brown-throw']) {
  const response = await request.get('/images/wishlist-v2/november-updates/'+name+'.webp');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('image/webp');
 }
});

for (const width of [390, 1440]) test('wishlist picture links and bundle dialog at '+width, async ({page, context}, info) => {
 await page.setViewportSize({width, height:844});
 if (width > 600) await page.emulateMedia({reducedMotion:'reduce'});
 await context.route('https://example.com/**', route => route.fulfill({body:'Store fixture'}));
 await page.route('**/api/wishlist', route => route.fulfill({json:{categories:[{id:'home',title:'Дом'}], items:[
  {...gift,id:'single',title:'Одна ссылка',links:[first]},
  {...gift,id:'shops',title:'Разные магазины',links:[first,second]},
  {...gift,id:'bundle',title:'Два предмета',links:[{...first,label:'Товар 1'},{...second,label:'Товар 2'}]},
  {...gift,id:'none',title:'Без ссылки',links:[]},
 ]}}));
 await page.goto('/wishlist');
 await expect(page.locator('.gift-print')).toHaveCount(4);
 expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 if (width > 600) {
  await expect.poll(() => page.locator('.gift-image').evaluateAll(images => {
   const [first, ...rest] = images.slice(0,3).map(image => image.getBoundingClientRect());
   return Math.max(...rest.map(box => Math.max(Math.abs(box.top-first.top),Math.abs(box.height-first.height))));
  })).toBeLessThan(1);
 }
 for (const title of ['Одна ссылка','Разные магазины']) {
  const image = page.getByRole('link',{name:'Открыть в магазине: '+title});
  await expect(image).toHaveAttribute('rel','noopener noreferrer');
  const [popup] = await Promise.all([page.waitForEvent('popup'),image.click()]);
  await popup.waitForURL(first.url);
  await popup.close();
 }
 await expect(page.locator('[data-gift-id=none] .gift-image-action')).toHaveCount(0);

 const trigger = page.getByRole('button',{name:'Посмотреть состав подарка: Два предмета'});
 const dialog = page.getByRole('dialog',{name:'Этот подарок состоит из 2 товаров'});
 const close = dialog.getByRole('button',{name:'Закрыть'});
 await trigger.click();
 await expect(dialog).toBeVisible();
 await expect(close).toBeFocused();
 await expect.poll(async () => {
  const box = (await dialog.boundingBox())!;
  return Math.abs(width < 600 ? box.y+box.height-844 : box.y+box.height/2-422);
 }).toBeLessThan(1);
 await page.screenshot({path:info.outputPath('gift-links-'+width+'.png')});
 const secondProduct = dialog.getByRole('link',{name:'Товар 2',exact:true});
 await expect(dialog.getByRole('link',{name:'Товар 1',exact:true})).toHaveAttribute('href',first.url);
 const [popup] = await Promise.all([page.waitForEvent('popup'),secondProduct.click()]);
 await popup.waitForURL(second.url);
 await popup.close();
 await close.click();
 await expect(trigger).toBeFocused();
 await trigger.press('Enter');
 await expect(dialog).toBeVisible();
 await page.mouse.click(2,2);
 await expect(dialog).toHaveCount(0);
 await trigger.click();
 await page.keyboard.press('Escape');
 await expect(dialog).toHaveCount(0);

 if (width < 600) {
  await trigger.click();
  await dialog.evaluate(element => {
   const touch = (name: string, y: number) => {
    const event = new Event(name,{bubbles:true});
    Object.defineProperties(event,{touches:{value:name==='touchstart'?[{clientX:100,clientY:y}]:[]},changedTouches:{value:[{clientX:100,clientY:y}]}});
    element.dispatchEvent(event);
   };
   touch('touchstart',440);
   touch('touchend',540);
  });
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
 }
});
