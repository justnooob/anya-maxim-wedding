# Telegram development flow

Бот: @amwed_bot. Только локальный отдельный Node.js процесс; frontend и публичные API не получают токен. RSVP и admin теперь подключены к PostgreSQL: настройка в STAGE_B_DEPLOYMENT.md. Команда setup работает без БД.

## Настройка организаторов

1. Создайте локальный файл .env.local, если его ещё нет. Он исключён из Git. Запишите TELEGRAM_BOT_TOKEN локально, без публикации или пересылки в чат. TELEGRAM_ALLOWED_USER_IDS сначала оставьте пустым. Названия переменных и пустой шаблон находятся в .env.example. Не используйте NEXT_PUBLIC_ для этих переменных.
2. В папке проекта выполните npm run telegram:check. Эта команда проверит доступ к нужному боту и отсутствие webhook, не отправляя сообщений и не подтверждая updates.
3. Выполните npm run telegram:setup. Каждый организатор открывает https://t.me/amwed_bot и отправляет /start в личном чате. Бот отвечает только его собственным числовым user ID и диагностикой настройки. Не ищите ID по username, имени или пересланному сообщению.
4. Скопируйте полученные ID в TELEGRAM_ALLOWED_USER_IDS в .env.local, через запятую. Не добавляйте посторонние ID. Бот никогда не включает пользователей в whitelist автоматически.
5. Остановите setup через Ctrl+C, затем запустите npm run telegram:dev. Изменения .env.local вступают в силу только после перезапуска процесса. Разрешённым пользователям бот подтвердит доступ; остальным отправит только отказ. В dev доступны /stats, /list, детали и удаление с подтверждением; нужна локальная PostgreSQL и миграции.

## Границы доступа

Пустой whitelist запрещает admin всем. Ошибка формата ID останавливает запуск, а не открывает доступ. Проверка выполняется по message.from.id, при совпадении приватного chat.id и user ID. Группы, channel posts, сообщения ботов, edited messages и callback queries проверяются отдельным admin-обработчиком по numeric from.id, private chat и whitelist. Перед каждым вызовом runAdmin применяется assertTelegramAdmin. Будущие admin-команды должны проходить этот обработчик. Эти функции можно вызывать только для updates, полученных непосредственно от Telegram API; нельзя доверять JSON из публичного запроса или использовать user ID как самостоятельную авторизацию веб-админки. Callback queries обрабатываются в src/server/telegram/admin.mjs; web login не используется.

Setup разрешён только в development. Пустой whitelist в setup даёт только диагностические ответы, setup не показывает сведения о гостях или RSVP. Настройка не сохраняет имена, сообщения или user IDs на диск. Для защиты от повторов сохраняется только polling offset в исключённом из Git .tools/telegram-dev-offset.json. Диагностические ответы ограничены одним ответом в минуту на пользователя.

## Ошибки и секреты

Не выводить переменные окружения, raw errors, HTTP URLs или ответы Telegram API: URL Bot API содержит секрет. Обёртка скрывает raw exception, cause, response description и stack. Запросы идут только на фиксированный HTTPS origin Telegram, без redirects. Ошибки логируются только фиксированными безопасными сообщениями.

Polling не удаляет и не меняет webhook. Если webhook уже настроен или другой poller работает, остановите их отдельно перед локальной настройкой. Локальный lock исключает второй процесс проекта. Если процесс был принудительно завершён, убедитесь, что он больше не работает, и удалите только .tools/telegram-dev.lock. Не удаляйте lock работающего процесса.

## Проверки

- npm run test:telegram
- npm run check:secrets
- npm run typecheck
- npm run build

Тесты автономные, используют синтетические значения и не обращаются к Telegram. Реальный token не требуется для тестов. Secret checker распознаёт также формат Telegram bot token. Полные Stage B проверки: npm test и npm run test:postgres (локальный Docker).

Основание протокола: https://core.telegram.org/bots/api#getupdates и https://core.telegram.org/bots/api#user.

## Production
Постоянный бот работает в отдельном приложении Amvera с APP_ROLE=bot (npm run telegram:production). Не запускайте локальный poller с тем же токеном одновременно с production. Используйте отдельного тестового бота/окружение для дальнейшей разработки либо временно остановите production worker. Инструкция: STAGE_B_DEPLOYMENT.md. Webhook больше не нужен.
