import {test,expect} from 'playwright/test';
import fs from 'node:fs';
import matrix from './viewports.json';
import {inspectLayout} from '../helpers/ui-audit.mjs';
const representative=new Set(['320x568','375x667','390x844','430x932','844x390','768x1024','1024x768','1024x600','1366x768','1440x900','1920x1080','2560x1440','3440x1440']);
const write=(name:string,value:unknown)=>fs.writeFileSync('qa-artifacts/'+name,JSON.stringify(value,null,2));
for(const size of matrix)test('matrix '+size.width+'x'+size.height,async({page})=>{
 await page.request.post('/qa/reset');await page.clock.setFixedTime(new Date('2026-10-29T09:00:00Z'));
 const key=size.width+'x'+size.height,states:Record<string,unknown>={},errors:string[]=[],failures:string[]=[];
 await page.setViewportSize(size);await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(()=>sessionStorage.setItem('anya-maxim-opening-v1','yes'));
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push(r.status()+' '+new URL(r.url()).pathname);});
 page.on('console',message=>{if(['error','warning'].includes(message.type()))errors.push(message.text().slice(0,500));});
 await page.goto('/');await expect(page.locator('main.invitation')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
 async function inspect(name:string){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));states[name]=await page.evaluate(inspectLayout);}
 await inspect('public');
 if(representative.has(key)){
  await page.evaluate(async()=>{for(const img of document.images)img.loading='eager';await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));for(let y=0;y<document.documentElement.scrollHeight;y+=innerHeight){scrollTo({top:y,behavior:'instant'});await new Promise(r=>requestAnimationFrame(r));}scrollTo({top:0,behavior:'instant'});});
  await page.screenshot({path:'qa-artifacts/home-'+key+'.png',fullPage:true});
  for(const id of ['.portrait-hero','#date','#venue','#dress-allowed','#guests','#schedule','#questions','#rsvp'])await page.locator(id).screenshot({path:'qa-artifacts/'+id.replace(/[#.]/g,'')+'-'+key+'.png',animations:'disabled'});
 }
 for(const gender of ['Для девушек','Для мужчин']){
  await page.locator('.dress-original-tabs').getByRole('button',{name:gender,exact:true}).click();
  for(const part of ['Одежда','Аксессуары']){
   await page.locator('.dress-original-tabs').getByRole('button',{name:part,exact:true}).click();await page.locator('#dress-allowed').scrollIntoViewIfNeeded();await inspect(gender+'/'+part);
  }
 }
 await page.locator('#question-transfer-to').click();await inspect('FAQ long');
 await page.locator('input[name=guestName]').fill('ДлинноеИмяБезПробелов'.repeat(4));await page.locator('#rsvp').getByRole('button',{name:'Приду',exact:true}).click();await page.locator('textarea[name=musicRequest]').fill('ОченьДлинноеСловоБезПробелов'.repeat(12));await page.locator('textarea[name=food]').fill('Длинный текст '.repeat(20));await inspect('RSVP yes long');
 await page.locator('#rsvp').getByRole('button',{name:'Не приду',exact:true}).click();await inspect('RSVP no');
 if(representative.has(key)){await page.goto('/venue-rules');await inspect('rules');await page.screenshot({path:'qa-artifacts/rules-'+key+'.png',fullPage:true});}
 write('matrix-'+key+'.json',{size,states,errors,failures});
 expect.soft(errors).toEqual([]);expect.soft(failures).toEqual([]);
 // Root overflow is a hard regression; element-level findings are triaged visually.
 for(const [name,result] of Object.entries(states)){
  const audit=result as {documentOverflow:number;overflow:unknown[];clipping:unknown[];gaps:unknown[]};
  expect.soft(audit.documentOverflow,name).toBeLessThanOrEqual(1);expect.soft(audit.overflow,name+' masked overflow').toEqual([]);expect.soft(audit.clipping,name+' clipped text').toEqual([]);expect.soft(audit.gaps,name+' excessive gaps').toEqual([]);
 }
});
