import {test,expect,type Page,type Locator} from 'playwright/test';

async function ready(page:Page){await page.evaluate(()=>document.fonts.ready);}
async function publicPage(page:Page){
 await page.addInitScript(()=>sessionStorage.setItem('anya-maxim-opening-v1','yes'));
 await page.goto('/');await expect(page.locator('main.invitation')).toBeVisible();await ready(page);
}
async function overflow(page:Page){
 const dimensions=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
 expect(dimensions.scroll,'Document must not scroll horizontally').toBeLessThanOrEqual(dimensions.width+1);
}
async function image(page:Page,target:Page|Locator,name:string){
 await ready(page);await page.mouse.move(0,0);await overflow(page);
 await expect.soft(target).toHaveScreenshot(name,{...(target===page?{fullPage:true}:{})});
}
async function scrollWholePage(page:Page){
 await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=500){window.scrollTo({top:y,behavior:"instant"});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}window.scrollTo({top:0,behavior:"instant"});});
 await page.evaluate(async()=>{for(const img of document.images)img.loading='eager';await Promise.all([...document.images].filter(img=>img.getBoundingClientRect().height>0).map(img=>img.decode().catch(()=>{})));});
}
async function going(page:Page,name='Сергей Иванов 😀'){
 await page.locator('input[name=guestName]').fill(name);
 await page.getByRole('button',{name:'Приду',exact:true}).click();
 await page.locator('input[name=who]').fill('Друг семьи');
 await page.locator('input[name=alcoholDrinks][value=none]').check();
 await page.locator('input[name=softDrinks][value=cola]').check();
 await page.locator('input[name=transfer][value="kupchino"]').check();
 await page.locator('.paper-checkbox input:not([name])').check();
}

test.beforeEach(async({page,request})=>{
 // Explicit per-page media emulation also covers Chrome channels that ignore the context default.
 await page.emulateMedia({reducedMotion:"reduce"});
 // This route exists only in the isolated QA fixture and never touches a real database.
 const reset=await request.post('/qa/reset');expect(reset.ok()).toBeTruthy();
 await page.route('**/*',route=>{const host=new URL(route.request().url()).hostname;return ['localhost','127.0.0.1'].includes(host)?route.continue():route.abort();});
});

for(const viewport of [{width:375,height:812},{width:430,height:932},{width:1440,height:900}]){
 test('homepage '+viewport.width+'x'+viewport.height,async({page})=>{
  await page.setViewportSize(viewport);await publicPage(page);await scrollWholePage(page);
  await image(page,page,'homepage-'+viewport.width+'x'+viewport.height+'.png');
 });
}

test('sealed and open envelope',async({page})=>{
 await page.goto('/');await expect(page.getByRole('button',{name:'Открыть конверт',exact:true})).toBeVisible();
 await image(page,page,'envelope-sealed.png');
 await page.getByRole('button',{name:'Открыть конверт',exact:true}).press('Enter');
 await expect(page.locator('.opening--letter')).toBeVisible();
 await image(page,page,'envelope-open.png');
});

test('FAQ expanded answers and keyboard close',async({page})=>{
 await publicPage(page);const triggers=page.locator('.question-trigger');
 await expect(triggers).toHaveCount(4);
 for(const trigger of await triggers.all()){await expect(trigger).toHaveAttribute('aria-expanded','false');await trigger.click();await expect(trigger).toHaveAttribute('aria-expanded','true');}
 await image(page,page.locator('#questions'),'faq-expanded.png');
 await triggers.first().press('Space');await expect(triggers.first()).toHaveAttribute('aria-expanded','false');
 await triggers.first().press('Enter');await expect(triggers.first()).toHaveAttribute('aria-expanded','true');
 await triggers.first().click();await triggers.first().click();await triggers.first().click();await expect(triggers.first()).toHaveAttribute('aria-expanded','false');
 await overflow(page);
});

