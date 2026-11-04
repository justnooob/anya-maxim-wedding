import {test,expect,type Page,type Locator} from 'playwright/test';
import fs from 'node:fs';
import {inspectLayout} from '../helpers/ui-audit.mjs';
const roots=['#date','.wedding-calendar','.calendar-reminder','.wedding-countdown','#venue','.venue-copy','.dress-chapter>.chapter-heading','.dress-notices','.dress-original-tabs','.palette-family','.material-group','#dress-allowed','.lookbook-description','.schedule-spread li','.questions-heading','.question-item','#rsvp>.chapter-heading'];
async function frames(page:Page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function finish(el:Locator){await el.evaluate(async node=>{await Promise.all(node.getAnimations({subtree:true}).filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});}
test.beforeEach(async({page,request})=>{await request.post('/qa/reset');await page.emulateMedia({reducedMotion:'no-preference'});await page.clock.setFixedTime(new Date('2026-10-29T09:00:00Z'));await page.addInitScript(()=>sessionStorage.setItem('anya-maxim-opening-v1','yes'));});
for(const size of [{width:390,height:844},{width:768,height:1024},{width:1440,height:900}])test('composition gates, visible intermediate scenes and whole-content finish '+size.width,async({page})=>{
 test.setTimeout(180000);await page.setViewportSize(size);await page.goto('/');await expect(page.locator('main.invitation')).toBeVisible();await page.evaluate(()=>document.fonts.ready);await finish(page.locator('.portrait-hero'));
 const observations=[];
 for(const [index,selector]of roots.entries()){
  await page.goto('/');await expect(page.locator('main.invitation')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  const el=page.locator(selector).first();await expect(el).toHaveAttribute('data-motion-state','pending');const top=await el.evaluate(node=>node.getBoundingClientRect().top+scrollY);
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.max(0,top-size.height*1.15));await frames(page);
  const delta=await el.evaluate(node=>node.getBoundingClientRect().top-innerHeight*.90);if(delta>0)await page.mouse.wheel(0,delta);await frames(page);await page.waitForTimeout(100);
  const before=await el.getAttribute('data-motion-state');expect(before,selector+' must wait at 90% viewport').toBe('pending');
  const name=index+'-'+selector.replace(/[^a-z-]/g,'');await page.screenshot({path:`qa-artifacts/scene-${size.width}-${name}-before.png`,animations:'allow'});
  await page.mouse.wheel(0,size.height*.20);await expect(el).toHaveAttribute('data-motion-state','visible');
  const gate=Number(await el.getAttribute('data-motion-trigger'));expect(gate).toBeGreaterThanOrEqual(.72);expect(gate).toBeLessThanOrEqual(.80);
  const active=await el.evaluate(node=>node.getAnimations({subtree:true}).filter(a=>a.playState==='running').length);expect(active,selector+' must have a visible-duration transition').toBeGreaterThan(0);
  await page.screenshot({path:`qa-artifacts/scene-${size.width}-${name}-mid.png`,animations:'allow'});await finish(el);await page.screenshot({path:`qa-artifacts/scene-${size.width}-${name}-after.png`,animations:'allow'});
  if(selector.includes('heading')){await expect(el.locator('h2')).toHaveCSS('opacity','1');expect(await el.locator('h2').evaluate(n=>getComputedStyle(n).clipPath),selector+' heading mask must finish').not.toContain('100%');await expect(el.locator('h2')).toHaveCSS('translate','none');}
  const audit=await page.evaluate(inspectLayout);expect(audit.documentOverflow,selector).toBeLessThanOrEqual(1);observations.push({selector,before,gate,active});
 }
 fs.writeFileSync(`qa-artifacts/choreography-${size.width}.json`,JSON.stringify(observations,null,2));
 const visible=await page.locator('[data-motion-state=visible]').count();await page.mouse.wheel(0,-300);await page.setViewportSize({width:size.height,height:size.width});await page.setViewportSize(size);expect(await page.locator('[data-motion-state=visible]').count()).toBeGreaterThanOrEqual(visible);
});
for(const width of [375,1440])test('Hero image then names and secondary composition '+width,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');const hero=page.locator('.portrait-hero');await expect(page.locator('main.invitation')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
 const timing=await hero.evaluate(node=>{const photo=node.querySelector('.portrait-hero-photo')!,name=node.querySelector('.portrait-names>span')!;const p=getComputedStyle(photo),n=getComputedStyle(name);for(const a of node.getAnimations({subtree:true})){a.pause();a.currentTime=450;}return{photo:p.animationDuration,names:n.animationDelay};});
 expect(timing.photo).toBe(width===375?'1.1s':'1.2s');expect(parseFloat(timing.names)).toBeGreaterThanOrEqual(.8);await expect(page.locator('.portrait-names>span').first()).toHaveCSS('opacity','0');await hero.screenshot({path:`qa-artifacts/hero-scene-${width}-mid.png`,animations:'allow'});
 await hero.evaluate(node=>{for(const a of node.getAnimations({subtree:true}))a.finish();});await hero.screenshot({path:`qa-artifacts/hero-scene-${width}-after.png`,animations:'allow'});await expect(page.locator('.portrait-hero-photo')).toHaveCSS('opacity','1');await expect(page.locator('.portrait-names>span').last()).toHaveCSS('opacity','1');
});
test('restored scroll, keyboard bypass and reduced motion never strand current content',async({page})=>{
 await page.goto('/#rsvp');await expect(page.locator('main.invitation')).toBeVisible();await expect(page.locator('#rsvp')).toBeInViewport();await page.locator('input[name=guestName]').focus();await expect(page.locator('input[name=guestName]')).toBeFocused();await frames(page);await expect(page.locator('#rsvp>.chapter-heading')).toHaveCSS('opacity','1');
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.motion-ready')).toHaveCount(0);await expect(page.locator('.portrait-hero-photo')).toHaveCSS('animation-name','none');await expect(page.locator('#rsvp>.chapter-heading')).toHaveCSS('opacity','1');
});
