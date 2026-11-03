import {test,expect} from 'playwright/test';

test('sealed envelope has no rectangular focus ring and rocks only with motion allowed',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 const button=page.getByRole('button',{name:'Открыть конверт'});
 await expect(button).toBeVisible();
 await expect(button).toBeFocused();
 await expect(button).toHaveCSS('outline-style','none');
 const seal=button.locator('.seal img');
 await expect(seal).toHaveCSS('animation-name','invitation-seal-rock');
 const heading=await page.locator('.opening-title').boundingBox();
 const envelope=await page.locator('.envelope-shell--front').boundingBox();
 expect(heading).not.toBeNull();expect(envelope).not.toBeNull();
 expect(heading!.y+heading!.height).toBeLessThan(envelope!.y+16);
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(seal).toHaveCSS('animation-name','none');
});
test('short mobile envelope remains readable',async({page})=>{
 await page.setViewportSize({width:320,height:480});
 await page.goto('/');
 const heading=await page.locator('.opening-title').boundingBox();
 const envelope=await page.locator('.envelope-shell--front').boundingBox();
 expect(heading).not.toBeNull();expect(envelope).not.toBeNull();
 expect(heading!.y+heading!.height).toBeLessThan(envelope!.y+16);
});
test('colour blends are decorative and consecutive chapters stay readable',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('anya-maxim-opening-v1','yes'));
 await page.goto('/');
 const blends=page.locator('main.invitation>.section-blend');
 await expect(blends).toHaveCount(6);
 for(const blend of await blends.all()){
  await expect(blend).toHaveAttribute('aria-hidden','true');
  await expect(blend).toHaveCSS('pointer-events','none');
  const background=await blend.evaluate(node=>getComputedStyle(node).backgroundImage);
  expect(background).toContain('linear-gradient');
 }
 await expect(page.locator('#date')).toBeVisible();
 await expect(page.locator('#questions')).toBeVisible();
});

test('venue to dress transition appears only on mobile without touching the photo',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('anya-maxim-opening-v1','yes'));
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 const venue=page.locator('#venue');
 const blend=page.locator('#top > .section-blend--venue-dress');
 const dress=page.locator('#dress');
 await expect(blend).toBeVisible();
 await expect(blend).toHaveAttribute('aria-hidden','true');
 await expect(blend).toHaveCSS('pointer-events','none');
 const geometry=await blend.evaluate(el=>{
  const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
  return {width:rect.width,viewport:document.documentElement.clientWidth,height:rect.height,background:style.backgroundImage,previous:el.previousElementSibling?.id,next:el.nextElementSibling?.id};
 });
 expect(geometry.previous).toBe('venue');
 expect(geometry.next).toBe('dress');
 expect(Math.abs(geometry.width-geometry.viewport)).toBeLessThanOrEqual(1);
 expect(geometry.height).toBeGreaterThanOrEqual(48);
 expect(geometry.height).toBeLessThanOrEqual(64);
 expect(geometry.background).toContain('linear-gradient');
 await expect(venue.locator('.venue-gallery')).toBeVisible();
 await expect(dress).toBeVisible();

 await page.setViewportSize({width:1440,height:900});
 await expect(blend).toBeHidden();
});