test('RSVP going, not going, five clean submissions and restored session',async({page})=>{
 const submissions:Record<string,unknown>[]=[];page.on('request',req=>{if(req.url().endsWith('/api/rsvp')&&req.method()==='POST')submissions.push(req.postDataJSON());});
 await publicPage(page);await going(page);
 await expect(page.locator('input[name=transfer]')).toHaveCount(3);await expect(page.locator('input[name=overnight]')).toHaveCount(0);
 for(const value of ['self','pavlovsk','kupchino']){await page.locator('input[name=transfer][value='+value+']').check();await expect(page.locator('input[name=transfer]:checked')).toHaveValue(value);}
 await page.locator('input[name=guestName]').fill('Анна');await expect(page.getByRole('button',{name:'Подтвердить участие',exact:true})).toBeDisabled();await page.locator('input[name=guestName]').fill('Сергей Иванов 😀');
 const submit=page.getByRole('button',{name:'Подтвердить участие',exact:true});
 const food=page.locator('textarea[name=food]'),music=page.locator('textarea[name=musicRequest]');
 await food.fill('А'.repeat(301));await expect(page.locator('#food-counter')).toHaveText('301 / 300');await expect(submit).toBeDisabled();
 await food.fill('А'.repeat(300));await music.fill('М'.repeat(301));await expect(submit).toBeDisabled();
 await music.fill('М'.repeat(300));await expect(submit).toBeEnabled();
 await page.locator('input[name=who]').fill('Я'.repeat(120));
 await image(page,page.locator('#rsvp'),'rsvp-going.png');
 await page.getByRole('button',{name:'Не приду',exact:true}).click();await expect(page.locator('.rsvp-details')).toHaveCount(0);await expect(submit).toBeEnabled();
 await image(page,page.locator('#rsvp'),'rsvp-not-going.png');
 const sent=page.waitForRequest(req=>req.url().endsWith('/api/rsvp')&&req.method()==='POST');await submit.click();
 expect(Object.keys((await sent).postDataJSON()).sort()).toEqual(['attendance','guestName','submissionKey']);
 await expect(page.locator('#rsvp-success-title')).toHaveText('Ответ сохранён. Спасибо!');await expect(page.locator('#rsvp form')).toHaveCount(0);await expect(page.locator('#rsvp-title')).toHaveCount(0);
 await image(page,page.locator('#rsvp'),'rsvp-success-first.png');
 await page.getByRole('button',{name:'Добавить ещё гостя',exact:true}).click();
 for(const field of await page.locator('#rsvp input:not([type]),#rsvp textarea').all())await expect(field).toHaveValue('');
 await expect(page.getByRole('button',{name:'Приду',exact:true})).toHaveAttribute('aria-pressed','false');await expect(page.locator('#rsvp input:checked')).toHaveCount(0);await expect(submit).toBeDisabled();
 await going(page,'Ж'.repeat(78)+' Я');await food.fill('А'.repeat(300));await music.fill('М'.repeat(300));await submit.click();
 await expect(page.locator('.saved-guest')).toHaveCount(1);await expect(page.getByRole('button',{name:'Добавить ещё гостя',exact:true})).toBeVisible();await expect(page.locator('#rsvp form')).toHaveCount(0);
 await image(page,page.locator('#rsvp'),'rsvp-success-second.png');
 for(let i=3;i<=5;i++){await page.getByRole('button',{name:'Добавить ещё гостя',exact:true}).click();await expect(page.locator('input[name=guestName]')).toHaveValue('');await page.locator('input[name=guestName]').fill('Гость Номер'+i);await page.getByRole('button',{name:'Не приду',exact:true}).click();await submit.click();await expect(page.locator('.rsvp-confirmation')).toContainText(i+' гостей');}
 await page.reload();await expect(page.locator('.rsvp-confirmation')).toContainText('5 гостей');await expect(page.locator('.saved-guest')).toHaveCount(1);await image(page,page.locator('#rsvp'),'rsvp-session-multiple.png');expect(submissions.length).toBe(5);expect(new Set(submissions.map(s=>s.submissionKey)).size).toBe(5);expect(submissions.every(s=>!('overnight' in s))).toBeTruthy();await overflow(page);
});

