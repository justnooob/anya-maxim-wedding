import fs from 'node:fs';
import {setTimeout as pause} from 'node:timers/promises';
import {parseAllowedUserIds, createTelegramHandler} from '../src/server/telegram/access.mjs';
import {transaction} from '../src/server/db/index.mjs';
import {handleAdminUpdate,updateSender} from '../src/server/telegram/admin.mjs';
import {drainOutbox} from '../src/server/telegram/outbox.mjs';
import {createTelegramApi, TelegramApiError} from '../src/server/telegram/api.mjs';

const stopping = new AbortController();
process.on('SIGINT', () => stopping.abort());
process.on('SIGTERM', () => stopping.abort());
// No raw exception is allowed to reach the terminal, including uncaught exceptions.
process.on('uncaughtException', () => { console.error('Telegram process stopped safely.'); process.exit(1); });
process.on('unhandledRejection', () => { console.error('Telegram process stopped safely.'); process.exit(1); });

let startupStage = 'development mode';
async function main() {
  const environment = process.env.NODE_ENV || 'development';
  if (environment !== 'development') throw new Error('Development mode required');
  startupStage = 'TELEGRAM_ALLOWED_USER_IDS format (comma-separated numeric IDs)';
  const allowedIds = parseAllowedUserIds(process.env.TELEGRAM_ALLOWED_USER_IDS || '');
  startupStage = 'TELEGRAM_BOT_TOKEN presence and format';
  const api = createTelegramApi(process.env.TELEGRAM_BOT_TOKEN);
  fs.mkdirSync('.tools', {recursive: true});
  const lock = '.tools/telegram-dev.lock';
  // Do not run two pollers for the same project. A stale lock can be removed manually.
  startupStage = 'local lock: stop the running bot; if it is stopped, remove .tools/telegram-dev.lock';
  const descriptor = fs.openSync(lock, 'wx');
  fs.writeFileSync(descriptor, String(process.pid));fs.closeSync(descriptor);
  try {
    startupStage = 'Telegram connection and bot identity';
    const bot = await api('getMe', {}, stopping.signal);
    if (bot.username?.toLowerCase() !== 'amwed_bot') throw new Error('Unexpected bot');
    startupStage = 'webhook configuration: polling requires no active webhook';
    const webhook = await api('getWebhookInfo', {}, stopping.signal);
    if (webhook.url) throw new Error('Webhook exists; polling refused');
    if (process.argv.includes('--check')) {console.log('Telegram configuration is valid: @amwed_bot, no webhook; no messages sent and no updates consumed.');return;}
    const setup = process.argv.includes('--setup');
    if(!setup) {
      startupStage = 'local DATABASE_URL and migrations: start Docker and run db:migrate:dev';
      await transaction(client=>client.query('SELECT id FROM rsvps LIMIT 0'));
    }
    const handle = createTelegramHandler({allowedIds, environment, setup: process.argv.includes('--setup'),
      runAdmin: async ({userId}) => 'Режим настройки. Ваш Telegram user ID: '+userId+'. ID уже разрешён. Для администрирования запустите telegram:dev.'});
    startupStage = 'local polling state';
    const state = '.tools/telegram-dev-offset.json';
    let offset = 0;
    if (fs.existsSync(state)) {
      const saved = JSON.parse(fs.readFileSync(state, 'utf8'));
      if (!Number.isSafeInteger(saved.offset) || saved.offset < 0) throw new Error('Invalid polling state');
      offset = saved.offset;
    }
    startupStage = 'development polling';
    const replies = new Map();
    console.log('Telegram development polling started. Private chats only. Token and message contents are never logged.');
    console.log(process.argv.includes('--setup') ? 'Setup: send /start to @amwed_bot to receive your own user ID.' : 'Whitelist mode: only allowed user IDs can reach admin commands.');
    while (!stopping.signal.aborted) {
      let updates;
      try { updates = await api('getUpdates', {offset, timeout: 20, allowed_updates: ['message', 'callback_query']}, stopping.signal); }
      catch (error) {
        if (stopping.signal.aborted) break;
        if (error.code === 401 || error.code === 409) throw error;
        console.error('Telegram polling temporarily unavailable; retrying without logging request details.');
        await pause(5000, undefined, {signal: stopping.signal});continue;
      }
      if(!setup)await drainOutbox();
      for (const update of updates) {
        if (!Number.isSafeInteger(update.update_id) || update.update_id < offset) continue;
        const sender=updateSender(update);
        let reply=null;
        if(!setup && sender && allowedIds.has(sender)){
          await transaction(client=>handleAdminUpdate(client,update,allowedIds));
          if(update.callback_query){
            try{await api('answerCallbackQuery',{callback_query_id:update.callback_query.id},stopping.signal);}catch{/* Safe to retry admin output through outbox. */}
          }
        }else reply=await handle(update);
        if (reply) {
          const now = Date.now();
          // Bound diagnostic replies and memory; no user names or messages are persisted.
          for (const [id, last] of replies) if (now - last > 60000) replies.delete(id);
          if (!reply.diagnostic || (!replies.has(reply.chatId) && replies.size < 1000)) {
            replies.set(reply.chatId, now);
            try { await api('sendMessage', {chat_id: reply.chatId, text: reply.text, protect_content: true}, stopping.signal); }
            catch { if (!stopping.signal.aborted) console.error('Telegram reply could not be delivered; details hidden.'); }
          }
        }
        offset = update.update_id + 1;
        const temporary = state + '.tmp';
        fs.writeFileSync(temporary, JSON.stringify({offset}));fs.renameSync(temporary, state);
        if(!setup)await drainOutbox();
      }
    }
  } finally { fs.unlinkSync(lock); }
}
main().catch(error => {
  if (stopping.signal.aborted) return;
  // Only constant, non-sensitive diagnostics; never print error.message or error.stack.
  if (error instanceof TelegramApiError && error.code === 401) console.error('Telegram authentication failed. Check the local token without sharing it.');
  else if (error instanceof TelegramApiError && error.code === 409) console.error('Another poller or webhook is active. Stop it before development polling.');
  else console.error('Telegram failed at: ' + startupStage + '. Sensitive details hidden.');
  process.exitCode = 1;
});
