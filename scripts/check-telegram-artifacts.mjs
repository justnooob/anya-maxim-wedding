// Verify the actual production artifacts without printing any secret or guest data.
import fs from 'node:fs';
import path from 'node:path';
try{process.loadEnvFile('.env.local');}catch{}
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const html=fs.readFileSync('.next/server/app/telegram.html','utf8');
if(!html.includes('Эта страница доступна только организаторам через Telegram.')||/admin-counts|admin-guests|admin-detail|admin-filters/.test(html))throw new Error('Telegram HTML isolation check failed. Details hidden.');
const privateValues=['TELEGRAM_BOT_TOKEN','TELEGRAM_WEBHOOK_SECRET','DATABASE_URL','SESSION_SECRET'].map(k=>process.env[k]).filter(v=>v&&v.length>=8);
for(const file of files('.next/static').filter(f=>f.endsWith('.js'))){const text=fs.readFileSync(file,'utf8');if(text.includes('TELEGRAM_BOT_TOKEN')||privateValues.some(v=>text.includes(v)))throw new Error('Private data found in a client artifact. Details hidden.');}
console.log('Telegram production HTML: no dashboard or RSVP data before authorization.');
console.log('Client JavaScript: no bot token, webhook secret, database URL or configured session secret.');
