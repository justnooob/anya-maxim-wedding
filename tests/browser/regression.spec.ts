import fs from 'node:fs';
import {test,expect,type Page,type Locator} from 'playwright/test';
import {dressPalettes} from '../../src/content/dress-palettes.mjs';
import {dressMaterialItems} from '../../src/content/dress-materials.mjs';

async function ready(page:Page){await page.evaluate(async()=>{await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));});}
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
 const originalScroll=await page.evaluate(()=>({x:scrollX,y:scrollY}));
 // Keep offscreen chapters at their previous layout during isolated component
 // captures. Full-page screenshots always use the real current layout. This
 // prevents upstream typography changes from re-rasterizing unrelated baselines.
 const section=target===page?null:await (target as Locator).evaluate(el=>el.closest('section')?.id);
 const isDressTarget=target!==page&&await (target as Locator).evaluate(el=>Boolean(el.closest('#dress-code')));
 const isolateAlbum=target!==page&&/^(faq-|rsvp-|congratulations-|motya-faq-|october-schedule-)/.test(name);
 const fixtures:string[]=[];
 // The new teaser is covered in full-page/navigation tests. Offscreen teaser
 // geometry must not change rasterization of unrelated isolated components.
 if(target!==page)fixtures.push('.wishlist-teaser{display:none}');
 // Fixed navigation is covered separately, outside isolated gallery/material captures.
 if(isDressTarget)fixtures.push('.dress-floating{visibility:hidden!important}');
 if(target!==page&&!isDressTarget)fixtures.push('#top .dress-materials{display:none}#top .dress-chapter .lookbook-guidance{min-height:330px;margin-bottom:64px;gap:24px;padding-top:32px}');
 // New Dress Code notices/guidance are captured in Dress Code and full-page
 // states. Unrelated isolated chapters retain their former offscreen geometry.
 if(target!==page&&!isDressTarget)fixtures.push('#top .dress-notices{display:contents}#top .dress-notices .dress-help--primary{display:none}#top .dress-notices .dress-help{max-width:690px;margin:0 auto 36px}#top .dress-chapter .lookbook-guidance{max-width:none;margin-inline:0}#top .dress-palette-hint{display:none}#top .dress-chapter .dress-palette{margin-bottom:28px}#top .dress-palette .palette-family::after{content:"Можно использовать близкие оттенки";max-width:280px;color:#77765e;font-size:12px;line-height:1.7;font-style:italic}');
 // Isolated captures of unchanged sections retain the previous OFFSCREEN
 // lookbook spacing. Public/full-page and Dress Code captures use real spacing.
 if(target!==page&&!isDressTarget)fixtures.push(`@media(max-width:700px){#top .dress-chapter{padding-top:65px;padding-bottom:65px}#top .dress-chapter .chapter-heading{margin-bottom:45px}#top .dress-help{margin-bottom:36px}#top .dress-chapter>.page-switch{margin-bottom:35px}#top .dress-chapter>.dress-section-switch{margin-top:-15px;margin-bottom:40px}#top .dress-chapter .palette-intro{margin-bottom:26px}#top .dress-chapter .palette-family-title{min-height:2.5em}#top .dress-palette .palette-family>small:not(.palette-family-hint){min-height:3.4em}#top .dress-chapter .lookbook-guidance{min-height:600px;gap:24px;padding-top:32px;margin-bottom:48px}#top .dress-chapter .lookbook{margin-bottom:72px}#top .dress-chapter .lookbook>h3{margin-bottom:28px}#top .dress-chapter .lookbook-frame{grid-template-rows:auto minmax(360px,auto)}#top .dress-chapter .lookbook-description{min-height:360px;padding:26px 0 0}#top .dress-chapter .lookbook-description .chapter-kicker{margin-bottom:25px}#top .dress-chapter .lookbook-description h4{margin:10px 0 16px}#top .dress-chapter .dress-gallery-controls{position:static;transform:none;margin:12px auto 0;gap:25px;padding:0;width:auto;max-width:none;border:0;background:none;box-shadow:none;backdrop-filter:none}#top .dress-chapter .gallery-counter{min-width:0;font-size:11px}#top #dress-avoid{padding-top:46px}}`);
 // Flatten only the OFFSCREEN family album back to its reference geometry.
 // Guest snapshots/full-page tests always exercise the actual two-side layout.
 if(target!==page&&section!=='guests'){
  const positions=Array.from({length:15},(_,i)=>`#top .family-spread [data-guest-id="family-${i}"]{order:${i};margin-top:${i%4===1?35:i%4===3?55:0}px}#top .family-spread [data-guest-id="family-${i}"] .guest-photo{aspect-ratio:${isolateAlbum&&i%2?'1/1':'4/5'}}`).join('');
  const mobilePositions=Array.from({length:15},(_,i)=>`#top .family-spread [data-guest-id="family-${i}"]{margin-top:${i%2?25:0}px}`).join('');
  fixtures.push(`#top .family-switch{display:none}#top .family-spread{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:40px 38px;max-width:1240px;margin:0 auto}#top .family-spread .family-side,#top .family-spread .guest-album{display:contents;grid-area:auto;visibility:visible;opacity:1;transform:none;transition:none}#top .family-side-title,#top .family-anchor-card{display:none}${positions}@media(max-width:1000px){#top .family-spread{column-gap:24px}}@media(max-width:700px){#top .family-spread{grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 18px}${mobilePositions}}`);
 }
 if(target!==page&&section!=='date')fixtures.push(`#top .wedding-date-section .date-large{display:block;width:auto;max-width:none;padding:0;margin:0;position:static;order:initial;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:400;font-size:clamp(44px,5.5vw,90px);line-height:1.2;letter-spacing:-.045em;flex-shrink:1}@media(max-width:700px){#top .wedding-date-section .date-large{display:none}#top .wedding-date-section .wedding-calendar{order:1}#top .wedding-date-section .date-start{order:2}}`);
 if(target!==page&&section!=='schedule')fixtures.push('#top .schedule-spread li>div>p{display:none}');
 if(target!==page&&section!=='questions')fixtures.push('#question-speeches{height:88px;min-height:88px;max-height:88px}@media(max-width:600px){#question-speeches{height:78px;min-height:78px;max-height:78px}}');
 if(target!==page&&section!=='questions')fixtures.push('.question-item:has(#question-transfer-to),.question-item:has(#question-transfer-back){display:none}');
 // Preserve unchanged offscreen lookbook geometry when isolating other chapters.
 if(target!==page&&!isDressTarget)fixtures.push(`#top .dress-original-tabs>.page-switch{margin-bottom:42px}#top .dress-original-tabs>.dress-section-switch{margin-top:-15px;margin-bottom:40px}#top .dress-chapter .lookbook-photo{width:100%;padding:9px;justify-self:stretch;align-self:stretch}#top .dress-chapter .lookbook-open{aspect-ratio:auto}#top .dress-chapter .lookbook-photo img{height:570px;aspect-ratio:auto}#top .dress-chapter .lookbook-frame{min-height:590px;gap:64px;align-items:center}#top .dress-chapter .lookbook-description{padding:24px 0}@media(max-width:700px){#top .dress-original-tabs>.page-switch{margin-bottom:35px}#top .dress-chapter .lookbook-frame{min-height:0;gap:0;align-items:start}#top .dress-chapter .lookbook-photo img{height:auto;aspect-ratio:4/5}#top .dress-chapter .lookbook-description{padding:26px 0 0}}`);
 const fixture=fixtures.length?await page.addStyleTag({content:fixtures.join('\n')}):null;
 const isolateIntro=section==='rsvp'&&target!==page&&await (target as Locator).evaluate(el=>!el.matches('section,header'));
 const oldIntroHeight=isolateIntro?await page.locator('#rsvp>header p').evaluateAll(elements=>{const el=elements[0] as HTMLElement|undefined;if(!el)return null;const old=el.style.height,clone=el.cloneNode(false) as HTMLElement;clone.textContent='Оставь нам пару слов. Мы очень хотим увидеть тебя за нашим столом.';Object.assign(clone.style,{position:'absolute',visibility:'hidden',width:el.getBoundingClientRect().width+'px',height:'auto'});el.parentNode!.appendChild(clone);el.style.height=clone.getBoundingClientRect().height+'px';clone.remove();return old;}):null;
 // Component snapshots below Guests must not depend on the offscreen album's
 // height/pixel phase. Keep its former geometry ONLY during these isolated
 // captures. Full-page and Guests snapshots always exercise the actual layout.
 const isolation=isolateAlbum?await page.addStyleTag({content:'.guest-print--approved.guest-print--1 .guest-photo,.guest-print--approved.guest-print--3 .guest-photo{aspect-ratio:1/1}'}):null;
 // A full invitation exceeds 20 megapixels on desktop. Allow both stable
 // captures to finish, including late font/layout settling; pixel tolerances
 // stay identical to the isolated section snapshots.
 try{await expect.soft(target).toHaveScreenshot(name,{...(target===page?{fullPage:true,timeout:30000}:{})});}
 finally{await isolation?.evaluate(el=>el.parentNode?.removeChild(el));await fixture?.evaluate(el=>el.parentNode?.removeChild(el));if(isolateIntro&&oldIntroHeight!==null)await page.locator('#rsvp>header p').evaluateAll((elements,old)=>{if(elements[0])(elements[0] as HTMLElement).style.height=old;},oldIntroHeight);await ready(page);if(target!==page){await page.evaluate(pos=>window.scrollTo({...pos,behavior:'instant'}),originalScroll);await ready(page);}}
}
async function scrollWholePage(page:Page){
 await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=500){window.scrollTo({top:y,behavior:"instant"});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}window.scrollTo({top:0,behavior:"instant"});});
 await page.evaluate(async()=>{for(const img of document.images)img.loading='eager';await Promise.all([...document.images].filter(img=>img.getBoundingClientRect().height>0).map(img=>img.decode().catch(()=>{})));});
}
async function going(page:Page,name='Сергей Иванов 😀'){
 await page.locator('input[name=guestName]').fill(name);
 await page.getByRole('button',{name:'Приду',exact:true}).click();
 await page.locator('input[name=who]').fill('Друг семьи');
 await page.locator('input[name=partyInterest][value=yes]').check();
 await page.locator('input[name=congratulationChoice][value=public]').check();
 await page.locator('input[name=hotAppetizer][value=hot_meat]').check();await page.locator('input[name=mainCourse][value=main_fish]').check();
 await page.locator('input[name=alcoholDrinks][value=none]').check();
 await page.locator('input[name=softDrinks][value=cola]').check();
 await page.locator('input[name=transfer][value="kupchino"]').check();
 await page.locator('input[name=returnTransfer][value=not_needed]').check();await page.locator('input[name=dressCode]').check();await page.locator('input[name=venueRules]').check();
}

test.beforeEach(async({page,request},testInfo)=>{
 if(!/paper airplane|venue automatic/.test(testInfo.title))await page.clock.setFixedTime(new Date('2026-10-29T09:00:00Z'));
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
 await expect(triggers).toHaveCount(11);
 for(const trigger of await triggers.all())await expect(trigger).toHaveAttribute('aria-expanded','false');
 for(const trigger of await triggers.all()){await trigger.click();await expect(trigger).toHaveAttribute('aria-expanded','true');await expect(page.locator('.question-trigger[aria-expanded=true]')).toHaveCount(1);}
 await image(page,page.locator('#questions'),'faq-expanded.png');
 await triggers.first().press('Space');await expect(triggers.first()).toHaveAttribute('aria-expanded','true');await expect(triggers.last()).toHaveAttribute('aria-expanded','false');
 await triggers.first().press('Space');await expect(triggers.first()).toHaveAttribute('aria-expanded','false');await expect(page.locator('.question-trigger[aria-expanded=true]')).toHaveCount(0);
 await triggers.first().press('Enter');await expect(triggers.first()).toHaveAttribute('aria-expanded','true');
 await triggers.first().click();await triggers.first().click();await triggers.first().click();await expect(triggers.first()).toHaveAttribute('aria-expanded','false');
 await overflow(page);
});

