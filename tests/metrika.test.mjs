import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
test('Metrika counter and Webvisor initialize once in the public Next.js layout',()=>{
 const layout=read('src/app/layout.tsx');
 const counter=read('src/components/YandexMetrika.tsx');
 assert.match(layout,/import \{YandexMetrika\} from ['"]@\/components\/YandexMetrika['"]/);
 assert.equal((layout.match(/<YandexMetrika \/>/g)||[]).length,1);
 assert.match(counter,/strategy="afterInteractive"/);
 assert.match(counter,/id="yandex-metrika"/);
 assert.match(counter,/114154761/);
 for(const setting of ['ssr:true','webvisor:true','clickmap:true','accurateTrackBounce:true','trackLinks:true'])
  assert.ok(counter.includes(setting),setting);
 assert.match(counter,/https:\/\/mc\.yandex\.ru\/metrika\/tag\.js\?id=114154761/);
 assert.match(counter,/https:\/\/mc\.yandex\.ru\/watch\/114154761/);
 assert.match(counter,/pathname === "\/telegram"/);
});
test('Webvisor excludes private RSVP, gift booking and organizer content',()=>{
 const rsvp=read('src/components/RSVP.tsx');
 const drinks=read('src/components/DrinkChoices.tsx');
 const wishlist=read('src/components/Wishlist.tsx');
 const admin=read('src/components/TelegramAdmin.tsx');
 for(const key of ['guestName','who','congratulationCompanion'])
  assert.ok(rsvp.includes('<input className="ym-disable-keys" name="'+key+'"'),key);
 for(const key of ['food','musicRequest'])
  assert.ok(rsvp.includes('<textarea className="ym-disable-keys" name="'+key+'"'),key);
 assert.match(drinks,/className="ym-disable-keys" name=\{kind\+"Other"\}/);
 assert.match(wishlist,/className="ym-disable-keys" autoFocus name="reserverName"/);
 assert.match(rsvp,/rsvp-confirmation ym-hide-content/);
 assert.match(admin,/telegram-admin organizer ym-hide-content/);
});
