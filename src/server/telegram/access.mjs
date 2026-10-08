// Server-side policy. Call only for updates received directly from the Telegram Bot API.
if (typeof window !== 'undefined') throw new Error('Telegram policy is server-only');
export function parseAllowedUserIds(value = '') {
  if (!value.trim()) return new Set();
  const ids = value.split(',').map(id => id.trim());
  if (ids.some(id => !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))))
    throw new Error('Invalid TELEGRAM_ALLOWED_USER_IDS; use comma-separated numeric user IDs');
  return new Set(ids);
}
export function privateSender(message) {
  const user = message?.from;
  if (message?.chat?.type !== 'private' || user?.is_bot !== false ||
      !Number.isSafeInteger(user.id) || user.id <= 0 || message.chat.id !== user.id) return null;
  return String(user.id);
}
export function assertTelegramAdmin(message, allowedIds) {
  const id = privateSender(message);
  if (!id || !allowedIds.has(id)) throw new Error('Telegram admin access denied');
  return id;
}
export function createTelegramHandler({allowedIds, setup = false, environment = 'development', runAdmin}) {
  if (setup && environment !== 'development') throw new Error('Telegram setup is development-only');
  return async function handle(update) {
    const message = update?.message;
    const id = privateSender(message);
    // Groups, callbacks, edits, channel posts and bot messages cannot reach admin dispatch.
    if (!id || typeof message.text !== 'string') return null;
    const command = message.text.trim().split(/\s+/)[0].toLowerCase();
    const start = command === '/start' || command === '/start@amwed_bot';
    if (!allowedIds.has(id)) {
      if (setup && start) return {chatId: message.chat.id, diagnostic: true,
        text: 'Ваш Telegram user ID: ' + id + '. Передайте его организатору для TELEGRAM_ALLOWED_USER_IDS. Доступ к данным RSVP закрыт.'};
      return {chatId: message.chat.id, diagnostic: true, text: 'Доступ закрыт. Для настройки обратитесь к организатору.'};
    }
    assertTelegramAdmin(message, allowedIds);
    // Every present or future admin command enters through this gate, never through setup.
    const text = await runAdmin({userId: id, message});
    return {chatId: message.chat.id, diagnostic: false, text};
  };
}