for(const width of [375,1440])test('FAQ transfer order, link and smooth single-active switching '+width,async({page},testInfo)=>{
 await page.setViewportSize({width,height:width===375?812:900});await publicPage(page);
 const faq=page.locator('#questions'),speech=page.locator('#question-speeches'),to=page.locator('#question-transfer-to'),back=page.locator('#question-transfer-back');
 await expect(faq.locator('.question-trigger')).toHaveText(['Дарить ли цветы?+','А что дарить?+','Поздравления и поздравительные речи+','Как добраться до места+','Как добраться обратно+','Можно ли приехать на своей машине?+','Можно ли оставить машину и уехать на трансфере?+','Что делать, если я опаздываю?+','Что делать, если планы изменились после заполнения анкеты?+','Правила площадки+','Я ничего не понял/а, у меня остались вопросы+']);
 await to.click();await expect(to).toHaveAttribute('aria-expanded','true');await expect(page.locator('#answer-transfer-to .question-answer')).toHaveCount(3);await expect(page.locator('#answer-transfer-to')).toContainText('то есть до 17.06.2027.');await image(page,page.locator('#answer-transfer-to'),'faq-transfer-to-'+width+'.png');
 await back.click();await expect(to).toHaveAttribute('aria-expanded','false');await expect(back).toHaveAttribute('aria-expanded','true');
 const link=page.locator('#answer-transfer-back').getByRole('link',{name:'Максиму',exact:true});await expect(link).toHaveAttribute('href','https://t.me/sfokin1337');expect(await link.getAttribute('href')).toBe(await page.locator('#answer-contacts a').last().getAttribute('href'));await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('rel','noopener noreferrer');await back.focus();await page.keyboard.press('Tab');await expect(link).toBeFocused();expect(await link.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');await image(page,page.locator('#answer-transfer-back'),'faq-transfer-back-'+width+'.png');
 await page.emulateMedia({reducedMotion:'no-preference'});await speech.click();await expect(speech).toHaveAttribute('aria-expanded','true');await page.waitForTimeout(500);
 await to.scrollIntoViewIfNeeded();await ready(page);const rect=(await to.boundingBox())!;
 await page.evaluate(()=>{const samples:{y:number;open:number;height:number;scroll?:number;time?:number;guard?:string;panel?:number}[]=[];const started=performance.now();(window as unknown as {faqSamples:typeof samples}).faqSamples=samples;function sample(){const trigger=document.querySelector('#question-transfer-to')!,panels=[...document.querySelectorAll('.question-panel')];samples.push({y:trigger.getBoundingClientRect().top,scroll:scrollY,time:performance.now(),guard:document.documentElement.dataset.faqReadingAnchor,panel:document.querySelector('#answer-speeches')!.getBoundingClientRect().height,open:panels.filter(el=>el.getAttribute('data-open')==='true').length,height:panels.filter(el=>Number(getComputedStyle(el).opacity)>.05&&el.getBoundingClientRect().height>4).length});if(performance.now()-started<1100)requestAnimationFrame(()=>setTimeout(sample,0));}sample();});
 await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);await expect(to).toHaveAttribute('aria-expanded','true');await page.waitForTimeout(550);await expect(to).toBeFocused();await expect(speech).toHaveAttribute('aria-expanded','false');
 // Sample after animation-frame callbacks, matching painted positions after layout anchoring.
 const samples=await page.evaluate(()=>(window as unknown as {faqSamples:{y:number;open:number;height:number;scroll?:number;time?:number;guard?:string;panel?:number}[]}).faqSamples);
 fs.writeFileSync(testInfo.outputPath('faq-motion.json'),JSON.stringify(samples));await expect(to).toBeInViewport();
 expect(Math.max(...samples.map(x=>x.open))).toBeLessThanOrEqual(1);expect(Math.max(...samples.map(x=>x.height))).toBeLessThanOrEqual(1);
 expect(Math.max(...samples.map((x,i)=>i?Math.abs(x.y-samples[i-1].y):0)),'No abrupt movement of the focused trigger').toBeLessThan(50);await expect(to).toBeInViewport();
 await to.press('Enter');await expect(to).toHaveAttribute('aria-expanded','false');await expect(faq.locator('[aria-expanded=true]')).toHaveCount(0);await expect(to).toBeFocused();await overflow(page);
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
 await image(page,page.locator('#rsvp'),'rsvp-going.png');await image(page,page.locator('.rsvp-food-block'),'rsvp-food-block.png');
 await page.getByRole('button',{name:'Не приду',exact:true}).click();await expect(page.locator('.rsvp-details')).toHaveCount(0);await expect(submit).toBeEnabled();
 await image(page,page.locator('#rsvp'),'rsvp-not-going.png');
 const sent=page.waitForRequest(req=>req.url().endsWith('/api/rsvp')&&req.method()==='POST');await submit.click();
 expect(Object.keys((await sent).postDataJSON()).sort()).toEqual(['attendance','guestName','submissionKey']);
 await expect(page.locator('#rsvp-success-title')).toHaveText('Спасибо, мы всё сохранили!');await expect(page.locator('#rsvp form')).toHaveCount(0);await expect(page.locator('#rsvp-title')).toHaveCount(0);
 await image(page,page.locator('#rsvp'),'rsvp-success-first.png');
 await page.getByRole('button',{name:'Добавить ещё гостя',exact:true}).click();
 for(const field of await page.locator('#rsvp input:not([type]),#rsvp textarea').all())await expect(field).toHaveValue('');
 await expect(page.getByRole('button',{name:'Приду',exact:true})).toHaveAttribute('aria-pressed','false');await expect(page.locator('#rsvp input:checked')).toHaveCount(0);await expect(submit).toBeDisabled();
 await going(page,'Ж'.repeat(78)+' Я');await food.fill('А'.repeat(300));await music.fill('М'.repeat(300));await submit.click();
 await expect(page.locator('.saved-guest')).toHaveCount(2);await expect(page.getByRole('button',{name:'Добавить ещё гостя',exact:true})).toBeVisible();await expect(page.locator('#rsvp form')).toHaveCount(0);
 await image(page,page.locator('#rsvp'),'rsvp-success-second.png');
 for(let i=3;i<=5;i++){await page.getByRole('button',{name:'Добавить ещё гостя',exact:true}).click();await expect(page.locator('input[name=guestName]')).toHaveValue('');await page.locator('input[name=guestName]').fill('Гость Номер'+i);await page.getByRole('button',{name:'Не приду',exact:true}).click();await submit.click();await expect(page.locator('.rsvp-confirmation')).toContainText('Гость Номер'+i);}
 await page.reload();await expect(page.locator('.rsvp-confirmation')).toContainText('5 ответов');await expect(page.locator('.saved-guest')).toHaveCount(5);await image(page,page.locator('#rsvp'),'rsvp-session-multiple.png');expect(submissions.length).toBe(5);expect(new Set(submissions.map(s=>s.submissionKey)).size).toBe(5);expect(submissions.every(s=>!('overnight' in s))).toBeTruthy();expect(submissions.filter(s=>s.attendance==='no').every(s=>!('hotAppetizer' in s)&&!('mainCourse' in s))).toBeTruthy();await overflow(page);
});

test('Telegram navigation, analytics, filtering, copy and long detail on mobile',async({page})=>{
 test.setTimeout(120000);
 await page.goto('/telegram');await expect(page.locator('.organizer-kpis')).toBeVisible();await image(page,page,'telegram-summary.png');
 const nav=page.getByRole('navigation',{name:'Основная навигация'});await expect(nav.getByRole('button')).toHaveCount(5);
 await nav.getByRole('button',{name:'Гости',exact:true}).click();await expect(page.locator('.organizer-guest')).toHaveCount(1);await image(page,page,'telegram-list.png');
 await page.getByRole('button',{name:'Фильтры',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await image(page,page,'telegram-filters.png');
 await page.getByRole('dialog').getByLabel('Трансфер',{exact:true}).selectOption('pavlovsk');await page.getByRole('button',{name:'Применить',exact:true}).click();await expect(page.locator('.organizer-guest')).toHaveCount(0);
 await page.getByRole('button',{name:'Убрать фильтр: Павловск'}).click();await expect(page.locator('.organizer-guest')).toHaveCount(1);
 await page.getByLabel('Поиск по имени',{exact:true}).fill('Неизвестный');await expect(page.locator('.organizer-guest')).toHaveCount(0);await page.getByLabel('Поиск по имени',{exact:true}).fill('');await expect(page.locator('.organizer-guest')).toHaveCount(1);
 await page.locator('.organizer-guest').click();await expect(page.locator('.admin-detail')).toContainText('Безалкогольное');await image(page,page,'telegram-detail-long.png');
 await page.getByRole('button',{name:'Назад',exact:true}).click();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async(text:string)=>{(window as unknown as {copied:string}).copied=text;}}}));
 for(const [screen,file] of [['Трансфер','telegram-transfer.png'],['Музыка','telegram-music.png'],['Банкет','telegram-more.png']]){await nav.getByRole('button',{name:screen,exact:true}).click();await image(page,page,file);}
 await nav.getByRole('button',{name:'Музыка',exact:true}).click();await page.getByRole('button',{name:'Скопировать всё',exact:true}).click();expect(await page.evaluate(()=>(window as unknown as {copied:string}).copied)).toContain('М'.repeat(300));
 await nav.getByRole('button',{name:'Трансфер',exact:true}).click();await page.getByRole('button',{name:'Скопировать список',exact:true}).click();expect(await page.evaluate(()=>(window as unknown as {copied:string}).copied)).toContain('Купчино — 1 гость');
 for(const width of [320,375,390,430]){await page.setViewportSize({width,height:932});for(const label of ['Сводка','Гости','Трансфер','Музыка','Банкет']){await nav.getByRole('button',{name:label,exact:true}).click();await overflow(page);const last=page.locator('.organizer-group').last();if(await last.count())expect(await last.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBeTruthy();}await nav.getByRole('button',{name:'Гости',exact:true}).click();await page.locator('.organizer-guest').click();await overflow(page);await expect(page.locator('.admin-detail')).toBeVisible();await page.getByRole('button',{name:'Назад',exact:true}).click();if(width===320){await nav.getByRole('button',{name:'Сводка',exact:true}).click();await image(page,page,'telegram-summary-320.png');}}
});

test('Telegram operational screens with representative synthetic guests',async({page,request})=>{
 const seeded=await request.post('/qa/admin-fixtures');expect(seeded.ok()).toBeTruthy();await page.goto('/telegram');await expect(page.locator('.organizer-kpis')).toBeVisible();
 const nav=page.getByRole('navigation',{name:'Основная навигация'});
 for(const [label,file] of [['Сводка','telegram-review-summary.png'],['Гости','telegram-review-guests.png'],['Трансфер','telegram-review-transfer.png'],['Музыка','telegram-review-music.png'],['Банкет','telegram-review-more.png']]){await nav.getByRole('button',{name:label,exact:true}).click();await ready(page);await expect.soft(page).toHaveScreenshot(file,{fullPage:true});await overflow(page);}
 await nav.getByRole('button',{name:'Гости',exact:true}).click();await page.locator('.organizer-guest').filter({hasText:'Сергей Иванов'}).click();await image(page,page,'telegram-review-detail.png');
 await page.getByRole('button',{name:'Назад',exact:true}).click();await nav.getByRole('button',{name:'Банкет',exact:true}).click();
 await page.getByRole('button',{name:/Мясная горячая закуска/}).click();await expect(page.locator('.organizer-heading')).toContainText('Мясная горячая закуска');await expect(page.locator('.organizer-transfer-name')).toHaveCount(2);await image(page,page,'telegram-food-drill.png');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async(text:string)=>{(window as unknown as {copied:string}).copied=text;}}}));await page.getByRole('button',{name:'Скопировать список',exact:true}).click();expect(await page.evaluate(()=>(window as unknown as {copied:string}).copied)).toContain('Мясная горячая закуска — 2 гостя');await page.locator('.organizer-transfer-name').filter({hasText:'Сергей Иванов'}).click();await expect(page.locator('.admin-detail h3')).toContainText(['Основное','Поздравление','Трансфер','Напитки','Еда','Музыка']);await page.getByRole('button',{name:'Назад',exact:true}).click();
 await page.getByRole('button',{name:'К банкету',exact:true}).click();await page.getByRole('button',{name:/Вино красное/}).click();await expect(page.locator('.organizer-transfer-name')).toHaveCount(1);await image(page,page,'telegram-drink-drill.png');await page.getByRole('button',{name:'Скопировать список',exact:true}).click();expect(await page.evaluate(()=>(window as unknown as {copied:string}).copied)).toContain('Вино красное — 1 гость');
 await page.setViewportSize({width:320,height:812});await overflow(page);await page.getByRole('button',{name:'К банкету',exact:true}).click();await image(page,page,'telegram-banquet-320.png');
});