test('Telegram list and maximum-length guest detail',async({page})=>{
 await page.goto('/telegram');await expect(page.locator('.admin-guests button')).toHaveCount(1);await expect(page.locator('.admin-counts')).toContainText('Ответов 1');
 await image(page,page,'telegram-list.png');
 await page.locator('.admin-guests button').click();await expect(page.locator('.admin-detail dd')).toHaveCount(7);
 await image(page,page,'telegram-detail-long.png');
 for(const width of [320,430,768]){await page.setViewportSize({width,height:932});await overflow(page);expect(await page.locator('.admin-detail').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBeTruthy();}
});

test('normal motion survives fast scroll, accordion and resize',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await publicPage(page);
 await page.locator('#questions').scrollIntoViewIfNeeded();const trigger=page.locator('.question-trigger').first();
 await trigger.click();await trigger.click();await trigger.click();await expect(trigger).toHaveAttribute('aria-expanded','true');
 await page.setViewportSize({width:430,height:932});await page.locator('#rsvp').scrollIntoViewIfNeeded();await overflow(page);
 await page.setViewportSize({width:1440,height:900});await page.locator('#date').scrollIntoViewIfNeeded();await overflow(page);
 await expect(page.locator('.wedding-calendar')).toHaveClass(/motion-visible/);
});


test('polished sections at mobile, tablet and desktop',async({page},testInfo)=>{
 await publicPage(page);await scrollWholePage(page);
 for(const width of [375,430,768,1440]){
  await page.setViewportSize({width,height:width===1440?900:width===430?932:812});await overflow(page);
  for(const id of ['.portrait-hero','#date','#venue','#dress-code','#guests','#schedule']){
   const section=page.locator(id);await section.scrollIntoViewIfNeeded();await ready(page);
   await section.screenshot({path:testInfo.outputPath('review-'+id.replace(/[.#]/g,'')+'-'+width+'.png'),animations:'disabled'});
  }
 }
});

test('paper airplane, focus and catalogue interaction with normal motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/');await page.getByRole('button',{name:'Открыть конверт',exact:true}).click();
 await expect(page.locator('.opening--letter')).toBeVisible();
 await page.locator('.letter-content button').click();
 await expect(page.locator('.opening--folding')).toBeVisible();
 await expect(page.locator('main')).toBeHidden();await expect(page.locator('main')).toHaveAttribute('inert','');
 await expect(page.locator('.opening--flight .letter-rig[data-paper-airplane=true]')).toBeVisible();
 await expect(page.locator('main')).toBeHidden();
 await expect.poll(()=>page.locator('.paper-wing--left').evaluate(el=>Number(getComputedStyle(el).opacity))).toBeGreaterThan(.9);
 await expect(page.locator('.opening')).toHaveCount(0);await expect(page.locator('main')).toBeFocused();await expect(page.locator('main')).not.toHaveAttribute('inert','');
 await page.locator('#dress-code').scrollIntoViewIfNeeded();const stage=page.locator('#dress-allowed .lookbook-stage');
 await page.getByRole('button',{name:'Так можно: Следующий пример',exact:true}).click();await page.getByRole('button',{name:'Так можно: Следующий пример',exact:true}).click();
 await expect(page.locator('#dress-allowed .gallery-counter')).toHaveText('03 / 03');
 await page.getByRole('button',{name:'Для мужчин',exact:true}).click();await expect(page.locator('#dress-allowed .lookbook-placeholder')).toBeVisible();
 await expect(page.locator('#dress-allowed .gallery-counter')).toHaveText('01 / 02');
 await page.getByRole('button',{name:'Для девушек',exact:true}).click();await expect(page.locator('#dress-allowed .lookbook-incoming img')).toHaveAttribute('src',/dress-women/);
 await stage.focus();await stage.press('ArrowRight');await expect(page.locator('#dress-allowed .gallery-counter')).toHaveText('02 / 03');
 await stage.evaluate(el=>el.scrollIntoView({block:"start",behavior:"instant"}));const rect=await stage.boundingBox();if(!rect)throw new Error('Lookbook missing');await page.mouse.move(rect.x+250,rect.y+120);await page.mouse.down();await page.mouse.move(rect.x+80,rect.y+125,{steps:5});await page.mouse.up();
 await expect(page.locator('#dress-allowed .gallery-counter')).toHaveText('03 / 03');
 await stage.evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));const touch=await page.context().newCDPSession(page);const box=await stage.boundingBox();if(!box)throw new Error('Lookbook missing');const y=box.y+120;await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:275,y}]});for(const x of [230,185,140,95,70]){await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await page.waitForTimeout(20);}await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(page.locator('#dress-allowed .gallery-counter')).toHaveText('01 / 03');
 expect(await stage.evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBeTruthy();await overflow(page);
 await page.emulateMedia({reducedMotion:'reduce'});await expect.poll(()=>page.locator('.portrait-hero-photo').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});


