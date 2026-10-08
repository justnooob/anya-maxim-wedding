# Production: два приложения Amvera, одна PostgreSQL

Один GitHub repository: justnooob/anya-maxim-wedding. Один amvera.yml.
Новый repository, отдельная кодовая база и runtime-terminal не нужны.

## Роли и запуск

- anya-maxim-wedding: APP_ROLE=web. Next.js, RSVP API, Mini App /telegram. Записывает уведомления в PostgreSQL outbox, не запускает Telegram worker.
- anya-maxim-wedding-bot: APP_ROLE=bot. Постоянный long polling и отправка outbox. Самостоятельная команда: npm run telegram:production.
- Общее хранилище: существующая wedding-db, база wedding.

amvera.yml запускает npm run start:amvera. Dispatcher выбирает роль только в runtime. По умолчанию web, чтобы сохранить существующий запуск сайта. Для bot он запускает тот же entrypoint scripts/telegram-production.mjs, что npm run telegram:production. Next.js в bot-процессе не запускается. containerPort остаётся 3000: в bot это только /healthz, не webhook и не admin API. Публичный домен для worker не нужен.

Оба приложения собираются npm run build без secrets и DATABASE_URL. Оба применяют pending migrations при runtime startup: PostgreSQL advisory lock и checksum предотвращают конфликт и повторное применение. Существующие migration-файлы не изменены. Новая 005_telegram_polling.sql хранит durable offset. Reset не выполняется.

## Runtime Variables / Secrets

| Переменная | Website | Bot worker |
| --- | --- | --- |
| APP_ROLE | web | bot |
| NODE_ENV | production | production |
| DATABASE_URL | существующая wedding-db | тот же URL wedding-db |
| PUBLIC_SITE_URL | https://anya-maxim-wedding-justnooob.amvera.io | тот же URL сайта |
| TELEGRAM_BOT_TOKEN | токен @amwed_bot | тот же токен |
| TELEGRAM_ALLOWED_USER_IDS | два числовых ID через запятую | те же два ID |

DATABASE_URL и TELEGRAM_BOT_TOKEN добавлять как secrets без NEXT_PUBLIC_. Website нужен токен для проверки подписанных Telegram initData; whitelist применяется при каждом Mini App запросе и при создании outbox. Worker также проверяет whitelist перед обработкой команд и перед отправкой.

Шаблон DATABASE_URL: postgresql://weddinguser:<PASSWORD>@amvera-justnoob-cnpg-wedding-db-rw:5432/wedding. Реальный пароль вносится только вручную в Variables/Secrets; специальные символы пароля URL-encode. SSL certificate verification не отключать.
TELEGRAM_WEBHOOK_SECRET не нужен ни одному приложению, старую переменную можно удалить. DEV_POSTGRES_PASSWORD нужен только локальному Compose.

## Deployment без shell контейнера

1. Остановить локальный telegram:dev / telegram:setup, если запущен. Один токен не должен одновременно обслуживаться локальным и облачным poller.
2. Добавить/проверить Variables существующего website, APP_ROLE=web. Пользователь самостоятельно делает commit/push после ревью. Обновить website новым commit: дождаться Migrations completed и старта Next.js. Старый /api/telegram/webhook теперь отвечает 410 без обработки данных.
3. В Amvera создать ресурс типа Приложение с именем anya-maxim-wedding-bot. Выбрать постоянно работающий тариф и одну реплику, не cron job. Не создавать новую БД.
4. Подключить то же GitHub repository и ту же production-ветку, что у website. Использовать существующий amvera.yml из репозитория, не создавать расходящиеся конфигурации/ветки. Во вкладке «Репозиторий» второго приложения выбрать GitHub, подключить доступ к justnooob/anya-maxim-wedding и выбрать текущую production-ветку. Настройка интеграции GitHub выполняется отдельно для второго приложения. Не удалять интеграцию website. GitHub deployment webhook относится только к доставке кода и не является Telegram webhook. Если панель предлагает создание собственного amvera.yml, использовать уже существующий файл.
5. До запуска добавить bot Variables из таблицы, особенно APP_ROLE=bot. Без неё запустится website. Команда в общем файле остаётся npm run start:amvera и автоматически выбирает worker. При использовании ручной команды вместо общего dispatcher укажите npm run telegram:production.
6. Собрать/запустить приложение. Проверить логи: Database connection established. Migrations completed.; затем Production bot polling started. Mini App: anya-maxim-wedding-justnooob.amvera.io/telegram.
7. Worker сам вызывает deleteWebhook с drop_pending_updates=false. Не выполнять telegram:webhook: старая команда теперь безопасно отказывается регистрировать webhook. Настройки BotFather для polling не нужны.
8. Оставить website, worker и PostgreSQL включёнными. Работа продолжается на серверах Amvera при выключенном компьютере. /healthz worker показывает starting / standby / polling / reconnecting / stopping, без данных гостей. HTTP 200 означает живой процесс, а не гарантию доступности Telegram; состояние polling и ответ на /stats проверять отдельно.

