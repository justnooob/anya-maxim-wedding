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
  const layers=await blend.evaluate(node=>{
   const surface=getComputedStyle(node);
   const fade=getComputedStyle(node,'::before');
   return {
    source:fade.backgroundColor,
    sourceImage:fade.backgroundImage,
    target:surface.backgroundColor,
    targetImage:surface.backgroundImage,
    mask:fade.maskImage||fade.getPropertyValue('-webkit-mask-image')
   };
  });
  expect(layers.mask,'Each separator should fade the source texture rather than use a flat dark stripe').toContain('linear-gradient');
  expect(layers.sourceImage!=='none'||layers.targetImage!=='none'||layers.source!==layers.target).toBeTruthy();
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
 const dress=page.locator('#dress-code');
 await expect(blend).toBeVisible();
 await expect(blend).toHaveAttribute('aria-hidden','true');
 await expect(blend).toHaveCSS('pointer-events','none');
 const geometry=await blend.evaluate(el=>{
  const rect=el.getBoundingClientRect(),style=getComputedStyle(el),fade=getComputedStyle(el,'::before');
  const panel=getComputedStyle(document.querySelector('#venue .venue-copy')!);
  return {
   width:rect.width,viewport:document.documentElement.clientWidth,height:rect.height,
   target:style.backgroundImage,mask:fade.maskImage||fade.getPropertyValue('-webkit-mask-image'),
   previous:el.previousElementSibling?.id,next:el.nextElementSibling?.id,
   panelBottomBorder:panel.borderBottomWidth,panelShadow:panel.boxShadow
  };
 });
 expect(geometry.previous).toBe('venue');
 expect(geometry.next).toBe('dress-code');
 expect(Math.abs(geometry.width-geometry.viewport)).toBeLessThanOrEqual(1);
 expect(geometry.height).toBeGreaterThanOrEqual(48);
 expect(geometry.height).toBeLessThanOrEqual(64);
 expect(geometry.mask).toContain('linear-gradient');
 expect(geometry.target).toContain('writing-paper');
 expect(geometry.panelBottomBorder).toBe('0px');
 expect(geometry.panelShadow).toBe('none');
 await expect(venue.locator('.venue-gallery')).toBeVisible();
 await expect(dress).toBeVisible();

 await page.setViewportSize({width:1440,height:900});
 await expect(blend).toBeHidden();
});

test('all chapter blends use textured source surfaces at both desktop and mobile widths',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('anya-maxim-opening-v1','yes'));
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto('/');
  const info=await page.locator('#top .section-blend--stone-olive').evaluate(el=>{
   const surface=getComputedStyle(el),fade=getComputedStyle(el,'::before');
   return {
    image:surface.backgroundImage,
    source:fade.backgroundColor,
    mask:fade.maskImage||fade.getPropertyValue('-webkit-mask-image')
   };
  });
  expect(info.image).toContain('paper-grain.svg');
  expect(info.source).toBe('rgb(215, 212, 201)');
  expect(info.mask).toContain('linear-gradient');
 }
});