for(const viewport of [{width:375,height:812},{width:1440,height:900}]){
 test('paper airplane transition '+viewport.width,async({page},testInfo)=>{
  await page.clock.install({time:new Date('2026-10-12T12:00:00Z')});
  await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');await page.addStyleTag({content:'html,body{overflow-anchor:none!important}'});await page.getByRole('button',{name:'Открыть конверт',exact:true}).click();
  await expect(page.locator('.opening--letter')).toBeVisible();await ready(page);
  await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now())+100));
  await page.locator('.letter-content button').click();
  await expect(page.locator('.opening--folding')).toBeVisible();await expect(page.locator('main')).toBeHidden();
  const plane=page.locator('.letter-rig[data-paper-airplane=true]');await expect(plane).toBeVisible();
  await page.clock.runFor(1800);
  await expect(page.locator('.opening--flight')).toBeVisible();await expect(page.locator('main')).toBeHidden();
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  // Inspect a genuine CSS flight, then pause a deterministic intermediate frame, not a mock icon.
  const state=await plane.evaluate(el=>{
   const flight=el.getAnimations().find(a=>(a as CSSAnimation).animationName==='letter-flight');
   if(!flight)throw new Error('Original letter-flight animation is missing');
   for(const animation of document.querySelector('.opening')!.getAnimations({subtree:true})){
    animation.pause();const name=(animation as CSSAnimation).animationName;
    animation.currentTime=name==='letter-flight'?350:name==='wipe'?0:Number(animation.effect!.getComputedTiming().endTime)+1;
   }
   return {name:(flight as CSSAnimation).animationName,transform:getComputedStyle(el).transform};
  });
  expect(state.name).toBe('letter-flight');expect(state.transform).not.toBe('none');
  await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});document.querySelector('.opening')!.getBoundingClientRect();});
  // Baseline the physical airplane itself; the full scene remains a review artifact.
  // This avoids Chrome's viewport scroll restoration changing the scene crop.
  await expect.soft(plane).toHaveScreenshot('paper-airplane-'+viewport.width+'.png',{animations:'allow'});
  await page.locator('.opening').screenshot({path:testInfo.outputPath('paper-airplane-scene.png'),animations:'allow'});
  await page.clock.runFor(1150);
  await expect(page.locator('.opening')).toHaveCount(0);await expect(page.locator('main')).toBeVisible();await expect(page.locator('main')).toBeFocused();
  await expect(page.locator('main')).not.toHaveAttribute('inert','');
  expect(await page.locator('.portrait-hero-photo').evaluate(el=>getComputedStyle(el).animationName)).toBe('invite-hero-photo');
 });
}