test('Telegram delete refreshes overview and operational sections',async({page})=>{
 await page.goto('/telegram');await expect(page.locator('.organizer-kpis')).toBeVisible();const nav=page.getByRole('navigation',{name:'Основная навигация'});
 await nav.getByRole('button',{name:'Гости',exact:true}).click();await page.locator('.organizer-guest').click();await page.getByRole('button',{name:'Удалить ответ',exact:true}).click();await page.getByRole('button',{name:'Подтвердить удаление',exact:true}).click();await expect(page.locator('.admin-detail')).toHaveCount(0);await expect(page.locator('.organizer-empty')).toContainText('Нет ответов');
 for(const [label,text] of [['Сводка','Нет ответов'],['Трансфер','Никому пока не нужен трансфер'],['Музыка','Музыкальных пожеланий пока нет'],['Банкет','Нет ответов']]){await nav.getByRole('button',{name:label,exact:true}).click();await expect(page.locator('.organizer-empty')).toContainText(text);}
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
 await expect(page.locator('#dress-allowed .gallery-counter')).toHaveText('03 / 06');
 await page.locator('.dress-original-tabs').getByRole('button',{name:'Для мужчин',exact:true}).click();await expect(page.locator('#dress-allowed .lookbook-incoming img')).toHaveAttribute('src',/men-clothes-milk/);
 await expect(page.locator('#dress-allowed .gallery-counter')).toHaveText('01 / 04');
 await page.locator('.dress-original-tabs').getByRole('button',{name:'Для девушек',exact:true}).click();await expect(page.locator('#dress-allowed .lookbook-incoming img')).toHaveAttribute('src',/dress-lookbook-v[56]\//);
 await stage.focus();await stage.press('ArrowRight');await expect(page.locator('#dress-allowed .gallery-counter')).toHaveText('02 / 06');
 await stage.evaluate(el=>el.scrollIntoView({block:"start",behavior:"instant"}));const rect=await stage.boundingBox();if(!rect)throw new Error('Lookbook missing');await page.mouse.move(rect.x+250,rect.y+120);await page.mouse.down();await page.mouse.move(rect.x+80,rect.y+125,{steps:5});await page.mouse.up();
 await expect(page.locator('#dress-allowed .gallery-counter')).toHaveText('03 / 06');
 await stage.evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));const touch=await page.context().newCDPSession(page);const box=await stage.boundingBox();if(!box)throw new Error('Lookbook missing');const y=box.y+120;await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:275,y}]});for(const x of [230,185,140,95,70]){await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await page.waitForTimeout(20);}await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(page.locator('#dress-allowed .gallery-counter')).toHaveText('04 / 06');
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
    expect(await page.locator('.portrait-hero-photo').evaluate(el=>getComputedStyle(el).animationName)).toBe('scene-hero-photo');
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
 await expect(page.locator('.question-item.motion-ready')).toHaveCount(11);
 await expect(page.locator('.question-item.motion-ready:not(.motion-visible)')).toHaveCount(0);
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
 await expect(page.locator('#venue')).not.toContainText('Спальных мест нет');
 const map=await page.getByRole('link',{name:'Показать на карте'}).getAttribute('href');expect(decodeURIComponent(map||'')).toContain('Пушкинская Усадьба');expect(decodeURIComponent(map||'')).toContain('Фёдоровское');
 await expect(page.locator('.venue-current-photo')).toHaveAttribute('src',/pushkinskaya-02/);
 await expect(page.locator('#venue .gallery-counter')).toHaveCount(0);
 await page.locator('.venue-photo-open').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('.venue-current-photo')).toHaveAttribute('src',/pushkinskaya-01/);
 await expect(page.locator('.venue-current-photo')).toHaveAttribute('src',/pushkinskaya-01/);
 await image(page,page.locator('#venue'),'venue-pushkinskaya.png');
 await image(page,page.locator('#dress-code'),'dress-women.png');
 await image(page,page.locator('#dress-allowed'),'dress-allowed.png');
 await image(page,page.locator('#dress-avoid'),'dress-avoid.png');
 await page.locator('.dress-original-tabs').getByRole('button',{name:'Для мужчин',exact:true}).click();await expect(page.locator('#dress-allowed .gallery-counter')).toHaveText('01 / 04');
 await image(page,page.locator('#dress-code'),'dress-men.png');
 await page.getByRole('button',{name:'Лучше выбрать другой вариант: Следующий пример',exact:true}).click();await expect(page.locator('#dress-avoid .gallery-counter')).toHaveText('02 / 03');await overflow(page);
});


test('Dress Code colour families and complete lookbooks at narrow widths',async({page},testInfo)=>{
 test.setTimeout(120000);
 await publicPage(page);const chapter=page.locator('#dress-code');
 for(const width of [320,375,390,430,1440]){
  await page.setViewportSize({width,height:width===1440?900:932});
  for(const category of ['Для девушек','Для мужчин']){
   await page.locator('.dress-original-tabs').getByRole('button',{name:category,exact:true}).click();await chapter.scrollIntoViewIfNeeded();await ready(page);
   await expect(chapter.locator('.palette-family')).toHaveCount(2);await expect(chapter.locator('.palette-fan i')).toHaveCount(10);await expect(chapter.locator('.palette-intro')).toContainText('Не обязательно попадать оттенок в оттенок');
   await expect(chapter.locator('.dress-original-tabs .dress-section-switch button')).toHaveCount(2);
   const allowedCount=category==='Для девушек'?6:4,avoidCount=category==='Для девушек'?5:3;
   await expect(page.locator('#dress-allowed .gallery-counter')).toHaveText('01 / 0'+allowedCount);await expect(page.locator('#dress-avoid .gallery-counter')).toHaveText('01 / 0'+avoidCount);
   const heights:number[]=[];
   for(let i=0;i<allowedCount;i++){
    const img=page.locator('#dress-allowed .lookbook-incoming img');await img.scrollIntoViewIfNeeded();await expect(img).toBeVisible();await img.evaluate(async el=>{const image=el as HTMLImageElement;await image.decode();if(!image.naturalWidth)throw new Error('Missing generated photo');});
    await overflow(page);expect(await page.locator('#dress-allowed .lookbook-stage').evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBeTruthy();
    heights.push(await page.locator('#dress-allowed .lookbook-stage').evaluate(el=>el.getBoundingClientRect().height));
    if(i<allowedCount-1)await page.getByRole('button',{name:'Так можно: Следующий пример',exact:true}).click();
   }
   expect(Math.max(...heights)-Math.min(...heights),'Captions should not make the carousel jump').toBeLessThanOrEqual(2);
   await page.getByRole('button',{name:'Так можно: Следующий пример',exact:true}).click();await expect(page.locator('#dress-allowed .gallery-counter')).toHaveText('01 / 0'+allowedCount);
   for(let i=0;i<avoidCount;i++){await page.locator('#dress-avoid .lookbook-incoming img').scrollIntoViewIfNeeded();await page.locator('#dress-avoid .lookbook-incoming img').evaluate(async el=>(el as HTMLImageElement).decode());await overflow(page);await page.getByRole('button',{name:'Лучше выбрать другой вариант: Следующий пример',exact:true}).click();}
   await chapter.screenshot({path:testInfo.outputPath('dress-'+(category==='Для девушек'?'women':'men')+'-'+width+'.png'),animations:'disabled'});
   if(width===320||width===1440)await image(page,chapter,'dress-families-'+(category==='Для девушек'?'women':'men')+'-'+width+'.png');
  }
 }
});

test('four fashion pages keep separate palettes and complete accessory lookbooks',async({page})=>{
 test.setTimeout(180000);
 await publicPage(page);
 for(const width of [320,375,390,430,1440]){
  await page.setViewportSize({width,height:width===1440?900:932});
  for(const gender of ['Для девушек','Для мужчин']){
   await page.locator('.dress-original-tabs').getByRole('button',{name:gender,exact:true}).click();
   await expect(page.locator('.dress-original-tabs').getByRole('button',{name:'Одежда',exact:true})).toHaveAttribute('aria-pressed','true');
   const before=await page.locator('#dress-code').evaluate(el=>el.clientHeight);
   for(const part of ['Одежда','Аксессуары']){
    await page.locator('.dress-original-tabs').getByRole('button',{name:part,exact:true}).click();
    const womenClothes=gender==='Для девушек'&&part==='Одежда';
    await expect(page.locator('#dress-allowed .gallery-counter')).toHaveText(womenClothes?'01 / 06':'01 / 04');
    await expect(page.locator('#dress-avoid .gallery-counter')).toHaveText(womenClothes?'01 / 05':gender==='Для мужчин'&&part==='Аксессуары'?'01 / 04':'01 / 03');
    await expect(page.locator('#dress-code .palette-family')).toHaveCount(2);
    if(part==='Одежда')await expect(page.locator('#dress-code')).toContainText(gender==='Для девушек'?'Сливочное масло → золото':'Молочная гамма');
    for(const id of ['dress-allowed','dress-avoid']){
     for(let n=0;n<(id==='dress-allowed'?(womenClothes?6:4):(womenClothes?5:gender==='Для мужчин'&&part==='Аксессуары'?4:3));n++){
      const img=page.locator('#'+id+' .lookbook-incoming img');await img.scrollIntoViewIfNeeded();await img.evaluate(async el=>(el as HTMLImageElement).decode());
      await page.locator('#'+id+' .dress-gallery-controls button').last().click();
     }
    }
    await overflow(page);
    expect(Math.abs((await page.locator('#dress-code').evaluate(el=>el.clientHeight))-before),'Fashion page height stays stable').toBeLessThanOrEqual(4);
    if(width===375||width===1440){const name=(gender==='Для девушек'?'women':'men')+'-'+(part==='Одежда'?'clothes':'accessories')+'-'+width;await image(page,page.locator('#dress-code'),'fashion-'+name+'.png');}
   }
  }
 }
 await expect(page.getByRole('link',{name:'напишите Ане'})).toHaveAttribute('href','https://t.me/Selesssta');
});

test('venue fullscreen keyboard, swipe, focus and paused autoplay',async({page})=>{
 await publicPage(page);await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#venue').scrollIntoViewIfNeeded();
 const open=page.getByRole('button',{name:'Открыть фотографии площадки'});await open.click();const modal=page.getByRole('dialog');await expect(modal).toBeVisible();
 expect(await page.evaluate(()=>document.body.style.overflow)).toBe('hidden');
 await modal.press('d');await expect(modal.getByRole('status')).toHaveText('2 / 2');await modal.press('a');await expect(modal.getByRole('status')).toHaveText('1 / 2');
 await modal.press('ArrowRight');await expect(modal.getByRole('status')).toHaveText('2 / 2');await modal.press('ArrowLeft');await expect(modal.getByRole('status')).toHaveText('1 / 2');
 await page.waitForTimeout(5200);await expect(modal.getByRole('status')).toHaveText('1 / 2');
 await image(page,modal,'venue-fullscreen.png');await modal.press('Escape');await expect(modal).not.toBeVisible();await expect(open).toBeFocused();expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
 await page.setViewportSize({width:1440,height:900});await image(page,page.locator('#venue'),'venue-panorama-desktop.png');
 await page.setViewportSize({width:375,height:812});await open.click();const box=await page.locator('.venue-lightbox-photo').boundingBox();if(!box)throw Error('Photo missing');await page.mouse.move(300,box.y+150);await page.mouse.down();await page.mouse.move(70,box.y+150,{steps:5});await page.mouse.up();await expect(modal.getByRole('status')).toHaveText('2 / 2');const touch=await page.context().newCDPSession(page);await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:280,y:box.y+150}]});for(const x of [230,180,130,80])await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:box.y+150}]});await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(modal.getByRole('status')).toHaveText('1 / 2');await modal.press('d');await expect(modal.getByRole('status')).toHaveText('2 / 2');await modal.press('Escape');await image(page,page.locator('#venue'),'venue-panorama-mobile.png');
});

for(const key of ['Enter','Space'])test('intro scene keyboard '+key,async({page})=>{
 await page.goto('/');await page.locator('body').press(key);await expect(page.locator('.opening--letter')).toBeVisible();await page.locator('body').press(key);await expect(page.locator('.opening')).toHaveCount(0);await expect(page.locator('main')).toBeFocused();
});

test('RSVP separate agreements are submitted and draft restores',async({page,context})=>{
 await publicPage(page);await going(page);await page.locator('textarea[name=musicRequest]').fill('Трек для друзей');
 const venue=page.locator('input[name=venueRules]'),submit=page.getByRole('button',{name:'Подтвердить участие',exact:true});await venue.uncheck();await expect(submit).toBeDisabled();
 await page.locator('.paper-checkbox a[href="#dress-code"]').click();await expect(page.locator('input[name=guestName]')).toHaveValue('Сергей Иванов 😀');
 const [rules]=await Promise.all([context.waitForEvent('page'),page.getByRole('link',{name:'правила площадки',exact:true}).click()]);await rules.waitForLoadState();await expect(rules.locator('h1')).toHaveText('Правила площадки');await rules.close();
 await page.reload();await expect(page.locator('input[name=guestName]')).toHaveValue('Сергей Иванов 😀');await expect(page.locator('textarea[name=musicRequest]')).toHaveValue('Трек для друзей');await expect(venue).not.toBeChecked();
 await venue.check();await expect(submit).toBeEnabled();await image(page,page.locator('.rsvp-details'),'rsvp-agreements.png');
 const request=page.waitForRequest(req=>req.method()==='POST'&&req.url().endsWith('/api/rsvp'));await submit.click();const submitted=(await request).postDataJSON();expect(submitted).not.toHaveProperty('venueRules');expect(submitted.venueRulesAccepted).toBe(true);expect(submitted.dressCodeConfirmed).toBe(true);await expect(page.locator('.rsvp-confirmation')).toBeVisible();expect(await page.evaluate(()=>sessionStorage.getItem('anya-maxim-rsvp-draft-v2'))).toBeNull();
 await page.getByRole('button',{name:'Добавить ещё гостя',exact:true}).click();await expect(page.locator('input[name=guestName]')).toHaveValue('');await page.locator('input[name=guestName]').fill('Второй Гость');await page.reload();await expect(page.locator('input[name=guestName]')).toHaveValue('Второй Гость');
});

test('guest venue rules mobile and desktop',async({page})=>{
 await page.goto('/venue-rules');await expect(page.locator('ol>li')).toHaveCount(8);await expect(page.locator('main')).not.toContainText('50 000');
 for(const href of ['https://t.me/Selesssta','https://t.me/sfokin1337']){await expect(page.locator('a[href="'+href+'"]').first()).toHaveAttribute('target','_blank');await expect(page.locator('a[href="'+href+'"]').first()).toHaveAttribute('rel','noopener noreferrer');}
 for(const width of [375,1440]){await page.setViewportSize({width,height:900});await image(page,page,'venue-rules-'+width+'.png');}
});

