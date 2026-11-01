import fs from 'node:fs/promises';
import {test,expect,type Page} from 'playwright/test';
async function open(page:Page){await page.addInitScript(()=>sessionStorage.setItem('anya-maxim-opening-v1','yes'));await page.goto('/#rsvp');await expect(page.locator('input[name=guestName]')).toBeVisible();}
async function no(page:Page,name:string){await page.locator('input[name=guestName]').fill(name);await page.getByRole('button',{name:'Не приду',exact:true}).click();await page.getByRole('button',{name:'Подтвердить участие',exact:true}).click();await expect(page.locator('#rsvp-success-title')).toHaveText('Спасибо, мы всё сохранили!');}
const matrix=[[280,653],[320,568],[375,667],[390,844],[430,932],[568,320],[844,390],[768,1024],[1024,768],[1366,768],[1920,1080]];
for(const [width,height] of matrix)test(`ticket success, cancel, reload and download ${width}x${height}`,async({page},info)=>{
 await page.setViewportSize({width,height});await open(page);await no(page,'Иван Петров');await expect(page.locator('.saved-guest')).toHaveCount(1);await expect(page.locator('#rsvp-title')).toHaveCount(0);
 await page.getByRole('button',{name:'Добавить ещё гостя',exact:true}).click();await expect(page.locator('input[name=guestName]')).toHaveValue('');await page.locator('input[name=guestName]').fill('Не сохранять');await page.getByRole('button',{name:'Отменить добавление',exact:true}).click();await expect(page.locator('.saved-guest')).toHaveCount(1);expect(await page.evaluate(()=>sessionStorage.getItem('anya-maxim-rsvp-draft-v2'))).toBeNull();
 await page.getByRole('button',{name:'Добавить ещё гостя',exact:true}).click();await expect(page.locator('input[name=guestName]')).toHaveValue('');await no(page,'Мария Петрова');
 await page.reload();await expect(page.locator('.saved-guest')).toHaveCount(2);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Скачать приглашение',exact:true}).click();const file=await download;expect(file.suggestedFilename()).toBe('anya-maxim-invitation.pdf');const path=await file.path();expect((await fs.readFile(path!)).subarray(0,5).toString()).toBe('%PDF-');
 await expect(page.locator('.rsvp-confirmation')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBeTruthy();
 await page.locator('.rsvp-confirmation').screenshot({path:info.outputPath(`success-${width}x${height}.png`)});
 if(info.project.name!=="webkit"&&(width===390||width===1366))await expect(page.locator('#rsvp')).toHaveScreenshot(`ticket-success-${width}.png`);
});
test('five saved answers block sixth, PDF errors keep saved screen, server failures never report success',async({page})=>{
 await open(page);for(let i=1;i<=5;i++){if(i>1)await page.getByRole('button',{name:'Добавить ещё гостя',exact:true}).click();await no(page,'Гость Номер'+i);}
 await expect(page.locator('.saved-guest')).toHaveCount(5);await expect(page.getByRole('button',{name:'Добавить ещё гостя',exact:true})).toHaveCount(0);await expect(page.locator('.rsvp-confirmation')).toContainText('5 ответов');
 await page.route('**/api/rsvp/invitation',route=>route.fulfill({status:503,contentType:'application/json',body:'{}'}));await page.getByRole('button',{name:'Скачать приглашение',exact:true}).click();await expect(page.locator('.rsvp-confirmation [role=alert]')).toContainText('Ответы сохранены');await expect(page.locator('.saved-guest')).toHaveCount(5);
 await page.context().clearCookies();await page.reload();await expect(page.locator('input[name=guestName]')).toBeVisible();await page.route('**/api/rsvp',route=>route.request().method()==='POST'?route.fulfill({status:503,body:'{}'}):route.continue());await page.locator('input[name=guestName]').fill('Неуспешный Гость');await page.getByRole('button',{name:'Не приду',exact:true}).click();await page.getByRole('button',{name:'Подтвердить участие',exact:true}).click();await expect(page.locator('.rsvp-confirmation')).toHaveCount(0);await expect(page.locator('#rsvp [role=alert]')).toBeVisible();
});
test('public HTML exposes absolute OG with static image, calendar has public event, PDF denies missing cookie',async({request})=>{
 const html=await (await request.get('/')).text();expect(html).toContain('https://anyaxmaxim.ru/images/wedding-og.jpg');expect(html).toContain('summary_large_image');expect(html).toContain('noindex');const img=await request.get('/images/wedding-og.jpg');expect(img.status()).toBe(200);expect(img.headers()['content-type']).toContain('image/jpeg');expect((await request.get('/api/rsvp/invitation')).status()).toBe(401);const ics=await (await request.get('/calendar.ics')).text();expect(ics).toContain('DTSTART:20270717T120000Z');
});
