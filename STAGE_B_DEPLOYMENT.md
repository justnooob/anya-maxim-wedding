# Stage B: PostgreSQL, RSVP и Telegram

Текущий production URL: https://anya-maxim-wedding-justnooob.amvera.io.
Настройки аккаунта Amvera выполняет владелец вручную. Build: npm run build без подключения к БД. Runtime: npm run start:amvera сначала применяет pending migrations, затем запускает Next.js на порту 3000. Терминал контейнера не требуется.

## Environment variables в Amvera

Добавить именно в runtime Variables приложения, без NEXT_PUBLIC_:

| Переменная | Значение |
| --- | --- |
| DATABASE_URL | postgresql://weddinguser:<PASSWORD>@amvera-justnoob-cnpg-wedding-db-rw:5432/wedding |
| PUBLIC_SITE_URL | https://anya-maxim-wedding-justnooob.amvera.io |
| TELEGRAM_BOT_TOKEN | Реальный токен @amwed_bot, только в Variables |
| TELEGRAM_ALLOWED_USER_IDS | Два ранее определённых числовых user ID, через запятую |
| TELEGRAM_WEBHOOK_SECRET | Новый случайный секрет: минимум 32 символа, буквы/цифры/дефис/подчёркивание |
| NODE_ENV | production, если платформа не выставляет автоматически |

PASSWORD выше является заглушкой. Пароль URL-encode, если есть @, :, /, %, # и другие специальные символы. Не помещать реальное значение в Git, чат, скриншот или команды. Для internal PostgreSQL использовать предоставленный internal host. SSL не отключается принудительно; если хостинг требует SSL, используйте соответствующие параметры в DATABASE_URL и доверенный CA, без rejectUnauthorized:false.

Для создания webhook secret удобно использовать менеджер паролей. Его значение не нужно публиковать. DEV_POSTGRES_PASSWORD требуется только локальному Docker, в production не добавлять.

## Deployment без runtime-terminal Amvera