test('venue automatic slideshow and ten second manual pause',async({page})=>{
 await page.clock.install();await page.emulateMedia({reducedMotion:'no-preference'});
 await page.addInitScript(()=>{const Native=window.IntersectionObserver,w=window as unknown as {repeatVenue:()=>void;venueSeenAt:number};window.IntersectionObserver=class extends Native{constructor(callback:IntersectionObserverCallback,options?:IntersectionObserverInit){super((entries,observer)=>{if(entries.some(e=>e.target.classList.contains('venue-gallery')&&e.isIntersecting)){w.venueSeenAt=Date.now();w.repeatVenue=()=>callback(entries,observer);}callback(entries,observer);},options);}};});
 await publicPage(page);const counter=page.locator('.venue-current-photo');await page.clock.runFor(30000);await expect(counter).toHaveAttribute('src',/pushkinskaya-02/);
 await page.locator('#venue').scrollIntoViewIfNeeded();await expect(page.locator('#venue')).toHaveClass(/motion-visible/);await page.clock.runFor(1000);await expect.poll(()=>page.evaluate(()=>Boolean((window as unknown as {venueSeenAt:number}).venueSeenAt))).toBe(true);
 const firstSeen=await page.evaluate(()=>(window as unknown as {venueSeenAt:number}).venueSeenAt);
 await page.clock.runFor(6000);await page.evaluate(()=>{const w=window as unknown as {repeatVenue:()=>void};w.repeatVenue();w.repeatVenue();});const elapsed=await page.evaluate(()=>Date.now())-firstSeen;await page.clock.runFor(Math.max(0,9900-elapsed));await expect(counter).toHaveAttribute('src',/pushkinskaya-02/);await page.clock.runFor(200);await expect(counter).toHaveAttribute('src',/pushkinskaya-01/);
 await page.clock.runFor(5000);await expect(counter).toHaveAttribute('src',/pushkinskaya-02/);
 await page.locator('.venue-photo-open').focus();await page.keyboard.press('ArrowRight');await expect(counter).toHaveAttribute('src',/pushkinskaya-01/);await page.clock.runFor(9900);await expect(counter).toHaveAttribute('src',/pushkinskaya-01/);await page.clock.runFor(200);await expect(counter).toHaveAttribute('src',/pushkinskaya-02/);
 await page.getByRole('button',{name:'Открыть фотографии площадки',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.clock.runFor(20000);await expect(counter).toHaveAttribute('src',/pushkinskaya-02/);await page.getByRole('button',{name:'Закрыть галерею',exact:true}).click();await page.clock.runFor(5100);await expect(counter).toHaveAttribute('src',/pushkinskaya-01/);
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await ready(page);await page.locator('#venue').scrollIntoViewIfNeeded();await page.clock.runFor(30000);await expect(counter).toHaveAttribute('src',/pushkinskaya-02/);
});

test('women clothing varied silhouettes and warm colour boundaries',async({page},testInfo)=>{
 test.setTimeout(120000);await publicPage(page);
 for(const width of [375,430,1440]){
  await page.setViewportSize({width,height:width===1440?900:width===430?932:812});
  await page.locator('.dress-original-tabs').getByRole('button',{name:'Для мужчин',exact:true}).click();await page.locator('.dress-original-tabs').getByRole('button',{name:'Для девушек',exact:true}).click();
  await expect(page.locator('.dress-original-tabs').getByRole('button',{name:'Одежда',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.palette-family')).toHaveCount(2);await expect(page.locator('#dress-code')).toContainText('Фасон почти свободный');
  for(const [id,count,label] of [['dress-allowed',6,'approved'],['dress-avoid',5,'anti']] as const){
   const stage=page.locator('#'+id+' .lookbook-stage'),counter=page.locator('#'+id+' .gallery-counter');const heights:number[]=[];
   for(let i=0;i<count;i++){
    await expect(counter).toHaveText(String(i+1).padStart(2,'0')+' / '+String(count).padStart(2,'0'));
    const img=stage.locator('.lookbook-incoming img');await img.scrollIntoViewIfNeeded();await img.evaluate(async el=>(el as HTMLImageElement).decode());await overflow(page);
    expect(await stage.evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBeTruthy();heights.push(await stage.evaluate(el=>el.clientHeight));
    await stage.screenshot({path:testInfo.outputPath('women-clothing-v3-'+label+'-'+(i+1)+'-'+width+'.png'),animations:'disabled'});
    if(i===0)await image(page,stage,'women-clothing-v3-'+label+'-'+width+'.png');
    await page.locator('#'+id+' .dress-gallery-controls button').last().click();
   }
   expect(Math.max(...heights)-Math.min(...heights)).toBeLessThanOrEqual(2);await expect(counter).toHaveText('01 / '+String(count).padStart(2,'0'));
   await stage.focus();await stage.press('ArrowLeft');await expect(counter).toHaveText(String(count).padStart(2,'0')+' / '+String(count).padStart(2,'0'));await stage.press('ArrowRight');await expect(counter).toHaveText('01 / '+String(count).padStart(2,'0'));
   await stage.scrollIntoViewIfNeeded();const rect=await stage.boundingBox();if(!rect)throw Error('Missing women lookbook');const x=rect.x+Math.min(rect.width-20,250),y=rect.y+100;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-150,y+4,{steps:5});await page.mouse.up();await expect(counter).toHaveText('02 / '+String(count).padStart(2,'0'));await stage.focus();await stage.press('ArrowLeft');
  }
 }
});

test('October content, local fonts, guests and five-event program across widths',async({page},testInfo)=>{
 test.setTimeout(120000);await publicPage(page);
 const expectedFamily=['Ольга','Владислав','Лидия Васильевна','Сергей Иванович','Галина Николаевна','Олег','Наталья','Екатерина','Дарья','Вячеслав','Анатолий','Ангелина','Надежда Константиновна','Галина Ивановна','Мария'];
 const expectedFriends=['Виктория','Александр','Сергей','Карина','Александра','Илья','Андрей','Асель','Ирина','Даниил','Денис','Анастасия','Денис'];
 for(const width of [320,375,390,430,768,1000,1024,1440]){
  await page.setViewportSize({width,height:width===1440?900:932});
  expect(await page.locator('.portrait-ampersand').evaluate(el=>getComputedStyle(el).fontFamily)).toContain('Royal Kaynin');
  expect(await page.locator('.date-large').evaluate(el=>getComputedStyle(el).fontFamily)).toContain('Bad Script');await expect(page.locator('.date-start')).toContainText('15:00');
  await expect(page.locator('#venue .gallery-counter')).toHaveCount(0);await expect(page.locator('.venue-arrival,.venue-enlarge,.venue-gallery-controls')).toHaveCount(0);await expect(page.locator('#venue')).not.toContainText('Есть парковка');
  await page.getByRole('button',{name:/Родные/}).click();await expect(page.locator('.guest-album .guest-print h3')).toHaveText(expectedFamily);await expect(page.locator('.guest-album .guest-print p').first()).toHaveText('Мама жениха');await expect(page.locator('.guest-note')).toHaveCount(0);expect(await page.locator('.guest-name-long').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBeTruthy();
  if(width===375||width===1440)await image(page,page.locator('#guests'),'guests-relatives-'+width+'.png');
  await page.getByRole('button',{name:/Друзья/}).click();await expect(page.locator('.guest-print h3')).toHaveText(expectedFriends);if(width===375||width===1440)await image(page,page.locator('#guests'),'guests-friends-'+width+'.png');
  await page.getByRole('button',{name:/Родные/}).click();await expect(page.locator('.schedule-time')).toHaveText(['15:00','15:30','16:00','21:00','22:00']);await expect(page.locator('#schedule h3')).toHaveText(['Встречаемся на площадке','Церемония','Начало банкета','Дискотека','Расходимся']);
  const tail=await page.locator('.schedule-spread').evaluate(el=>{const last=el.lastElementChild as HTMLElement;const line=getComputedStyle(el,'::before'),marker=parseFloat(getComputedStyle(last,'::before').top);return{end:el.clientHeight-parseFloat(line.bottom),marker:last.offsetTop+marker};});expect(Math.abs(tail.end-tail.marker)).toBeLessThanOrEqual(2);
  for(const selector of ['.portrait-hero','#date','#venue','#schedule']){await page.locator(selector).scrollIntoViewIfNeeded();await overflow(page);if(width===375||width===1440)await image(page,page.locator(selector),'october-'+selector.replace(/[.#]/g,'')+'-'+width+'.png');else await page.locator(selector).screenshot({path:testInfo.outputPath('october-'+selector.replace(/[.#]/g,'')+'-'+width+'.png'),animations:'disabled'});}
  await page.locator('#question-venue-rules').click();await expect(page.getByRole('link',{name:'Ознакомиться с правилами'})).toHaveAttribute('href','/venue-rules');await expect(page.getByRole('link',{name:'Ознакомиться с правилами'})).toHaveAttribute('target','_blank');await page.locator('#question-venue-rules').click();await overflow(page);
 }
 const calendar=await page.request.get('/calendar.ics');expect(await calendar.text()).toContain('DTSTART:20270717T120000Z');
});

test('Motya keyboard, successful play cap, overlap, session restore and five second toast',async({page})=>{
 // Exercise the real recorded-audio adapter with controlled playback timing.
 await page.addInitScript(()=>{
  const state={starts:0,fail:false};(window as unknown as {motyaAudio:typeof state}).motyaAudio=state;
  class AudioFixture{
   onended:null|(()=>void)=null;pause(){}removeAttribute(){}load(){}
   play(){if(state.fail)return Promise.reject(Error('blocked'));state.starts++;setTimeout(()=>this.onended?.(),900);return Promise.resolve();}
  }
  Object.defineProperty(window,'Audio',{value:AudioFixture});
 });
 await publicPage(page);await page.locator('#question-flowers').click();const motya=page.getByRole('button',{name:'кота Моти',exact:true});await image(page,page.locator('#answer-flowers'),'motya-faq-link.png');
 await page.evaluate(()=>{(window as unknown as {motyaAudio:{fail:boolean}}).motyaAudio.fail=true;});await motya.click();await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('anya-maxim-motya-meows-v1'))).toBeNull();
 await page.evaluate(()=>{(window as unknown as {motyaAudio:{fail:boolean}}).motyaAudio.fail=false;});await motya.focus();await motya.press('Enter');await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('anya-maxim-motya-meows-v1'))).toBe('1');await motya.click();expect(await page.evaluate(()=>(window as unknown as {motyaAudio:{starts:number}}).motyaAudio.starts)).toBe(1);
 await page.waitForTimeout(1000);await motya.press('Space');await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('anya-maxim-motya-meows-v1'))).toBe('2');await page.waitForTimeout(1000);await motya.click();await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('anya-maxim-motya-meows-v1'))).toBe('3');await page.waitForTimeout(1000);await motya.click();await expect(page.locator('.motya-toast')).toHaveText('Хватит мучать Мотю');expect(await page.evaluate(()=>(window as unknown as {motyaAudio:{starts:number}}).motyaAudio.starts)).toBe(3);
 await page.setViewportSize({width:320,height:812});await overflow(page);await image(page,page.locator('.motya-toast'),'motya-toast-320.png');await page.waitForTimeout(5300);await expect(page.locator('.motya-toast')).toHaveCount(0);
 await page.reload();await page.locator('#question-flowers').click();await page.getByRole('button',{name:'кота Моти',exact:true}).press('Enter');await expect(page.locator('.motya-toast')).toBeVisible();expect(await page.evaluate(()=>(window as unknown as {motyaAudio:{starts:number}}).motyaAudio.starts)).toBe(0);
});

test('approved local Motya recordings decode, are distinct and play without external requests',async({page})=>{
 await publicPage(page);
 const clips=await page.evaluate(async()=>{
  const context=new AudioContext();const results=[];
  try{for(let i=1;i<=3;i++){
   const url=`/audio/motya-meow-${i}.mp3`,response=await fetch(url);if(!response.ok)throw Error('Missing local recording');
   const bytes=await response.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes.slice(0));
   const decoded=await context.decodeAudioData(bytes);
   results.push({duration:decoded.duration,hash:Array.from(new Uint8Array(digest)).join(','),channels:decoded.numberOfChannels});
  }}finally{await context.close();}return results;
 });
 expect(new Set(clips.map(clip=>clip.hash)).size).toBe(3);
 for(const clip of clips){expect(clip.duration).toBeGreaterThanOrEqual(.3);expect(clip.duration).toBeLessThanOrEqual(1.6);expect(clip.channels).toBeGreaterThan(0);}
 await page.locator('#question-flowers').click();const button=page.getByRole('button',{name:'кота Моти',exact:true});
 const requests:string[]=[];page.on('request',request=>{if(request.resourceType()==='media')requests.push(request.url());});
 for(let i=1;i<=3;i++){await button.click();await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('anya-maxim-motya-meows-v1'))).toBe(String(i));await page.waitForTimeout(1700);}
 expect(requests.length).toBeGreaterThanOrEqual(3);expect(requests.every(url=>new URL(url).origin===new URL(page.url()).origin)).toBe(true);
 await button.click();await expect(page.locator('.motya-toast')).toBeVisible();
});

