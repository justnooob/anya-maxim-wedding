import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {splitMusicLinks} from '../src/content/music-links.mjs';
const links=text=>splitMusicLinks(text).filter(part=>part.href);
const reassemble=text=>splitMusicLinks(text).map(part=>part.text).join('');

test('pasted music links open directly, while surrounding guest text is preserved',()=>{
 const samples=[
  'Поставьте эту песню: https://music.yandex.ru/album/123/track/456?utm_source=share',
  'Queen: https://youtu.be/abcd1234 и ABBA: https://www.youtube.com/watch?v=TEST',
  'https://open.spotify.com/track/abcdef\nwww.youtube.com/watch?v=42',
  'Ссылка music.yandex.ru/album/123/track/456, спасибо!',
 ];
 for(const text of samples){
  assert.equal(reassemble(text),text);
  assert.ok(links(text).length>=1,text);
  for(const link of links(text))assert.match(link.href,/^https?:\/\//);
 }
 assert.equal(links(samples[1]).length,2);
 assert.equal(links(samples[2]).length,2);
 assert.equal(links(samples[3])[0].href,'https://music.yandex.ru/album/123/track/456');
});
test('punctuation and wrapping stay as text, URL excludes trailing symbols',()=>{
 const text='(https://music.yandex.ru/album/1/track/2),\nА ещё вот: www.youtube.com/watch?v=42.';
 assert.equal(reassemble(text),text);
 assert.equal(links(text)[0].href,'https://music.yandex.ru/album/1/track/2');
 assert.equal(links(text)[1].href,'https://www.youtube.com/watch?v=42');
 assert.deepEqual(splitMusicLinks('Хочу Кино и ABBA'),[{text:'Хочу Кино и ABBA',href:null}]);
});
test('unsafe protocols and forged URI text are never clickable',()=>{
 for(const input of ['javascript:alert(1)','data:text/html,<script>alert(1)</script>','ftp://example.com/track','javascript:https://evil.example/path','https://user:password@example.com/track','https://']) {
  assert.equal(links(input).length,0,input);
  assert.equal(reassemble(input),input);
 }
});
test('Telegram Mini App uses native openLink and a browser fallback, in both music views',()=>{
 const c=fs.readFileSync('src/components/MusicLinks.tsx','utf8');
 const admin=fs.readFileSync('src/components/TelegramAdmin.tsx','utf8');
 assert.match(c,/openLink\(href\)/);
 assert.match(c,/target="_blank"/);
 assert.match(c,/noopener noreferrer/);
 assert.match(admin,/MusicLinks text=\{g\.music\}/);
 assert.match(admin,/label==='Музыка'\?<MusicLinks/);
});