1. Локально выполнить проверки и подготовить commit:

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run check:secrets
```

2. В панели Amvera вручную добавить все runtime Variables из таблицы выше. Реальный DATABASE_URL нужен только приложению при старте. Build-stage не требует ни БД, ни Telegram secrets. Не добавлять db:migrate в build commands.
3. Выполнить commit и push самостоятельно. В Amvera запустить обновление приложения из нового commit. Если в панели есть вручную заданная команда запуска, привести её к npm run start:amvera. amvera.yml уже содержит эту команду, containerPort остаётся 3000.
4. При старте команда db:migrate сама применит только pending SQL migrations. Все миграции и журнал schema_migrations фиксируются одной транзакцией под PostgreSQL advisory lock. Повторный restart пропускает применённые файлы, сохраняет RSVP и не выполняет reset. Checksum запрещает изменение применённого файла. Если БД недоступна, конфигурация отсутствует или миграция не прошла, Next.js не запускается. Исправить Variables/доступность БД и перезапустить приложение через панель. Не редактировать старые migrations: изменения оформлять новым SQL-файлом.
5. Проверить успешный старт в логах Amvera: Migrations completed, затем запуск Next.js. Открыть публичный сайт. Для новой схемы не нужна ручная команда в контейнере. При zero-downtime обновлении предыдущий процесс может оставаться доступным до готовности нового; будущие миграции должны быть совместимы с предыдущей версией приложения.
6. Остановить локальный npm run telegram:dev через Ctrl+C. В локальном исключённом из Git .env.local оставить TELEGRAM_BOT_TOKEN и добавить тот же TELEGRAM_WEBHOOK_SECRET, что указан в Amvera. Задать:

```dotenv
PUBLIC_SITE_URL=https://anya-maxim-wedding-justnooob.amvera.io
```

DATABASE_URL для регистрации webhook не нужен. Не копировать внутренний production DATABASE_URL на локальный компьютер. PUBLIC_SITE_URL также используется локальным RSVP, поэтому при возврате к локальной разработке заменить его на http://localhost:3000; webhook на production этим не меняется.

7. Из корня проекта **на своём компьютере**, с Node.js 20.9+ и установленными зависимостями, выполнить:

```sh
npm run telegram:webhook
```

Команда загружает .env.local, проверяет HTTPS и identity @amwed_bot, затем регистрирует URL:

```text
https://anya-maxim-wedding-justnooob.amvera.io/api/telegram/webhook
```

Токен/secret не выводятся; ожидающие updates не удаляются. Команда требует исходящий HTTPS к Telegram, не доступ к Amvera shell или PostgreSQL. Повторная регистрация с теми же значениями допустима. При изменении secret обновить его и в Amvera, и локально, перезапустить приложение и повторить команду. После регистрации не запускать polling с этим же ботом.
8. Endpoint принимает POST и проверяет X-Telegram-Bot-Api-Secret-Token до чтения payload или обращения к БД. Отсутствующий/неверный header даёт 403; отсутствующая/невалидная серверная настройка secret даёт 503. Обычное открытие URL через GET не является проверкой webhook.
9. С обоих разрешённых аккаунтов отправить /start и /stats. Сделать тестовый RSVP на публичном сайте, проверить уведомления обоим организаторам и данные в боте. Удалить тестовую запись через подтверждение, обновить форму в той же вкладке со старой cookie и заполнить её снова. Проверить отказ от участия и недоступность admin для постороннего аккаунта.

## Development через Docker Compose

Установить/запустить Docker Desktop с Linux containers. Создать .env.local из .env.example, сохранив существующие Telegram secrets и whitelist.
Вручную установить DEV_POSTGRES_PASSWORD и DATABASE_URL для **локальной** БД:

```text
postgresql://weddinguser:<LOCAL_PASSWORD>@localhost:5432/wedding
```

PUBLIC_SITE_URL=http://localhost:3000. Пароли должны совпадать; специальные символы в URL кодировать.

```sh
docker compose --env-file .env.local up -d
npm run db:migrate:dev
npm run dev
```

В другом терминале npm run telegram:dev. Для определения новых ID команда telegram:setup работает без БД. Если у того же бота уже production webhook, используйте отдельного development-бота только после соответствующей настройки identity check; не удаляйте production webhook для локальных тестов.

```sh
npm run typecheck
npm run lint
npm test
npm run test:postgres
npm run check:secrets
npm run build
```

npm test выполняет SQL и API-тесты на PGlite, PostgreSQL-движке WASM. npm run test:postgres выполняет те же интеграционные сценарии на настоящем локальном PostgreSQL через pg, в отдельной временной schema. Он запрещён для production и нелокального host, временная schema удаляется после теста. Docker test не меняет гостевые записи wedding.

## Модель данных и гарантии

SQL migrations являются источником DDL. Drizzle schema описывает те же таблицы; runtime-запросы параметризованы через pg, все связанные изменения транзакционные. Не запускать schema push поверх production.

- guest_sessions: hash случайного токена, timestamps и expires_at. Cookie HttpOnly, SameSite=Lax, Secure и __Host- в production; не содержит имени гостя.
- rsvps: явные ограничения attendance, длины текста, вариантов логистики и dress code. UNIQUE session_id предотвращает второй ответ из той же сессии. Повторная отправка возвращает первый ответ, не редактирует его и не дублирует уведомления.
- После удаления rsvps cookie продолжает идентифицировать сессию, но больше не блокирует новую запись: сервер проверяет существование RSVP в PostgreSQL при каждом обращении. Форма перепроверяет статус при возврате в вкладку и раз в 30 секунд на экране подтверждения.
- CSRF требует разрешённый Origin и отдельный токен сессии; JSON ограничен по размеру. Rate limits хранятся в PostgreSQL, IP сохраняется только в виде hash.
- telegram_updates предотвращает повторное выполнение одного update. delete_confirmations хранит одноразовые подтверждения; проверяется Telegram numeric from.id, private chat и whitelist, также для callbacks.
- telegram_outbox фиксируется вместе с RSVP. Worker в процессе Next.js проверяет очередь каждые 10 секунд. Несколько экземпляров используют FOR UPDATE SKIP LOCKED. Ошибка Telegram не откатывает RSVP: уведомление повторяется с задержкой до часа. Отправленные payload удаляются. После удаления RSVP несостоявшиеся уведомления о нём удаляются каскадно.
- Доставка Telegram имеет семантику at least once: при аварии после доставки, но до commit возможен повтор сообщения. Дубликат RSVP или повтор удаления при этом исключён.
- Отправка требует разрешённых recipient IDs; при отзыве ID задания для него удаляются. Очередь, статистика и ответы не зависят от Telegram как хранилища.
- Гость без существующей cookie может отправить новый ответ: это приглашение без guest accounts, не идентификация человека по имени. Уникальность относится к сессии браузера.

## Границы проверки

Docker Desktop в окружении реализации недоступен: npm run test:postgres и реальное соединение с Amvera выполняет владелец после настройки. Проверки PGlite не заменяют проверку PostgreSQL TCP, сети Amvera, SSL и production webhook. Настройки аккаунта, push/deploy, реальные миграции Amvera и webhook не выполнялись агентом. PDF не подключён.

Протокол: https://core.telegram.org/bots/api#setwebhook, транзакции: https://node-postgres.com/features/transactions.

## Напитки в RSVP
Добавлена миграция 002_rsvp_drinks.sql. Миграции 002 и 003 применяются автоматически командой start:amvera при обновлении или перезапуске приложения. Старые ответы сохраняются с пустыми списками напитков. Выбор напитков необязателен; свой вариант требует названия до 120 символов. Отказ от алкоголя/безалкогольного исключает другие варианты своей группы. Значения видны в Telegram в деталях и уведомлениях.

## Безопасная диагностика миграций
Перед DDL выполняется SELECT 1. Успех: Database connection established. При ошибке выводятся name, code, message, stage и filename, если известен файл. Этапы: connection, metadata table, checksum, applying migration. Сообщение нормализуется по известным SQLSTATE/сетевым кодам: произвольный текст PostgreSQL не выводится, поскольку может содержать пароль или данные строк. Неизвестное сообщение скрывается; stack, detail, SQL, параметры и значения environment variables не печатаются. Ошибка checksum требует проверки версии файла, а не reset БД. Для диагностики следующего deployment достаточно этой безопасной строки лога.