test('approved family portrait identity and consistent frames at all review widths',async({page})=>{
 await publicPage(page);
 const expected=[['family-13','ekaterina','Екатерина'],['family-3','vyacheslav','Вячеслав'],['family-2','darya','Дарья'],['family-7','galina-ivanovna','Галина Ивановна'],['family-10','angelina','Ангелина'],['family-0','olga','Ольга'],['family-1','vladislav','Владислав'],['family-6','galina-nikolaevna','Галина Николаевна'],['family-5','sergey-ivanovich','Сергей Иванович'],['family-12','natalya','Наталья'],['family-4','lidia-vasilyevna','Лидия Васильевна'],['family-11','oleg','Олег'],['family-14','maria','Мария'],['family-8','nadezhda-konstantinovna','Надежда Константиновна'],['family-9','anatoly','Анатолий']];
 for(const width of [320,375,390,430,768,1440]){
  await page.setViewportSize({width,height:932});await page.locator('#guests').scrollIntoViewIfNeeded();await overflow(page);
  for(const [id,file,name] of expected){const card=page.locator(`[data-guest-id="${id}"]`);await expect(card.locator('h3')).toHaveText(name);await expect(card.locator('img')).toHaveAttribute('src',`/images/guests/${file}.webp`);
   const frame=await card.locator('.guest-photo').evaluate(el=>{const r=el.getBoundingClientRect();return getComputedStyle(el).aspectRatio==='4 / 5'&&r.width>0;});expect(frame).toBe(true);
   await card.locator('img').evaluate(async(el:HTMLImageElement)=>{el.loading='eager';await el.decode();});
   const wordsFit=await card.locator('h3').evaluate(el=>{const canvas=document.createElement('canvas'),context=canvas.getContext('2d')!;return [...el.childNodes].every(node=>{const style=getComputedStyle(node instanceof Element?node:el);context.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;return(node.textContent||'').trim().split(/\s+/).every(word=>context.measureText(word).width<=el.clientWidth+1);});});expect(wordsFit,`${name} must not break inside a word at ${width}px`).toBe(true);
  }
 }
 await expect(page.locator('[data-guest-id="family-7"]')).toContainText('Галина Ивановна');
 await page.getByRole('button',{name:/Друзья/}).click();await expect(page.locator('.guest-print--approved')).toHaveCount(13);
 const friendImages=[['friends-12','alexander-shoot','Александр'],['friends-2','karina','Карина'],['friends-7','asel','Асель'],['friends-5','alexandra','Александра'],['friends-9','irina','Ирина'],['friends-4','ilya','Илья'],['friends-8','daniil','Даниил'],['friends-11','denis-shoot','Денис'],['friends-10','anastasia','Анастасия'],['friends-0','viktoria','Виктория'],['friends-1','sergey','Сергей'],['friends-3','denis','Денис'],['friends-6','andrey','Андрей']];
 for(const width of [320,375,390,430,768,1440]){await page.setViewportSize({width,height:932});await page.locator('#guests').scrollIntoViewIfNeeded();await overflow(page);for(const[id,file,name]of friendImages){const card=page.locator('[data-guest-id="'+id+'"]');await expect(card.locator('h3')).toHaveText(name);await expect(card.locator('img')).toHaveAttribute('src','/images/guests/friends/'+file+'.webp');await card.locator('img').evaluate(async(el:HTMLImageElement)=>{el.loading='eager';await el.decode();});expect(await card.locator('.guest-photo').evaluate(el=>getComputedStyle(el).aspectRatio)).toBe('4 / 5');}}

 await page.getByRole('button',{name:/Родные/}).click();await expect(page.locator('.guest-album .guest-print--approved')).toHaveCount(15);await expect(page.locator('.family-anchor-card .guest-print--approved')).toHaveCount(2);
});

test('RSVP congratulations single choice, companion validation, drafts, payload stripping and Mini App detail',async({page,context})=>{
 await publicPage(page);await page.locator('input[name=guestName]').fill('Сергей Иванов');await page.getByRole('button',{name:'Приду',exact:true}).click();await page.locator('input[name=who]').fill('Друг');await image(page,page.locator('.congratulations-choice'),'congratulations-default.png');
 await going(page,'Сергей Иванов');await image(page,page.locator('.congratulations-choice'),'congratulations-public.png');
 await page.locator('input[name=congratulationChoice][value=private]').check();await expect(page.locator('input[name=congratulationChoice]:checked')).toHaveCount(1);await expect(page.locator('.companion-field')).toHaveCount(0);await image(page,page.locator('.congratulations-choice'),'congratulations-private.png');
 await page.locator('input[name=congratulationChoice][value=public_with_someone]').check();const companion=page.locator('input[name=congratulationCompanion]');await companion.fill('   ');await companion.blur();await expect(page.locator('#companion-error')).toHaveText('Напишите, с кем будете поздравлять.');await expect(page.getByRole('button',{name:'Подтвердить участие',exact:true})).toBeDisabled();await image(page,page.locator('#rsvp'),'congratulations-error.png');
 await companion.fill('Я'.repeat(121));await page.reload();await expect(companion).toHaveValue('Я'.repeat(121));await expect(page.getByRole('button',{name:'Подтвердить участие',exact:true})).toBeDisabled();
 await companion.fill('  С Сергеем  ');await page.reload();await expect(page.locator('input[name=congratulationChoice]:checked')).toHaveValue('public_with_someone');await expect(companion).toHaveValue('  С Сергеем  ');await image(page,page.locator('#rsvp'),'congratulations-together.png');
 for(const width of [320,375,390,430,768,1440]){await page.setViewportSize({width,height:932});await page.locator('.congratulations-choice').scrollIntoViewIfNeeded();await overflow(page);}
 const submitted=page.waitForRequest(req=>req.method()==='POST'&&req.url().endsWith('/api/rsvp'));await page.getByRole('button',{name:'Подтвердить участие',exact:true}).click();expect((await submitted).postDataJSON()).toMatchObject({congratulationChoice:'public_with_someone',congratulationCompanion:'С Сергеем'});await expect(page.locator('.rsvp-confirmation')).toBeVisible();expect(await page.evaluate(()=>sessionStorage.getItem('anya-maxim-rsvp-draft-v2'))).toBeNull();expect(await page.evaluate(()=>sessionStorage.getItem('anya-maxim-rsvp-draft-v1'))).toBeNull();
 const admin=await context.newPage();await admin.goto('/telegram');await admin.getByRole('navigation',{name:'Основная навигация'}).getByRole('button',{name:'Гости',exact:true}).click();await admin.locator('.organizer-guest').filter({hasText:'Сергей Иванов'}).first().click();await expect(admin.locator('.admin-detail')).toContainText('Публично с кем-то');await expect(admin.locator('.admin-detail')).toContainText('С Сергеем');await admin.setViewportSize({width:375,height:812});await image(admin,admin,'telegram-congratulations.png');await admin.close();
 await page.getByRole('button',{name:'Добавить ещё гостя',exact:true}).click();await expect(page.locator('input[name=congratulationChoice]:checked')).toHaveCount(0);await going(page,'Анна Иванова');await page.locator('input[name=congratulationChoice][value=public_with_someone]').check();await companion.fill('Не отправлять');await page.locator('input[name=congratulationChoice][value=private]').check();const privatePost=page.waitForRequest(req=>req.method()==='POST'&&req.url().endsWith('/api/rsvp'));await page.getByRole('button',{name:'Подтвердить участие',exact:true}).click();expect((await privatePost).postDataJSON()).toHaveProperty('congratulationChoice','private');expect((await privatePost).postDataJSON()).not.toHaveProperty('congratulationCompanion');await expect(page.locator('.rsvp-confirmation')).toBeVisible();
 await page.getByRole('button',{name:'Добавить ещё гостя',exact:true}).click();await going(page,'Третий Гость');await page.getByRole('button',{name:'Не приду',exact:true}).click();await expect(page.locator('.congratulations-choice')).toHaveCount(0);const noPost=page.waitForRequest(req=>req.method()==='POST'&&req.url().endsWith('/api/rsvp'));await page.getByRole('button',{name:'Подтвердить участие',exact:true}).click();expect((await noPost).postDataJSON()).not.toHaveProperty('congratulationChoice');expect((await noPost).postDataJSON()).not.toHaveProperty('congratulationCompanion');
});

test('decorative date keeps its final digit, program captions and DJ link across widths',async({page},testInfo)=>{
 await publicPage(page);
 const captions=['Потом пускать не будем. Ну только если очень сильно попросите.','Можно плакать, разрешаем. Можно и не плакать.','С этого момента всё серьёзно. Едим, пьём и начинаем отмечать.','К этому времени уже можно не делать вид, что вы пришли только поесть.','Да, рано. Нет, это не ошибка. У площадки тоже есть свои дедлайны.'];
 for(const width of [320,375,390,430,768,1440]){
  await page.setViewportSize({width,height:932});const date=page.locator('#date .date-large');await date.scrollIntoViewIfNeeded();await expect(date).toHaveText('17.07.2027');await expect(date).toBeVisible();await ready(page);await overflow(page);
  const ink=await date.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect(),section=el.closest('section')!.getBoundingClientRect(),c=document.createElement('canvas').getContext('2d')!;c.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;const m=c.measureText(el.textContent!),spacing=parseFloat(s.letterSpacing)||0;return{font:s.fontFamily,size:parseFloat(s.fontSize),width:r.width,inkWidth:m.actualBoundingBoxLeft+m.actualBoundingBoxRight+(el.textContent!.length-1)*spacing,inkLeft:parseFloat(s.paddingLeft)-m.actualBoundingBoxLeft,inkRight:parseFloat(s.paddingLeft)+m.actualBoundingBoxRight+(el.textContent!.length-1)*spacing,padding:parseFloat(s.paddingLeft)+parseFloat(s.paddingRight),left:r.left,right:r.right,sectionLeft:section.left,sectionRight:section.right,height:r.height,inkHeight:m.actualBoundingBoxAscent+m.actualBoundingBoxDescent};});
  expect(ink.font).toContain('Bad Script');expect(ink.size).toBeGreaterThanOrEqual(50);expect(ink.width).toBeGreaterThanOrEqual(ink.inkWidth+4);expect(ink.inkLeft).toBeGreaterThanOrEqual(2);expect(ink.inkRight).toBeLessThanOrEqual(ink.width-2);expect(ink.left).toBeGreaterThanOrEqual(ink.sectionLeft);expect(ink.right).toBeLessThanOrEqual(ink.sectionRight);expect(ink.height).toBeGreaterThan(ink.inkHeight);
  await page.locator('#date').screenshot({path:testInfo.outputPath(`date-ink-${width}.png`),animations:'disabled'});
  await page.locator('#schedule').scrollIntoViewIfNeeded();await expect(page.locator('#schedule li p')).toHaveText(captions);
  const tail=await page.locator('.schedule-spread').evaluate(el=>{const last=el.lastElementChild as HTMLElement,s=getComputedStyle(el,'::before');return Math.abs(el.clientHeight-parseFloat(s.bottom)-last.offsetTop-parseFloat(getComputedStyle(last,'::before').top));});expect(tail).toBeLessThanOrEqual(2);await overflow(page);
  await expect(page.locator('#rsvp>header p')).toHaveText('Оставь нам пару слов. Мы очень хотим увидеть тебя за нашим, а в идеале за соседним столом.');
  await page.locator('#question-speeches').focus();await page.locator('#question-speeches').press('Enter');await expect(page.locator('#question-speeches')).toHaveText(/Поздравления и поздравительные речи/);await expect(page.locator('#answer-speeches .question-answer')).toHaveCount(2);await expect(page.locator('#answer-speeches')).toContainText('то есть не позднее 14.07.2027.');
  const dj=page.getByRole('link',{name:'диджею Ивану',exact:true});await expect(dj).toHaveAttribute('href','https://t.me/apseng_vane');await expect(dj).toHaveAttribute('target','_blank');await expect(dj).toHaveAttribute('rel','noopener noreferrer');await dj.focus();expect(await dj.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
  if(width===375||width===1440){await image(page,page.locator('#answer-speeches'),`faq-speeches-${width}.png`);await image(page,page.locator('#rsvp>header'),`rsvp-intro-${width}.png`);}
  await page.locator('#question-speeches').click();await expect(page.locator('#answer-speeches')).toHaveAttribute('aria-hidden','true');
 }
 await page.getByRole('button',{name:/Друзья/}).click();const names=await page.locator('.guest-print h3').allTextContents();expect(names.indexOf('Александра')).toBe(names.indexOf('Илья')-1);expect(names.indexOf('Ирина')).toBe(names.indexOf('Даниил')-1);await expect(page.locator('[data-guest-id="friends-4"] img')).toHaveAttribute('src','/images/guests/friends/ilya.webp');await expect(page.locator('[data-guest-id="friends-5"] img')).toHaveAttribute('src','/images/guests/friends/alexandra.webp');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#date').scrollIntoViewIfNeeded();await page.waitForTimeout(1000);await expect(page.locator('#date .date-large')).toBeVisible();
});

