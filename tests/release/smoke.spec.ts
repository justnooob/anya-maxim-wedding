import {test,expect} from 'playwright/test';
test.beforeEach(async({page,request})=>{await request.post('/qa/reset');await page.addInitScript(()=>sessionStorage.setItem('anya-maxim-opening-v1','yes'));});
for(const width of [320,390,768,1440])test('release family photos, FAQ and no horizontal overflow '+width,async({page},info)=>{
 await page.setViewportSize({width,height:900});await page.goto('/#guests');
 const groom=page.locator('#relatives-groom .family-anchor-card img'),bride=page.locator('#relatives-bride .family-anchor-card img');
 await expect(groom).toHaveAttribute('src','/images/guests/couple/maxim.webp');await expect(bride).toHaveAttribute('src','/images/guests/couple/anya.webp');
 await expect(groom).toBeVisible();await expect(groom).toHaveJSProperty('naturalWidth',720);
 if(width<=1000)await page.getByRole('button',{name:'Невесты',exact:true}).click();await expect(bride).toBeVisible();await expect(bride).toHaveJSProperty('naturalWidth',720);
 await page.locator('#guests').screenshot({path:info.outputPath('family-'+width+'.png'),animations:'disabled'});
 const triggers=page.locator('.question-trigger');await triggers.first().click();await expect(triggers.first()).toHaveAttribute('aria-expanded','true');await triggers.nth(1).click();await expect(triggers.first()).toHaveAttribute('aria-expanded','false');await expect(triggers.nth(1)).toHaveAttribute('aria-expanded','true');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
});
test('release unsigned Mini App and PDF never expose private data',async({page,request})=>{
 await page.goto('/telegram');await expect(page.getByText('Эта страница доступна только организаторам через Telegram.')).toBeVisible();await expect(page.locator('.admin-guests')).toHaveCount(0);
 expect((await request.get('/api/telegram/mini-app')).status()).toBe(403);expect((await request.get('/api/rsvp/invitation')).status()).toBe(401);
 const calendar=await request.get('/calendar.ics');expect(calendar.ok()).toBeTruthy();const ics=await calendar.text();expect(ics).toContain('DTSTART:20270717T120000Z');expect(ics).toContain('TRIGGER:-P7D');
 const image=await request.get('/images/wedding-og.jpg');expect(image.ok()).toBeTruthy();
});