test('reduced motion letter opens Hero without a full flight',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Открыть конверт',exact:true}).click();await expect(page.locator('.opening--letter')).toBeVisible();
 await page.locator('.letter-content button').click();await expect(page.locator('.opening')).toHaveCount(0,{timeout:1000});await expect(page.locator('main')).toBeFocused();
 expect(await page.locator('.portrait-hero-photo').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});

test('section motion identities, timeline progress and one-shot reveals',async({page},testInfo)=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await publicPage(page);
 for(const width of [375,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const id of ['date','venue','guests','dress-code','schedule','questions','rsvp']){
   const section=page.locator('#'+id);
   await section.evaluate(async el=>{const top=el.getBoundingClientRect().top+window.scrollY;for(let y=top;y<top+el.clientHeight;y+=500){window.scrollTo({top:y,behavior:'instant'});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}window.scrollTo({top,behavior:'instant'});});
   await page.waitForTimeout(950);
   await section.screenshot({path:testInfo.outputPath('motion-'+id+'-'+width+'.png'),animations:'allow'});
   await overflow(page);
  }
 }
 await expect(page.locator('.question-item.motion-ready')).toHaveCount(0);
 await expect(page.locator('.venue-copy .motion-ready:not(.watercolor)')).toHaveCount(0);
 await expect(page.locator('.rsvp-paper input.motion-ready')).toHaveCount(0);
 const line=page.locator('.schedule-spread');
 const previous=await line.getAttribute('data-line-progress');expect(Number(previous)).toBeGreaterThan(0);
 await page.locator('#schedule li').last().scrollIntoViewIfNeeded();
 await expect.poll(async()=>Number(await line.getAttribute('data-line-progress'))).toBeGreaterThanOrEqual(Number(previous));
 await page.locator('#date').scrollIntoViewIfNeeded();await page.locator('#schedule').scrollIntoViewIfNeeded();
 expect(Number(await line.getAttribute('data-line-progress'))).toBeGreaterThanOrEqual(Number(previous));
 await expect(page.locator('#venue')).toHaveClass(/motion-visible/);
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.motion-ready')).toHaveCount(0);
 await expect(line).not.toHaveClass(/timeline-ready/);
});

test('new venue and both lookbooks',async({page})=>{
 await publicPage(page);
 await expect(page.locator('.venue-name')).toHaveText('Пушкинская Усадьба');
 await expect(page.locator('#venue')).toContainText('Спальных мест нет');
 const map=await page.getByRole('link',{name:'Показать на карте'}).getAttribute('href');expect(decodeURIComponent(map||'')).toContain('Пушкинская Усадьба');expect(decodeURIComponent(map||'')).toContain('Фёдоровское');
 await expect(page.locator('.venue-current-photo')).toHaveAttribute('src',/pushkinskaya-01/);
 await expect(page.locator('#venue .gallery-counter')).toHaveText('01 / 02');
 await page.getByRole('button',{name:'Следующее фото площадки',exact:true}).click();await expect(page.locator('#venue .gallery-counter')).toHaveText('02 / 02');
 await expect(page.locator('.venue-current-photo')).toHaveAttribute('src',/pushkinskaya-02/);
 await image(page,page.locator('#venue'),'venue-pushkinskaya.png');
 await image(page,page.locator('#dress-code'),'dress-women.png');
 await image(page,page.locator('#dress-allowed'),'dress-allowed.png');
 await image(page,page.locator('#dress-avoid'),'dress-avoid.png');
 await page.getByRole('button',{name:'Для мужчин',exact:true}).click();await expect(page.locator('#dress-allowed .gallery-counter')).toHaveText('01 / 02');
 await image(page,page.locator('#dress-code'),'dress-men.png');
 await page.getByRole('button',{name:'Так не надо: Следующий пример',exact:true}).click();await expect(page.locator('#dress-avoid .gallery-counter')).toHaveText('02 / 03');await overflow(page);
});