test('relatives split, compact tap and native swipe share state without scroll jumps',async({page,context},testInfo)=>{
 test.setTimeout(120000);await publicPage(page);
 const groom=['Ольга','Владислав','Лидия Васильевна','Сергей Иванович','Галина Николаевна','Олег','Наталья','Екатерина'];
 const bride=['Дарья','Вячеслав','Анатолий','Ангелина','Надежда Константиновна','Галина Ивановна','Мария'];
 const spread=page.locator('.family-spread'),groomPanel=page.locator('#relatives-groom'),bridePanel=page.locator('#relatives-bride');
 const groomButton=page.getByRole('button',{name:'Жениха',exact:true}),brideButton=page.getByRole('button',{name:'Невесты',exact:true});
 await page.locator('#guests img').evaluateAll(async elements=>{const imgs=elements as HTMLImageElement[];for(const img of imgs)img.loading='eager';await Promise.all(imgs.map(img=>img.decode()));});
 for(const width of [320,375,390,430,768,1000,1024,1440]){
  await page.setViewportSize({width,height:932});await page.locator('#guests').scrollIntoViewIfNeeded();await expect(groomPanel.locator('.guest-album .guest-print h3')).toHaveText(groom);await expect(bridePanel.locator('.guest-album .guest-print h3')).toHaveText(bride);await overflow(page);
  if(width<=1000){await expect(groomButton).toBeVisible();await expect(groomButton).toHaveAttribute('aria-pressed','true');await expect(groomPanel).toBeVisible();await expect(bridePanel).toBeHidden();await expect(bridePanel).toHaveAttribute('inert','');await expect(bridePanel).toHaveAttribute('aria-hidden','true');}
  else{await expect(page.locator('.family-switch')).toBeHidden();await expect(groomPanel).toBeVisible();await expect(bridePanel).toBeVisible();await expect(groomPanel.locator('.family-side-title')).toHaveText('Со стороны жениха');await expect(bridePanel.locator('.family-side-title')).toHaveText('Со стороны невесты');expect(await bridePanel.getAttribute('aria-hidden')).toBeNull();expect(await bridePanel.getAttribute('inert')).toBeNull();const a=await groomPanel.boundingBox(),b=await bridePanel.boundingBox();expect(b!.x).toBeGreaterThan(a!.x+a!.width);}
  for(const panel of [groomPanel,bridePanel])expect(await panel.locator('.guest-album').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);
  const last=await bridePanel.locator('.guest-print').last().evaluate(el=>el.clientWidth),first=await bridePanel.locator('.guest-print').first().evaluate(el=>el.clientWidth);expect(Math.abs(last-first)).toBeLessThan(1);
  await page.locator('#guests').screenshot({path:testInfo.outputPath(`relatives-layout-${width}.png`),animations:'disabled'});
 }
 await page.setViewportSize({width:375,height:932});await ready(page);await page.locator('.family-switch').scrollIntoViewIfNeeded();await image(page,page.locator('.family-switch'),'relatives-switch-groom.png');await brideButton.scrollIntoViewIfNeeded();await ready(page);
 const initialHeight=(await spread.boundingBox())!.height,initialScroll=await page.evaluate(()=>scrollY);
 await brideButton.click();await expect(spread).toHaveAttribute('data-family-side','bride');await expect(brideButton).toHaveAttribute('aria-pressed','true');await expect(groomPanel).toHaveAttribute('inert','');await expect(bridePanel).toBeVisible();expect(Math.abs((await spread.boundingBox())!.height-initialHeight)).toBeLessThan(1);expect(Math.abs(await page.evaluate(()=>scrollY)-initialScroll)).toBeLessThanOrEqual(1);
 await image(page,page.locator('.family-switch'),'relatives-switch-bride.png');await image(page,page.locator('#guests'),'relatives-tap-bride.png');
 await groomButton.click();await expect(groomButton).toHaveAttribute('aria-pressed','true');await image(page,page.locator('#guests'),'relatives-tap-groom.png');
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
 async function swipe(dx:number,dy:number){
  await spread.evaluate(el=>window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-160,behavior:'instant'}));const box=(await spread.boundingBox())!,x=box.x+box.width/2,y=box.y+80,before=await page.evaluate(()=>scrollY);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/8,y:y+dy*i/8}]});await page.waitForTimeout(16);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(380);return{before,after:await page.evaluate(()=>scrollY)};
 }
 await swipe(110,0);await expect(spread).toHaveAttribute('data-family-side','groom');await swipe(-35,0);await expect(spread).toHaveAttribute('data-family-side','groom');const vertical=await swipe(10,-140);await expect(spread).toHaveAttribute('data-family-side','groom');expect(vertical.after).toBeGreaterThan(vertical.before+60);
 const left=await swipe(-110,0);await expect(spread).toHaveAttribute('data-family-side','bride');await expect(brideButton).toHaveAttribute('aria-pressed','true');expect(Math.abs(left.after-left.before)).toBeLessThanOrEqual(1);await image(page,page.locator('#guests'),'relatives-swipe-bride.png');
 await swipe(-110,0);await expect(spread).toHaveAttribute('data-family-side','bride');await swipe(110,0);await expect(spread).toHaveAttribute('data-family-side','groom');await expect(groomButton).toHaveAttribute('aria-pressed','true');await image(page,page.locator('#guests'),'relatives-swipe-groom.png');
 await brideButton.focus();await brideButton.press('Space');await expect(brideButton).toHaveAttribute('aria-pressed','true');expect(await brideButton.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');await groomButton.focus();await groomButton.press('Enter');await expect(groomButton).toHaveAttribute('aria-pressed','true');
 await brideButton.click();await page.getByRole('button',{name:/Друзья/}).click();await expect(page.locator('.family-switch')).toHaveCount(0);await page.getByRole('button',{name:/Родные/}).click();await expect(brideButton).toHaveAttribute('aria-pressed','true');await image(page,page.locator('#guests'),'guests-relatives-bride-375.png');
 await page.reload();await expect(groomButton).toHaveAttribute('aria-pressed','true');expect(await groomPanel.evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('.family-switch').scrollIntoViewIfNeeded();await page.waitForTimeout(850);await brideButton.click();await page.waitForTimeout(380);await expect(bridePanel).toBeVisible();expect(await bridePanel.evaluate(el=>getComputedStyle(el).transitionDuration)).toContain('0.32s');await overflow(page);await cdp.detach();
});

test('seal stays on the mobile flap closure at different screen heights',async({page},testInfo)=>{
 await page.goto('/');await ready(page);
 for(const width of [320,375,390,430,768,1000,1024,1440])for(const height of [650,932]){
  await page.setViewportSize({width,height});await page.waitForTimeout(100);await overflow(page);
  const geometry=await page.locator('.seal').evaluate(el=>{const r=el.getBoundingClientRect(),shell=el.closest('.envelope-open')!.getBoundingClientRect();return{centre:(r.top+r.height/2-shell.top)/shell.height,x:r.left+r.width/2-shell.left-shell.width/2,inside:r.top>=shell.top&&r.bottom<=shell.bottom};});
  expect(geometry.inside).toBe(true);expect(Math.abs(geometry.x)).toBeLessThan(1);if(width<=600)expect(geometry.centre).toBeCloseTo(.54,2);
  if(height===932)await page.screenshot({path:testInfo.outputPath(`seal-${width}.png`),animations:'disabled'});
 }
 await page.setViewportSize({width:375,height:812});await image(page,page,'envelope-mobile-seal.png');
 const signature=await page.locator('.opening-signature').evaluate(el=>({color:getComputedStyle(el).color,ink:getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()}));expect(signature.color).toBe('rgb(48, 56, 43)');
 await page.getByRole('button',{name:'Открыть конверт',exact:true}).click();await expect(page.locator('.opening--letter')).toBeVisible();
});

test('public copy has no long dashes and compact mobile lookbook keeps readable content',async({page})=>{
 await publicPage(page);for(const trigger of await page.locator('.question-trigger').all())await trigger.click();
 expect(await page.locator('main').innerText()).not.toMatch(/[—–]/);
 for(const width of [320,375,390,430]){
  await page.setViewportSize({width,height:932});await page.locator('#dress-code').scrollIntoViewIfNeeded();await overflow(page);
  expect(await page.locator('.lookbook-guidance').evaluate(el=>parseFloat(getComputedStyle(el).minHeight))).toBeLessThan(600);
  expect(await page.locator('.lookbook-description p').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(13);
 }
 await page.goto('/venue-rules');await ready(page);expect(await page.locator('main').innerText()).not.toMatch(/[—–]/);
});

test('mobile fashion photo controls, compact captions and swipe stay independent',async({page,context},testInfo)=>{
 test.setTimeout(120000);await publicPage(page);
 for(const width of [320,375,390,430]){
  await page.setViewportSize({width,height:932});
  for(const gender of ['Для девушек','Для мужчин']){
   await page.locator('.dress-original-tabs').getByRole('button',{name:gender,exact:true}).click();
   for(const part of ['Одежда','Аксессуары']){
    await page.locator('.dress-original-tabs').getByRole('button',{name:part,exact:true}).click();
    for(const id of ['dress-allowed','dress-avoid']){
     const section=page.locator('#'+id),photo=section.locator('.lookbook-incoming .lookbook-photo'),controls=section.locator('.dress-gallery-controls');await photo.scrollIntoViewIfNeeded();await photo.locator('img').evaluate(async el=>(el as HTMLImageElement).decode());
     const p=(await photo.boundingBox())!,c=(await controls.boundingBox())!,caption=(await section.locator('.lookbook-incoming .lookbook-description').boundingBox())!;
     expect(c.y).toBeGreaterThan(p.y);expect(c.y+c.height).toBeLessThan(p.y+p.height);expect(c.x).toBeGreaterThan(p.x);expect(c.x+c.width).toBeLessThan(p.x+p.width);expect(c.y+c.height).toBeLessThan(caption.y);
     for(const button of await controls.locator('button').all()){const b=(await button.boundingBox())!;expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44);}
     const before=(await section.boundingBox())!.height;await controls.locator('button').last().click();await expect(controls.locator('.gallery-counter')).toContainText('02 /');await expect(section.locator('.lookbook-incoming')).toBeVisible();expect(Math.abs((await section.boundingBox())!.height-before)).toBeLessThanOrEqual(1);await controls.locator('button').first().click();await expect(controls.locator('.gallery-counter')).toContainText('01 /');
     expect(await section.locator('.lookbook-incoming .lookbook-description').evaluate(el=>parseFloat(getComputedStyle(el).minHeight))).toBeLessThan(360);
    }
    await overflow(page);if(width===375)await image(page,page.locator('#dress-allowed'),'fashion-overlay-'+(gender==='Для девушек'?'women':'men')+'-'+(part==='Одежда'?'clothes':'accessories')+'.png');
   }
  }
 }
 await page.setViewportSize({width:375,height:932});await page.locator('.dress-original-tabs').getByRole('button',{name:'Для девушек',exact:true}).click();await page.locator('#dress-allowed .lookbook-incoming img').scrollIntoViewIfNeeded();const photo=(await page.locator('#dress-allowed .lookbook-incoming img').boundingBox())!,session=await context.newCDPSession(page);await session.send('Emulation.setTouchEmulationEnabled',{enabled:true});
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:photo.x+photo.width*.8,y:photo.y+100}]});for(let n=1;n<=6;n++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:photo.x+photo.width*.8-n*24,y:photo.y+100}]});}await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(page.locator('#dress-allowed .gallery-counter')).toContainText('02 /');await session.detach();
 await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#dress-allowed .dress-gallery-controls button').last().click();await page.waitForTimeout(520);await expect(page.locator('#dress-allowed .gallery-counter')).toContainText('03 /');await page.locator('#dress-allowed').screenshot({path:testInfo.outputPath('fashion-overlay-motion.png')});
 await page.setViewportSize({width:1440,height:900});expect(await page.locator('#dress-allowed .dress-gallery-controls').evaluate(el=>getComputedStyle(el).position)).toBe('static');
});

