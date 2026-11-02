import {test,expect,type Page} from 'playwright/test';
import fs from 'node:fs';
import {inspectLayout} from '../helpers/ui-audit.mjs';
test.beforeEach(async({page,request})=>{await request.post('/qa/reset');await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(()=>sessionStorage.setItem('anya-maxim-opening-v1','yes'));await page.goto('/');await expect(page.locator('main.invitation')).toBeVisible();});
const submit=(page:Page)=>page.getByRole('button',{name:'Подтвердить участие',exact:true});
async function going(page:Page,omit=''){
 await page.locator('input[name=guestName]').fill('Тестовый Гость');await page.getByRole('button',{name:'Приду',exact:true}).click();
 await page.locator('input[name=who]').fill('Друг семьи');
 for(const [name,value] of [['congratulationChoice','public'],['hotAppetizer','hot_meat'],['mainCourse','main_fish'],['alcoholDrinks','none'],['softDrinks','cola'],['transfer','kupchino'],['returnTransfer','not_needed']])if(name!==omit)await page.locator(`input[name=${name}][value=${value}]`).check();
 await page.locator('input[name=dressCode]').check();await page.locator('input[name=venueRules]').check();
}
for(const missing of ['congratulationChoice','hotAppetizer','mainCourse','alcoholDrinks','softDrinks','transfer','returnTransfer'])test('RSVP prevents missing '+missing,async({page})=>{await going(page,missing);await expect(submit(page)).toBeEnabled();});
for(const attendance of ['yes','no'])test('RSVP '+attendance+' slow double click, clean next guest and restored success',async({page,request})=>{
 await page.setViewportSize({width:390,height:844});
 if(attendance==='yes')await going(page);else{await page.locator('input[name=guestName]').fill('Тестовый Гость');await page.getByRole('button',{name:'Не приду',exact:true}).click();}
 await expect(submit(page)).toBeEnabled();await request.get('/qa/config?delay=1200');
 await submit(page).dblclick({noWaitAfter:true});await expect(page.locator('#rsvp form')).toHaveAttribute('aria-busy','true');await expect(page.locator('#rsvp button[type=submit]')).toBeDisabled();
 await expect(page.locator('#rsvp-success-title')).toHaveText('Спасибо, мы всё сохранили!');expect((await(await request.get('/qa/count')).json()).total).toBe(2);
 await expect(page.locator('#rsvp-title')).toHaveCount(0);await page.locator('#rsvp').screenshot({path:'qa-artifacts/success-'+attendance+'.png'});
 await page.getByRole('button',{name:'Добавить ещё гостя',exact:true}).click();await expect(page.locator('input[name=guestName]')).toHaveValue('');await expect(page.locator('#rsvp input:checked')).toHaveCount(0);await expect(submit(page)).toBeEnabled();
 await page.locator('input[name=guestName]').fill('Второй Гость');await page.getByRole('button',{name:'Не приду',exact:true}).click();await submit(page).click();await expect(page.locator('.rsvp-confirmation')).toContainText('2 гостей');await page.reload();await expect(page.locator('.rsvp-confirmation')).toContainText('2 гостей');expect((await(await request.get('/qa/count')).json()).total).toBe(3);
});
test('fragment destinations survive a reload after hidden intro hydration',async({page})=>{
 await page.addInitScript(()=>{
  const records:unknown[]=[];(window as unknown as {qaAnchors:unknown[]}).qaAnchors=records;
  const original=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(...args){records.push({event:'scrollIntoView',id:this.id,hidden:document.querySelector('main')?.hidden,ready:document.readyState,hash:location.hash});return original.apply(this,args);};
  window.addEventListener('scroll',()=>records.push({event:'scroll',y:scrollY,hash:location.hash}));
 });
 for(const id of ['date','venue','dress-code','guests','schedule','questions','rsvp']){await page.goto('/venue-rules');await page.goto('/#'+id);await expect(page).toHaveURL(new RegExp('#'+id+'$'));await page.reload();await expect(page.locator('main.invitation')).toBeVisible();await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});fs.writeFileSync('qa-artifacts/anchor-'+id+'.json',JSON.stringify(await page.evaluate(()=>({records:(window as unknown as {qaAnchors:unknown[]}).qaAnchors,hash:location.hash,y:scrollY,hidden:document.querySelector('main')?.hidden})),null,2));await expect(page.locator('#'+id)).toBeInViewport();}
});
test('RSVP required controls, other drinks, limits and keyboard-sized viewport',async({page})=>{
 await expect(submit(page)).toBeEnabled();await going(page);await expect(submit(page)).toBeEnabled();
 for(const selector of ['input[name=who]','input[name=transfer]:checked','input[name=hotAppetizer]:checked','input[name=mainCourse]:checked','input[name=congratulationChoice]:checked','input[name=dressCode]','input[name=venueRules]']){
  const field=page.locator(selector);if(selector.includes('who')){await field.fill('');await expect(submit(page)).toBeEnabled();await field.fill('Друг');}else if(selector.includes(':checked')){continue;}else{await field.uncheck();await expect(submit(page)).toBeEnabled();await field.check();}
 }
 await page.locator('input[name=alcoholDrinks][value=other]').check();await expect(submit(page)).toBeEnabled();await page.locator('input[name=alcoholOther]').fill('Сидр');await expect(submit(page)).toBeEnabled();
 await page.locator('input[name=softDrinks][value=other]').check();await expect(submit(page)).toBeEnabled();await page.locator('input[name=softOther]').fill('Чай');await expect(submit(page)).toBeEnabled();
 for(const name of ['food','musicRequest']){const field=page.locator('textarea[name='+name+']');await field.fill('Д'.repeat(301));await expect(submit(page)).toBeEnabled();await field.fill('Д'.repeat(300));await expect(submit(page)).toBeEnabled();await field.focus();await page.setViewportSize({width:390,height:380});await field.scrollIntoViewIfNeeded();await expect(field).toBeInViewport();expect(await page.locator('.dress-floating').isVisible()).toBe(false);await page.setViewportSize({width:390,height:844});}
 await page.locator('#rsvp').screenshot({path:'qa-artifacts/rsvp-max-content.png'});const audit=await page.evaluate(inspectLayout);expect(audit.documentOverflow).toBe(0);fs.writeFileSync('qa-artifacts/rsvp-limits.json',JSON.stringify(audit,null,2));
});
test('RSVP network failure keeps draft and can be retried without duplicate',async({page,request})=>{
 await going(page);await request.get('/qa/config?status=503');await submit(page).click();await expect(page.locator('#rsvp [role=alert]')).toBeVisible();await expect(page.locator('input[name=guestName]')).toHaveValue('Тестовый Гость');expect((await(await request.get('/qa/count')).json()).total).toBe(1);
 await request.get('/qa/config');await submit(page).click();await expect(page.locator('#rsvp-success-title')).toBeVisible();expect((await(await request.get('/qa/count')).json()).total).toBe(2);
});
test('FAQ rapid intent, keyboard, Motya action and refresh anchor',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});const triggers=page.locator('.question-trigger');
 for(let i=0;i<14;i++){await triggers.nth(i%7).click();expect(await page.locator('.question-trigger[aria-expanded=true]').count()).toBeLessThanOrEqual(1);}
 await page.locator('#question-speeches').click();await expect(page.locator('#question-speeches')).toHaveAttribute('aria-expanded','true');await page.locator('#answer-speeches').screenshot({path:'qa-artifacts/faq-long-answer.png'});
 await page.locator('#question-flowers').press('Enter');await expect(page.locator('#question-flowers')).toHaveAttribute('aria-expanded','true');
 const motya=page.locator('#answer-flowers button');await expect(motya).toHaveCount(1);await page.evaluate(()=>sessionStorage.setItem('anya-maxim-motya-meows-v1','3'));await motya.focus();await page.keyboard.press('Enter');await expect(page.locator('.motya-toast')).toBeVisible();await page.keyboard.press('Escape');
 await page.goto('/#questions');await expect(page.locator('#questions')).toBeInViewport();await page.reload();await expect(page.locator('#questions')).toBeInViewport();
});
