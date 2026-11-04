import {test,expect} from 'playwright/test';
import definitions from '../../src/server/wishlist/approved-2026-11-04.json';

// Response interception is LOCAL QA only: these drafts are never inserted into
// a real database and are not made public by running this test.
const categories=[{id:'home',title:'Для дома'},{id:'cozy',title:'Уют'},{id:'tech',title:'Техника'},{id:'kitchen',title:'Для кухни'}];
const items=definitions.map((gift,index)=>({...gift,id:'00000000-0000-4000-8000-'+String(index+1).padStart(12,'0'),currency:'RUB',available:true,reserved:false,own:false,version:1,sortOrder:index,reservations:[]}));
for(const width of [280,320,375,390,430,768,1024,1440,1920])test('approved Wishlist draft preview preserves images, filters and responsive '+width,async({page,request},info)=>{
 await request.post('/qa/reset');await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/wishlist',route=>route.fulfill({json:{items,categories,csrf:'synthetic-preview'}}));
 await page.goto('/wishlist');await expect(page.locator('.gift-print')).toHaveCount(19);
 for(const [index,card] of (await page.locator('.gift-print').all()).entries()){
  await card.scrollIntoViewIfNeeded();const img=card.locator('.gift-image img');
  if(await img.count()){await expect(img).toBeVisible();await expect.poll(()=>img.evaluate(el=>(el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);}
  if([375,1440].includes(width)&&[3,6,15,17].includes(index))await card.screenshot({path:info.outputPath('final-card-'+(index+1)+'-'+width+'.png')});
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);expect(errors).toEqual([]);
 await page.getByLabel('Категория',{exact:true}).selectOption('kitchen');await expect(page.locator('.gift-print')).toHaveCount(items.filter(x=>x.category==='kitchen').length);
 await page.getByLabel('Категория',{exact:true}).selectOption('all');await page.getByLabel('Поиск по названию').fill('T7 Shield');await expect(page.locator('.gift-print')).toHaveCount(1);
 await page.getByLabel('Поиск по названию').fill('');await page.getByLabel('Ориентировочная цена',{exact:true}).selectOption('low');expect(await page.locator('.gift-print').count()).toBeGreaterThan(0);await page.getByLabel('Ориентировочная цена',{exact:true}).selectOption('all');
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:info.outputPath('approved-wishlist-'+width+'.png'),fullPage:true});
});
test('all approved drafts can be inspected in existing Mini App without publishing',async({page,request})=>{
 await request.post('/qa/reset');
 await page.route('**/api/telegram/wishlist',route=>route.fulfill({json:{items,categories,showReserverNames:false,stats:{total:19,free:19,reserved:0,priority:0}}}));
 await page.goto('/telegram');await page.getByRole('button',{name:'Вишлист ↗'}).click();await expect(page.locator('.wishlist-admin-row')).toHaveCount(19);
 await page.locator('.wishlist-admin-row').filter({hasText:'Samsung Portable SSD'}).locator('.wishlist-admin-open').click();
 await page.getByRole('button',{name:'Редактировать подарок',exact:true}).click();
 await expect(page.locator('.wishlist-admin-form')).toBeVisible();
 expect(definitions.every(item=>item.isVisible===false)).toBe(true);
});