test('local Bickham signatures load and retain all ink without changing Russian typography',async({page},testInfo)=>{
 test.setTimeout(120000);const font=await page.request.get('/fonts/bickham-script-pro/bickham-script-pro-regular.ttf');expect(font.status()).toBe(200);expect((await font.body()).length).toBe(931840);
 for(const width of [320,375,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:932});await page.goto('/');await expect(page.locator('.opening-signature')).toBeVisible();await ready(page);
  expect(await page.evaluate(()=>document.fonts.check('44px "Bickham Script Pro"','Anya & Maxim'))).toBe(true);
  const top=page.locator('.opening-signature');await expect(top).toHaveText('Anya & Maxim');expect(await top.evaluate(el=>getComputedStyle(el).color)).toBe('rgb(48, 56, 43)');
  const name=(await top.boundingBox())!,date=(await page.locator('.opening-top>span').last().boundingBox())!;expect(name.x+name.width).toBeLessThan(date.x-4);
  await page.getByRole('button',{name:'Открыть конверт',exact:true}).click();await expect(page.locator('.opening--letter')).toBeVisible();await ready(page);
  for(const signature of [top,page.locator('.letter-names')]){
   const ink=await signature.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect(),ctx=document.createElement('canvas').getContext('2d')!;ctx.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;const m=ctx.measureText(el.textContent!.replace(/\s+/g,' ').trim()),paddingLeft=parseFloat(s.paddingLeft),paddingRight=parseFloat(s.paddingRight),paddingTop=parseFloat(s.paddingTop),baseX=r.left+paddingLeft+(s.textAlign==='center'?(r.width-paddingLeft-paddingRight-m.width)/2:0),baseY=r.top+paddingTop+(parseFloat(s.lineHeight)-m.fontBoundingBoxAscent-m.fontBoundingBoxDescent)/2+m.fontBoundingBoxAscent;return{font:s.fontFamily,left:baseX-m.actualBoundingBoxLeft,right:baseX+m.actualBoundingBoxRight,top:baseY-m.actualBoundingBoxAscent,bottom:baseY+m.actualBoundingBoxDescent,box:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},wrap:s.whiteSpace};});
   expect(ink.font).toContain('Bickham Script Pro');expect(ink.wrap).toBe('nowrap');expect(ink.left).toBeGreaterThanOrEqual(ink.box.left-1);expect(ink.right).toBeLessThanOrEqual(ink.box.right+2);expect(ink.top).toBeGreaterThanOrEqual(ink.box.top-1);expect(ink.bottom).toBeLessThanOrEqual(ink.box.bottom+1);
  }
  expect(await page.locator('.letter-names span').evaluate(el=>getComputedStyle(el).fontFamily)).toContain('Bickham Script Pro');expect(await page.locator('.paper-wing').first().evaluate(el=>getComputedStyle(el,'::after').fontFamily)).toContain('Bickham Script Pro');await overflow(page);
  await page.screenshot({path:testInfo.outputPath(`bickham-letter-${width}.png`),animations:'disabled'});
 }
 await page.getByRole('button',{name:'Дальше больше',exact:true}).click();await expect(page.locator('main.invitation')).toBeVisible();expect(await page.locator('.portrait-names').evaluate(el=>getComputedStyle(el).fontFamily)).not.toContain('Bickham');expect(await page.locator('.date-large').evaluate(el=>getComputedStyle(el).fontFamily)).toContain('Bad Script');
 await page.goto('/telegram');await expect(page.locator('.organizer-kpis')).toBeVisible();await ready(page);expect(await page.locator('.organizer-brand>.english-signature').evaluate(el=>getComputedStyle(el).fontFamily)).toContain('Bickham Script Pro');expect(await page.locator('.organizer-brand>span').last().evaluate(el=>getComputedStyle(el).fontFamily)).toContain('Montserrat');
 for(const width of [320,375,390,430,768,1024,1440]){await page.setViewportSize({width,height:932});const brand=(await page.locator('.organizer-brand').boundingBox())!,name=(await page.locator('.organizer-brand>.english-signature').boundingBox())!,label=(await page.locator('.organizer-brand>span').last().boundingBox())!;expect(brand.height).toBe(22);expect(name.x+name.width).toBeLessThan(label.x-4);await overflow(page);}
});

test('Dress Code notices and art-directed palette order across mobile and desktop',async({page})=>{
 test.setTimeout(120000);await publicPage(page);const chapter=page.locator('#dress-code');
 for(const width of [320,375,390,430,768,1000,1024,1440]){
  await page.setViewportSize({width,height:932});await ready(page);
  const notices=chapter.locator('.dress-notices');await expect(notices.locator('p')).toHaveCount(2);
  const notice=await notices.evaluate(el=>{const first=el.children[0] as HTMLElement,second=el.children[1] as HTMLElement,a=getComputedStyle(first),b=getComputedStyle(second),r=first.getBoundingClientRect(),s=second.getBoundingClientRect();return{primarySize:parseFloat(a.fontSize),secondarySize:parseFloat(b.fontSize),primaryWeight:parseInt(a.fontWeight),secondaryWeight:parseInt(b.fontWeight),height:r.height,gap:s.top-r.bottom,background:a.backgroundColor,secondaryBackground:b.backgroundColor,radius:a.borderRadius,secondaryRadius:b.borderRadius};});
  expect(notice.primarySize).toBeGreaterThan(notice.secondarySize);expect(notice.primaryWeight).toBeGreaterThan(notice.secondaryWeight);expect(notice.background).toBe(notice.secondaryBackground);expect(notice.radius).toBe(notice.secondaryRadius);expect(notice.gap).toBeLessThanOrEqual(12);if(width<=430)expect(notice.height).toBeLessThan(406);
  await expect(chapter.getByRole('link',{name:'напишите Ане'})).toHaveAttribute('href','https://t.me/Selesssta');
  if([375,430,1440].includes(width))await image(page,notices,'dress-notices-'+width+'.png');
  for(const gender of ['Для девушек','Для мужчин']){
   await chapter.getByRole('button',{name:gender,exact:true}).click();
   for(const part of ['Одежда','Аксессуары']){
    await page.locator('.dress-original-tabs').getByRole('button',{name:part,exact:true}).click();
    const expected=part==='Одежда'?[dressPalettes.olive,gender==='Для девушек'?dressPalettes.creamGold:dressPalettes.milk]:gender==='Для девушек'?[dressPalettes.oliveBase,dressPalettes.creamGoldBase]:null;
    const groups=chapter.locator('.palette-family');await expect(groups).toHaveCount(2);
    await expect(chapter.locator('.dress-palette-hint')).toHaveCount(1);await expect(groups.locator('.palette-family-hint')).toHaveCount(0);
    if(expected)for(let i=0;i<2;i++)expect(await groups.nth(i).locator('.palette-fan i').evaluateAll(els=>els.map(el=>(el as HTMLElement).style.getPropertyValue('--shade')))).toEqual(expected[i].map(shade=>shade.color));
    if(gender==='Для девушек'&&part==='Аксессуары'){
     await expect(groups.nth(0)).toHaveAttribute('aria-label','Если основа оливковая');await expect(groups.nth(1)).toHaveAttribute('aria-label','Если основа сливочно-золотая');await expect(chapter.locator('.dress-palette')).not.toContainText('Светлые аксессуары');await expect(chapter.locator('.dress-palette')).not.toContainText('Украшения');
     if([375,430,1440].includes(width)){await image(page,groups.nth(0),'dress-accessories-olive-base-'+width+'.png');await image(page,groups.nth(1),'dress-accessories-cream-gold-base-'+width+'.png');}
    }
    if(gender==='Для мужчин'&&part==='Одежда')await expect(chapter.locator('.dress-family-explanation')).toContainText('Рубашка молочная, не белая.');
    const bounds=await chapter.evaluate(el=>{const palette=el.querySelector('.dress-palette')!.getBoundingClientRect(),guidance=el.querySelector('.lookbook-guidance')!.getBoundingClientRect(),copy=el.querySelector('.dress-family-explanation')!.getBoundingClientRect();return{palette:{left:palette.left,right:palette.right,bottom:palette.bottom,width:palette.width},guidance:{left:guidance.left,right:guidance.right,top:guidance.top,width:guidance.width},copy:{width:copy.width},titleOverflow:[...el.querySelectorAll('.palette-family-title')].some(title=>title.scrollWidth>title.clientWidth+1)};});
    expect(bounds.guidance.top).toBeGreaterThanOrEqual(bounds.palette.bottom);expect(bounds.guidance.left).toBeLessThan((bounds.palette.left+bounds.palette.right)/2);expect(bounds.guidance.right).toBeGreaterThan((bounds.palette.left+bounds.palette.right)/2);expect(bounds.copy.width).toBeCloseTo(bounds.guidance.width,0);expect(bounds.titleOverflow).toBe(false);await overflow(page);
   }
  }
 }
});

test('24 material assets, semantic trios, native mobile rails and male black warning',async({page})=>{
 test.setTimeout(120000);await publicPage(page);const chapter=page.locator('#dress-code');
 for(const width of[320,375,390,430,768,1000,1024,1440]){
  await page.setViewportSize({width,height:932});await ready(page);
  for(const gender of['Для девушек','Для мужчин']){
   await chapter.getByRole('button',{name:gender,exact:true}).click();
   for(const part of['Одежда','Аксессуары']){
    await page.locator('.dress-original-tabs').getByRole('button',{name:part,exact:true}).click();
    const state=(gender==='Для девушек'?'women':'men')+'-'+(part==='Одежда'?'clothes':'accessories'),materials=chapter.locator('.dress-materials'),expected=dressMaterialItems[state];
    await expect(materials.locator('.material-card')).toHaveCount(6);await expect(materials.locator('.material-group')).toHaveCount(2);
    expect(await materials.locator('.material-card').evaluateAll(els=>els.map(el=>Number((el as HTMLElement).dataset.reference)))).toEqual(expected.map(item=>item.reference));
    await materials.locator('img').evaluateAll(async els=>{const imgs=els as HTMLImageElement[];for(const img of imgs)img.loading='eager';await Promise.all(imgs.map(img=>img.decode()));if(imgs.some(img=>img.naturalWidth!==800||img.naturalHeight!==800))throw Error('Broken material image');});
    const isMaleAccessories=state==='men-accessories';await expect(chapter.locator('.dress-black-warning:visible')).toHaveCount(isMaleAccessories?2:0);
    if(state==='men-clothes'){await expect(chapter.locator('.dress-jacket-emphasis')).toHaveText('должен');expect(await chapter.locator('.dress-jacket-emphasis').evaluate(el=>parseInt(getComputedStyle(el).fontWeight))).toBeGreaterThan(400);}
    for(const rail of await materials.locator('.material-items').all()){
     await expect(rail.locator('.material-card')).toHaveCount(3);
     const first=(await rail.locator('.material-card').first().boundingBox())!;expect(first.width).toBeGreaterThan(width<=430?160:100);
     if(width<=700){for(const hint of await rail.locator('.material-hint').all())await expect(hint).toBeHidden();await rail.evaluate(el=>el.scrollTo({left:el.scrollWidth,behavior:'instant'}));const last=(await rail.locator('.material-card').last().boundingBox())!,bounds=(await rail.boundingBox())!;expect(last.x+last.width).toBeLessThanOrEqual(bounds.x+bounds.width+1);await rail.evaluate(el=>el.scrollTo({left:0,behavior:'instant'}));}
    }
    await overflow(page);
    if(width===375||width===1440){await image(page,materials,'materials-'+state+'-'+width+'.png');if(isMaleAccessories)await image(page,chapter.locator('.lookbook-guidance'),'materials-black-warning-'+width+'.png');}
   }
  }
 }
 await page.locator('.dress-original-tabs').getByRole('button',{name:'Для девушек',exact:true}).click();await page.locator('.dress-original-tabs').getByRole('button',{name:'Аксессуары',exact:true}).click();const card=chapter.locator('.material-card').first();await card.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await expect(card.locator('.material-hint')).toHaveCSS('opacity','1');await image(page,card,'material-desktop-hint.png');
});

test('lookbook viewport, status and materials remain compact at short mobile heights',async({page})=>{
 test.setTimeout(120000);await publicPage(page);
 for(const viewport of [{width:320,height:568},{width:375,height:667},{width:390,height:844},{width:430,height:932},{width:812,height:375}]){
  await page.setViewportSize(viewport);
  for(const gender of ['Для девушек','Для мужчин']){await page.locator('.dress-original-tabs').getByRole('button',{name:gender,exact:true}).click();for(const part of ['Одежда','Аксессуары']){
   await page.locator('.dress-original-tabs').getByRole('button',{name:part,exact:true}).click();
   for(const id of ['dress-allowed','dress-avoid']){
    const section=page.locator('#'+id),photo=section.locator('.lookbook-incoming .lookbook-photo'),button=photo.locator('button'),badge=button.locator('.look-status');await photo.scrollIntoViewIfNeeded();await button.locator('img').evaluate(async el=>(el as HTMLImageElement).decode());
    const p=(await photo.boundingBox())!,b=(await button.boundingBox())!,status=(await badge.boundingBox())!;expect(p.height-b.height).toBeLessThanOrEqual(19);expect(p.width-b.width).toBeLessThanOrEqual(19);expect(b.height/b.width).toBeCloseTo(1.25,2);expect(status.width).toBe(36);expect(status.height).toBe(36);expect(status.x).toBeGreaterThan(b.x);expect(status.y).toBeGreaterThan(b.y);expect(b.height).toBeLessThanOrEqual(Math.max(210,viewport.height*.7)+1);
    await section.locator('.dress-gallery-controls button').last().click();const next=(await section.locator('.lookbook-incoming .look-status').boundingBox())!;expect(next.width).toBe(status.width);expect(next.height).toBe(status.height);
   }
   const materials=page.locator('.dress-materials');await expect(materials.locator('figcaption')).toHaveCount(0);for(const card of await materials.locator('.material-card').all()){await expect(card).toHaveAttribute('aria-label',/\S+/);const sizes=await card.evaluate(el=>({card:el.getBoundingClientRect().height,photo:el.querySelector('.material-photo')!.getBoundingClientRect().height}));expect(Math.abs(sizes.card-sizes.photo)).toBeLessThanOrEqual(1);}
   await overflow(page);
  }}
 }
 await page.setViewportSize({width:320,height:568});await page.locator('.dress-original-tabs').getByRole('button',{name:'Для девушек',exact:true}).click();await image(page,page.locator('#dress-allowed'),'lookbook-short-frame.png');
});

