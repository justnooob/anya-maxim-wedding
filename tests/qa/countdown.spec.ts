import {test,expect} from 'playwright/test';
import {calendarCountdown} from '../../src/client/countdown.mjs';
const target=Date.parse('2027-07-17T15:00:00+03:00'),fixed=Date.parse('2026-10-29T09:00:00Z');
test.beforeEach(async({page,request})=>{await request.post('/qa/reset');await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(()=>sessionStorage.setItem('anya-maxim-opening-v1','yes'));});
for(const state of [
 {name:'desktop',width:1440,height:900}, {name:'mobile',width:375,height:812},
 {name:'very-narrow',width:280,height:653},{name:'landscape',width:844,height:390},
 {name:'tablet',width:768,height:1024},{name:'zoom-200-reflow',width:720,height:450},
 {name:'large-values',width:1440,height:900,time:Date.parse('2025-05-25T12:30:40Z')},
 {name:'zero',width:375,height:812,time:target+86400000},
])test('countdown visual '+state.name,async({page})=>{
 await page.setViewportSize(state);await page.clock.setFixedTime(new Date(state.time??fixed));await page.goto('/');await expect(page.locator('.wedding-countdown')).toHaveAttribute('data-ready','true');await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('#date')).toHaveScreenshot('countdown-'+state.name+'.png');
 const expected=calendarCountdown(state.time??fixed,target);await expect(page.locator('.countdown-number')).toHaveText(['months','days','hours','minutes','seconds'].map(key=>String(expected[key as keyof Omit<typeof expected,'finished'>]).padStart(2,'0')));if(expected.finished)await expect(page.locator('.countdown-heading')).toHaveText('Всё. По нулям.');
});
for(const timezoneId of ['Europe/Moscow','Europe/Berlin','Asia/Tokyo','America/New_York'])test('browser countdown timezone '+timezoneId,async({browser})=>{
 const context=await browser.newContext({timezoneId});const page=await context.newPage();await page.emulateMedia({reducedMotion:'reduce'});await page.clock.setFixedTime(new Date(fixed));await page.addInitScript(()=>sessionStorage.setItem('anya-maxim-opening-v1','yes'));await page.goto('http://localhost:3310/');await expect(page.locator('.wedding-countdown')).toHaveAttribute('data-ready','true');const expected=calendarCountdown(fixed,target);await expect(page.locator('.countdown-number')).toHaveText([expected.months,expected.days,expected.hours,expected.minutes,expected.seconds].map(value=>String(value).padStart(2,'0')));await context.close();
});
test('countdown ticks, resumes from absolute time, has one interval and reaches zero without requests or layout jump',async({page})=>{
 await page.clock.install({time:new Date(target-61000)});
 await page.addInitScript(()=>{
  const intervals=new Set<number>(),set=window.setInterval.bind(window),clear=window.clearInterval.bind(window);
  window.setInterval=((handler:TimerHandler,timeout?:number,...args:unknown[])=>{const id=set(handler,timeout,...args);if(timeout===1000)intervals.add(id);return id;}) as typeof window.setInterval;
  window.clearInterval=((id:number)=>{intervals.delete(id);clear(id);}) as typeof window.clearInterval;
  (window as unknown as {qaIntervals:Set<number>}).qaIntervals=intervals;
 });
 await page.goto('/');const timer=page.locator('.wedding-countdown');await expect(timer).toHaveAttribute('data-ready','true');await page.evaluate(()=>document.fonts.ready);await timer.scrollIntoViewIfNeeded();const before=(await timer.boundingBox())!;let requests=0;page.on('request',request=>{if(request.url().includes('/api/'))requests++;});
 await page.clock.runFor(1000);await expect(page.locator('[data-countdown-unit=seconds] .countdown-number')).toHaveText('00');await expect(page.locator('[data-countdown-unit=minutes] .countdown-number')).toHaveText('01');
 for(const width of [320,1440,390])await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>(window as unknown as {qaIntervals:Set<number>}).qaIntervals.size)).toBe(1);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});expect(await page.evaluate(()=>(window as unknown as {qaIntervals:Set<number>}).qaIntervals.size)).toBe(0);
 await page.clock.setSystemTime(new Date(target-1000));await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await expect(page.locator('[data-countdown-unit=seconds] .countdown-number')).toHaveText('01');
 const ready=(await timer.boundingBox())!;await page.clock.runFor(1100);await expect(timer).toHaveAttribute('data-finished','true');await expect(page.locator('.countdown-number')).toHaveText(['00','00','00','00','00']);expect(Math.abs((await timer.boundingBox())!.height-ready.height)).toBeLessThan(1);expect(before.height).toBeGreaterThan(0);expect(requests).toBe(0);expect(await timer.getAttribute('aria-live')).toBe('off');expect(await page.evaluate(()=>(window as unknown as {qaIntervals:Set<number>}).qaIntervals.size)).toBe(0);
});
