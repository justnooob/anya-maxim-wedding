import {test,expect} from 'playwright/test';
import {inspectLayout} from '../helpers/ui-audit.mjs';
for(const width of [280,320,375,390,430,768,1000,1001,1024,1440,1920])test('clean Venue composition, keyboard, swipe and fullscreen '+width,async({page,request})=>{
 await request.post('/qa/reset');await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(()=>sessionStorage.setItem('anya-maxim-opening-v1','yes'));await page.goto('/');
 const venue=page.locator('#venue'),photo=page.locator('.venue-photo-open'),current=page.locator('.venue-current-photo');
 await venue.scrollIntoViewIfNeeded();await current.evaluate(async n=>{const img=n as HTMLImageElement;img.loading='eager';await img.decode();});
 await expect(venue.locator('.venue-arrival,.venue-enlarge,.venue-gallery-controls')).toHaveCount(0);await expect(venue).not.toContainText('Есть парковка');await expect(venue).not.toContainText('Рассмотреть площадку');
 await expect(venue.getByRole('link',{name:'Показать на карте'})).toBeVisible();await expect(page.locator('.venue-copy')).toHaveCSS('min-height','0px');
 if(width<=700){
  const panel=await page.locator('.venue-copy').evaluate(el=>{const rect=el.getBoundingClientRect();return{left:rect.left,right:rect.right,viewport:document.documentElement.clientWidth,background:getComputedStyle(el).backgroundColor};});
  expect(Math.abs(panel.left),'The olive venue panel must start at the screen edge').toBeLessThanOrEqual(1);
  expect(Math.abs(panel.right-panel.viewport),'The olive venue panel must reach the other screen edge').toBeLessThanOrEqual(1);
  expect(panel.background).toBe('rgb(48, 59, 42)');
 }
 const geometry=await venue.evaluate(el=>{const panel=el.querySelector('.venue-copy')!,address=el.querySelector('.venue-address')!,map=panel.querySelector('a')!;return{gap:map.getBoundingClientRect().top-address.getBoundingClientRect().bottom,bottom:panel.getBoundingClientRect().bottom-map.getBoundingClientRect().bottom};});expect(geometry.gap).toBeGreaterThanOrEqual(0);expect(geometry.gap).toBeLessThanOrEqual(50);expect(geometry.bottom).toBeLessThanOrEqual(65);
 const original=await current.getAttribute('src');await photo.focus();await page.keyboard.press('ArrowRight');await expect(current).not.toHaveAttribute('src',original!);await page.keyboard.press('ArrowLeft');await expect(current).toHaveAttribute('src',original!);
 const bounds=(await photo.boundingBox())!;const x=Math.min(bounds.x+bounds.width-15,width-20),y=Math.max(20,Math.min(bounds.y+bounds.height/2,700));await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(Math.max(bounds.x+15,x-80),y,{steps:8});await page.mouse.up();await expect(current).not.toHaveAttribute('src',original!);await expect(page.locator('.venue-lightbox')).not.toBeVisible();
 // Swipe suppression deliberately lasts500ms, then an ordinary click opens it.
 await page.waitForTimeout(510);await photo.click();await expect(page.locator('.venue-lightbox')).toBeVisible();await page.locator('.venue-lightbox').getByRole('button',{name:'Следующее фото площадки',exact:true}).click();await page.keyboard.press('Escape');await expect(page.locator('.venue-lightbox')).not.toBeVisible();await expect(photo).toBeFocused();
 expect((await page.evaluate(inspectLayout)).documentOverflow).toBe(0);await venue.screenshot({path:`qa-artifacts/venue-clean-${width}.png`,animations:'disabled'});
});