Официальная настройка GitHub: https://docs.amvera.ru/applications/git/webhooks.html. Концепция одного типа процесса на приложение: https://docs.amvera.ru/applications/configuration/heroku-migration.html.

## Mini App и BotFather

URL Mini App: https://anya-maxim-wedding-justnooob.amvera.io/telegram.
PUBLIC_SITE_URL задаётся как origin сайта без /telegram. Кнопка /start добавляет этот путь сама. Она открывает Mini App через Telegram web_app, а не обычную URL-кнопку. Обязательных дополнительных настроек BotFather нет.
Опционально в BotFather через /setmenubutton выбрать @amwed_bot, указать этот HTTPS URL и подпись «Гости», чтобы Mini App открывался также из меню. Whitelist защищает API независимо от видимости кнопки. Посторонний /start игнорируется, данные не раскрываются.
Telegram initData проверяются server-side: HMAC, срок до часа и whitelist. После часа закрыть и открыть Mini App заново. Открытие ссылки в обычном браузере не даёт admin-доступ.

## Надёжность

getUpdates использует long polling timeout 20 секунд. Временные ошибки Telegram/сети повторяются с exponential backoff и jitter до примерно 30 секунд; сырые ошибки/URLs/secrets не печатаются. Ошибки конфигурации надо исправлять в Variables.
Один production worker владеет session advisory lock PostgreSQL. Второй экземпляр ждёт standby; при завершении/потере соединения lock освобождается. Heartbeat потери БД прерывает polling и доставку перед переподключением. SIGTERM/SIGINT прерывают запросы и задержки, ожидают текущие транзакции, закрывают соединения; предельное завершение 25 секунд.
Offset, admin-действие и ответ outbox сохраняются одной транзакцией. Повтор update не повторяет удаление или команду. Непрошедшие whitelist updates пропускаются с продвижением offset. Старый webhook endpoint больше не принимает команды.
RSVP и outbox фиксируются вместе. Независимый delivery loop проверяет очередь примерно каждую секунду; ошибка доставки откладывает retry (30 секунд с ростом до часа). При остановленном worker RSVP сохраняются, очередь ждёт его возврата. Доставка at least once: при аварии после отправки Telegram, но до DB commit возможен повтор уведомления. Telegram хранит ещё не полученные updates не более 24 часов, поэтому длительная остановка может потерять старые команды, но не RSVP в PostgreSQL.

## End-to-end проверка

1. С обоих whitelist аккаунтов отправить /start: есть кнопка Mini App; /stats отвечает.
2. В Mini App проверить списки/фильтры/детали. Вне Telegram и с постороннего аккаунта доступ к данным закрыт.
3. На публичном сайте отправить Приду со всеми обязательными полями, напитками и музыкой. Проверить уведомление обоим организаторам и запись в Mini App. Проверить также Не приду: только релевантные поля.
4. Удалить тестовый RSVP с подтверждением. В том же браузере/со старой cookie снова заполнить форму.
5. Перезапустить worker в Amvera. Проверить /stats и сохранность записей. Проверить отсутствие постоянного Telegram 409 (обычно второй poller).
6. Временно остановить только worker, отправить RSVP на сайте, затем включить worker: уведомление из очереди должно прийти, запись уже есть в БД.
7. Выключить локальный компьютер и с телефона повторить /stats, Mini App и тестовый RSVP. Всё работает через Amvera.

## Локальная разработка и проверки

.env.local исключён из Git. Локальная PostgreSQL: docker compose --env-file .env.local up -d; затем npm run db:migrate:dev. Для production worker не используется --env-file: значения приходят от Amvera.
Проверки: npm run typecheck, npm run lint, npm test, npm run build, npm run check:secrets. npm run test:postgres требует локальный Docker/PostgreSQL; PGlite тесты не проверяют реальную сеть Amvera. Реальный запуск двух облачных приложений и Telegram E2E выполняет владелец после deployment. Агент не меняет Amvera и не делает push.
