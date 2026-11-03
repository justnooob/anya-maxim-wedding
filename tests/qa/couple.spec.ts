import {test,expect} from 'playwright/test';
import {inspectLayout} from '../helpers/ui-audit.mjs';

for(const width of [280,320,375,390,430,768,1000,1001,1024,1440,1920])test('family sides show only relatives and preserve switching '+width,async({page,request},info)=>{
 await request.post('/qa/reset');
 await page.setViewportSize({width,height:900});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>sessionStorage.setItem('anya-maxim-opening-v1','yes'));
 await page.goto('/');

 const groom=page.locator('#relatives-groom'),bride=page.locator('#relatives-bride'),album=page.locator('.family-spread');
 for(const [panel,title,count]of [[groom,'Со стороны жениха',8],[bride,'Со стороны невесты',7]] as const){
  await expect(panel.locator('.family-anchor-card')).toHaveCount(0);
  await expect(panel.locator('.family-side-title')).toHaveText(title);
  await expect(panel.locator('.guest-album .guest-print')).toHaveCount(count);
  expect(await panel.evaluate(el=>[...el.children].map(n=>[...n.classList].filter(c=>!c.startsWith('motion-')).join(' ')))).toEqual(['family-side-title','guest-album page-enter']);
 }
 await page.locator('#guests').scrollIntoViewIfNeeded();
 await expect(page.locator('.dress-floating')).toHaveAttribute('aria-hidden','true');
 await expect(page.locator('.dress-floating')).toHaveCSS('opacity','0');

 const layout=async(panel:typeof groom)=>{
  const parent=(await panel.boundingBox())!,title=(await panel.locator('.family-side-title').boundingBox())!,relatives=(await panel.locator('.guest-album').boundingBox())!;
  expect(title.y).toBeGreaterThanOrEqual(parent.y-1);
  expect(title.y+title.height).toBeLessThan(relatives.y);
  expect(Math.abs(title.x+title.width/2-parent.x-parent.width/2)).toBeLessThan(1);
  await expect(panel.locator('.family-side-title')).toBeVisible();
 };

 await layout(groom);
 if(width<=1000){
  await expect(bride).toBeHidden();
  await page.getByRole('button',{name:'Невесты',exact:true}).click();
  await expect(bride).toBeVisible();
  await expect(groom).toHaveAttribute('inert','');
  await layout(bride);
  const before=(await album.boundingBox())!.height;
  await page.getByRole('button',{name:'Жениха',exact:true}).press('Enter');
  expect(Math.abs((await album.boundingBox())!.height-before)).toBeLessThan(1);
  await expect(groom).toBeVisible();
 }else{
  await expect(groom).toBeVisible();
  await expect(bride).toBeVisible();
  await layout(bride);
  const g=(await groom.locator('.family-side-title').boundingBox())!,b=(await bride.locator('.family-side-title').boundingBox())!;
  expect(Math.abs(g.y-b.y)).toBeLessThan(1);
 }
 await page.locator('#guests').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
 await expect(page.locator('.dress-floating')).toHaveCSS('opacity','0');
 await page.locator('#guests').screenshot({path:'qa-artifacts/family-'+width+'.png',animations:'disabled'});
 await expect(page.getByRole('button',{name:/Родные/})).toContainText('15');

 await page.getByRole('button',{name:/Друзья/}).click();
 await expect(page.locator('.family-side')).toHaveCount(0);
 await expect(page.locator('.guest-album .guest-print')).toHaveCount(11);
 await page.getByRole('button',{name:/Родные/}).click();
 await expect(page.locator('.family-side')).toHaveCount(2);
 await expect(page.locator('.family-anchor-card')).toHaveCount(0);

 expect((await page.evaluate(inspectLayout)).documentOverflow).toBe(0);
 await page.screenshot({path:info.outputPath('after-switch.png')});
});