test('floating Dress Code tabs retain original styles, follow intent and never contain pagination',async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width:390,height:844});await publicPage(page);const dock=page.locator('.dress-floating');await expect(dock).toBeHidden();await expect(dock.locator('.gallery-counter,.dress-floating-pagination')).toHaveCount(0);await expect(dock).not.toContainText('Так можно');await expect(dock).not.toContainText('01 /');
 const scroll=async(delta:number)=>{await page.evaluate(y=>scrollBy({top:y,behavior:'instant'}),delta);await ready(page);};
 await page.locator('.dress-original-tabs').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await ready(page);await scroll(-40);await expect(dock).toBeHidden();await image(page,page.locator('.dress-original-tabs'),'lookbook-original-tabs.png');
 const styles=(el:Element)=>{const css=getComputedStyle(el);return {font:css.fontFamily,size:css.fontSize,line:css.lineHeight,padding:css.padding,radius:css.borderRadius,border:css.borderBottomColor};};
 for(const [selector,name] of [['.dress-palette-families','palette'],['.dress-materials','materials'],['#dress-allowed','lookbook']] as const){
  await page.locator(selector).evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await ready(page);await scroll(180);await expect(dock).toBeHidden();await scroll(-12);await expect(dock).toBeHidden();await scroll(-24);await expect(dock).toBeVisible();
  for(let n=0;n<8;n++)await scroll(n%2?1:-1);await expect(dock).toBeVisible();
  const originals=page.locator('.dress-original-tabs .page-switch');const rows=dock.locator('.page-switch');for(let row=0;row<2;row++)for(let button=0;button<2;button++){expect(await rows.nth(row).locator('button').nth(button).evaluate(styles)).toEqual(await originals.nth(row).locator('button').nth(button).evaluate(styles));}
  const position=await dock.evaluate(el=>{const r=el.getBoundingClientRect(),css=getComputedStyle(el);return{top:r.top,center:r.left+r.width/2,viewport:innerWidth,position:css.position,bottom:css.bottom,background:css.backgroundColor};});expect(position.position).toBe('fixed');expect(position.top).toBeGreaterThanOrEqual(0);expect(position.top).toBeLessThanOrEqual(20);expect(Math.abs(position.center-position.viewport/2)).toBeLessThanOrEqual(1);expect(position.bottom).not.toBe('12px');expect(position.background).toBe('rgba(10, 10, 10, 0.65)');await expect.soft(dock).toHaveScreenshot('lookbook-floating-'+name+'.png');await scroll(42);await expect(dock).toBeHidden();
 }
 await page.locator('.dress-materials').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await ready(page);await scroll(150);await scroll(-40);const before=await page.evaluate(()=>scrollY);await dock.getByRole('button',{name:'Для мужчин',exact:true}).click();await expect(page.locator('.dress-original-tabs').getByRole('button',{name:'Для мужчин',exact:true})).toHaveAttribute('aria-pressed','true');expect(Math.abs((await page.evaluate(()=>scrollY))-before)).toBeLessThanOrEqual(4);await dock.getByRole('button',{name:'Аксессуары',exact:true}).click();await expect(page.locator('.dress-original-tabs').getByRole('button',{name:'Аксессуары',exact:true})).toHaveAttribute('aria-pressed','true');expect(Math.abs((await page.evaluate(()=>scrollY))-before)).toBeLessThanOrEqual(4);
 await page.locator('#dress-avoid').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await ready(page);await expect(page.locator('#dress-avoid .gallery-counter')).toHaveText('01 / 04');await expect(dock.locator('button')).toHaveCount(4);
 await page.locator('#schedule').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await ready(page);await expect(dock).toBeHidden();await expect.soft(page).toHaveScreenshot('lookbook-below-chapter.png');await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await ready(page);await expect(dock).toBeHidden();
});

test('lookbook fullscreen uses the same group, bounded navigation, keyboard, swipe and focus return',async({page,context})=>{
 test.setTimeout(120000);await publicPage(page);
 for(const width of [375,1440]){
  await page.setViewportSize({width,height:width===375?812:900});await page.locator('.dress-original-tabs').getByRole('button',{name:'Для мужчин',exact:true}).click();await page.locator('.dress-original-tabs').getByRole('button',{name:'Аксессуары',exact:true}).click();
  const section=page.locator('#dress-avoid');for(let i=0;i<3;i++)await section.locator('.dress-gallery-controls button').last().click();await expect(section.locator('.gallery-counter')).toHaveText('04 / 04');await expect(section.locator('.lookbook-incoming h4')).toHaveText('Клоунский набор');await image(page,section,'lookbook-clown-'+width+'.png');
  const open=section.locator('.lookbook-incoming .lookbook-open');await open.focus();await open.press('Enter');const dialog=page.locator('.lookbook-dialog');await expect(dialog).toBeVisible();await expect(dialog.getByRole('heading')).toHaveText('Клоунский набор');await expect(dialog.getByRole('button',{name:'Следующий образ'})).toBeDisabled();await image(page,dialog,'lookbook-clown-fullscreen-'+width+'.png');
  expect(await page.evaluate(()=>document.body.style.overflow)).toBe('hidden');await page.keyboard.press('ArrowRight');await expect(dialog.getByRole('heading')).toHaveText('Клоунский набор');await page.keyboard.press('ArrowLeft');await expect(dialog.locator('.lookbook-dialog-controls')).toContainText('03 / 04');await expect(section.locator('.gallery-counter')).toHaveText('03 / 04');
  for(let n=0;n<8;n++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('.lookbook-dialog'))).toBe(true);}await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(section.locator('.lookbook-incoming .lookbook-open')).toBeFocused();expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
  await section.locator('.lookbook-incoming .lookbook-open').click();if(width===375){const session=await context.newCDPSession(page),box=(await dialog.locator('.lookbook-dialog-photo').boundingBox())!;await session.send('Emulation.setTouchEmulationEnabled',{enabled:true});await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.8,y:box.y+100}]});for(let n=1;n<=5;n++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*.8-n*22,y:box.y+100}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(dialog.locator('.lookbook-dialog-controls')).toContainText('04 / 04');await session.detach();}await dialog.getByRole('button',{name:'Закрыть просмотр'}).click();
  await page.locator('.dress-original-tabs').getByRole('button',{name:'Для девушек',exact:true}).click();await page.locator('#dress-allowed .lookbook-incoming .lookbook-open').click();await expect(dialog.locator('.lookbook-dialog-controls')).toContainText('01 / 06');await expect(dialog.getByRole('button',{name:'Предыдущий образ'})).toBeDisabled();await image(page,dialog,'lookbook-fullscreen-'+width+'.png');await page.keyboard.press('Escape');await overflow(page);
 }
});

test('Dress Code top and palette retain the invitation language on mobile',async({page})=>{
 await page.setViewportSize({width:375,height:812});await publicPage(page);await image(page,page.locator('.dress-chapter>.chapter-heading'),'lookbook-top-mobile.png');await image(page,page.locator('.dress-notices'),'lookbook-notices-mobile.png');await image(page,page.locator('.dress-palette-families'),'lookbook-palette-mobile.png');
});

test('normal motion floating tabs stay in viewport and pointer clicks preserve reading position',async({page},testInfo)=>{
 test.setTimeout(60000);await page.emulateMedia({reducedMotion:'no-preference'});await publicPage(page);
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:width===390?844:900});await page.locator('.dress-materials').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.waitForTimeout(900);await page.evaluate(()=>scrollBy({top:180,behavior:'instant'}));await ready(page);await page.evaluate(()=>scrollBy({top:-40,behavior:'instant'}));
  const dock=page.locator('.dress-floating');await expect(dock).toBeInViewport({ratio:1});await expect(dock).toHaveCSS('opacity','1');
  const target=dock.getByRole('button',{name:width===390?'Для мужчин':'Для девушек',exact:true}),box=(await target.boundingBox())!;expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(width===390?844:900);
  const before=await page.evaluate(()=>scrollY);await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await expect(page.locator('.dress-original-tabs').getByRole('button',{name:width===390?'Для мужчин':'Для девушек',exact:true})).toHaveAttribute('aria-pressed','true');await ready(page);expect(Math.abs((await page.evaluate(()=>scrollY))-before)).toBeLessThanOrEqual(4);
  await page.screenshot({path:testInfo.outputPath('floating-normal-motion-'+width+'.png')});
 }
});

for(const width of [375,1440])test('floating top center persists through the whole chapter '+width,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width,height:width===375?812:900});await publicPage(page);
 const dock=page.locator('.dress-floating'),original=page.locator('.dress-original-tabs');
 const scroll=async(delta:number)=>{await page.evaluate(y=>scrollBy({top:y,behavior:'instant'}),delta);await ready(page);};
 await original.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await ready(page);await expect(dock).toBeHidden();await image(page,original,'floating-original-'+width+'.png');
 await page.locator('#dress-avoid').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await ready(page);await scroll(100);await scroll(-40);await expect(dock).toBeVisible();
 const checkTop=async()=>{const r=(await dock.boundingBox())!;expect(r.y).toBeGreaterThanOrEqual(0);expect(r.y).toBeLessThanOrEqual(20);expect(Math.abs(r.x+r.width/2-width/2)).toBeLessThanOrEqual(1);await expect(dock).toBeInViewport({ratio:1});await expect(dock).toHaveCSS('position','fixed');};
 await checkTop();await expect.soft(dock).toHaveScreenshot('floating-top-center-'+width+'.png');
 // Move up continuously across lookbook, materials, guidance and palette.
 // Visibility may stop only once the actual original controls intersect viewport.
 let sawOriginal=false,steps=0;
 while(steps++<80){
  const seen=await original.evaluate(el=>{const r=el.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;});
  if(seen){sawOriginal=true;await expect(dock).toBeHidden();break;}
  await expect(dock).toBeVisible();await checkTop();
  if(steps===3){await page.waitForTimeout(150);await expect(dock).toBeVisible();await expect.soft(dock).toHaveScreenshot('floating-upward-hold-'+width+'.png');}
  await scroll(-100);
 }
 expect(sawOriginal).toBe(true);
 // At the last part of the chapter the dock remains available, even with only
 // a short remaining chapter area. A viewport-centre sentinel hid it too early.
 await page.locator('#dress-code').evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().bottom-140,behavior:'instant'}));await ready(page);await scroll(-40);await expect(dock).toBeVisible();await checkTop();
 await page.locator('#dress-code').evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().bottom+30,behavior:'instant'}));await ready(page);await expect(dock).toBeHidden();await scroll(-10);await expect(dock).toBeHidden();
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await ready(page);await expect(dock).toBeHidden();
});

test('final Dress Code regenerated photographs and recommended order',async({page})=>{
 test.setTimeout(180000);await publicPage(page);
 const changed=new Set(['sage-ballgown','eucalyptus-embroidered','olive-short','butter-column','warm-gold-asymmetric','chartreuse-midi','ivory-short','women-accessories-gold','women-accessories-cream','men-accessories-neon','men-accessories-print','men-accessories-sport','men-accessories-brown','men-accessories-olive','men-accessories-tie']);
 const audit=JSON.parse(fs.readFileSync('LOOKBOOK_ASSET_AUDIT.json','utf8')) as {file:string;title:string;eyebrow?:string;group:string}[];
 const categories=[{label:'Для девушек',pages:[{id:'women-clothes',label:'Одежда'},{id:'women-accessories',label:'Аксессуары'}]},{label:'Для мужчин',pages:[{id:'men-clothes',label:'Одежда'},{id:'men-accessories',label:'Аксессуары'}]}];
 for(const width of [375,1440]){
  await page.setViewportSize({width,height:width===375?812:900});
  for(const category of categories){await page.locator('.dress-original-tabs').getByRole('button',{name:category.label,exact:true}).click();for(const part of category.pages){
   await page.locator('.dress-original-tabs').getByRole('button',{name:part.label,exact:true}).click();
   for(const group of ['allowed','avoid'] as const){const gallery=page.locator('#dress-'+group);for(let index=0;index<audit.filter(x=>x.group===part.id+'/'+group).length;index++){
    const src=await gallery.locator('.lookbook-incoming img').getAttribute('src'),item=audit.find(x=>src?.endsWith('/'+x.file))!;expect(item).toBeTruthy();expect(item.group).toBe(part.id+'/'+group);const id=item.file.replace('.webp','');
    await expect(gallery.locator('.lookbook-incoming h4')).toHaveText(item.title);
    if(changed.has(id)||id==='deep-olive-slip')await image(page,gallery,'final-look-'+id+'-'+width+'.png');
    if(item.eyebrow){await expect(gallery.locator('.lookbook-incoming .chapter-kicker')).toHaveText(item.eyebrow!);await gallery.locator('.lookbook-incoming .lookbook-open').click();await expect(page.locator('.lookbook-dialog-status')).toContainText(item.eyebrow!);await image(page,page.locator('.lookbook-dialog'),'final-recommended-'+id+'-'+width+'.png');await page.keyboard.press('Escape');}
    await gallery.locator('.dress-gallery-controls button').last().click();
   }}
  }}await overflow(page);
 }
});
