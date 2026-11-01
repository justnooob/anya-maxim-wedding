# Подготовка production-релиза, 01.11.2026

**Production-релиз НЕ выполнен.** Код подготовлен локально; запуск приложений, production migrations, изменение DNS и push заблокированы отсутствием подтверждённого доступа к Amvera/БД и проверенного восстановления резервной копии. Computer Use по просьбе владельца исключён. Ни одна реальная RSVP-запись не создана, не изменена и не удалена.

## 1. Готово

### Код и релизная ветка

- Репозиторий `justnooob/anya-maxim-wedding`, единственный remote `origin` на GitHub. Удалённая основная ветка `main`; на момент проверки её HEAD `d002b32c48ac8011716a6f3f39f58b3221276c3b` совпадал с исходным локальным HEAD.
- Подготовлена локальная ветка `codex/production-release-2026-11-01`. В неё входят накопленные изменения сайта, контента, motion, фото, календаря, FAQ, Wishlist, PDF, RSVP и Mini App, тесты и отчёты. Отдельный проект/репозиторий не создавался. Релизный коммит идентифицируется командой `git log -1 --oneline codex/production-release-2026-11-01`.
- Новые финальные портреты: Максим из последнего присланного файла, Аня из второго фото предыдущего сообщения. Локальные оптимизированные WebP в `public/images/guests/couple/`; имена, подписи, наклоны, desktop/mobile композиция сохранены.
- Дата 17.07.2027, церемония 15:30, банкет 16:00 сохранены. На сайте «Аня & Максим», в PDF «АННА & МАКСИМ».
- PDF использует сохранённые ответы гостевой сессии, 14 pt, настоящий Montserrat SemiBold 600 для label/colon и Regular 400 для значений. Ссылки, QR `https://anyaxmaxim.ru`, приватный endpoint и динамическая пагинация сохранены.

### Исправление согласий

- `venueRulesAccepted` — отдельный обязательный boolean для GOING; не является подтверждением дресс-кода. Строки `"true"`, числа, отсутствие и `false` отклоняются сервером.
- Клиент передаёт отдельные `dressCodeConfirmed` и `venueRulesAccepted`. Существующий `dressCode` сохранён как совместимый алиас; явный `dressCodeConfirmed:false` нельзя обойти через `dressCode:true`.
- NOT_GOING требует только имя и выбор участия: оба согласия нормализуются в false, время/версия venue consent не записываются.
- Подготовлена **015_venue_rules_consent.sql**: nullable `venue_rules_accepted`, `venue_rules_accepted_at`, `venue_rules_version`. У исторических записей остаётся NULL; ни UPDATE, ни фиктивного backfill нет. Существующее `dress_code` не переименовано и не изменено.
- Время согласия выставляет PostgreSQL, версию `2026-11-01` выбирает сервер. Значения времени/версии из body не принимаются. Повторный idempotent submit не меняет первое сохранённое согласие.
- Mini App/детали бота показывают согласие, версию и московское время. При NULL показывается «Нет сохранённого подтверждения». Для отказавшихся эти поля не выводятся.

### Runtime и безопасность

- Next.js и eslint-config-next обновлены с 16.3.8 до **16.4.3**. Устранены critical/high advisories Next.js; совместимым обновлением исправлен high advisory Zod.
- `npm audit --omit=dev`: **0 уязвимостей**. Полный audit: **16 moderate**, только dev/lint-цепочка minimatch. Автоматический `--force` с несовместимым downgrade ESLint не применялся.
- Архитектура сохранена: сайт + RSVP API + Mini App в web-приложении; отдельный постоянный polling worker; общая PostgreSQL; уведомления через transactional outbox; whitelist и подпись initData проверяются сервером.
- `amvera.yml`: build `npm run build`, runtime `npm run start:amvera`, containerPort **3000**, `/data` сохранён. Build не запускает миграции и не требует production DB. Runtime dispatcher применяет pending migrations перед Next; bot использует существующий `telegram:production`. Advisory locks/checksums и graceful shutdown сохранены.
- Добавлен opt-in `WISHLIST_IMPORT_ON_START=1` только для web. После миграций запускает существующий идемпотентный импорт утверждённого каталога, чтобы не требовался runtime-terminal Amvera. По умолчанию выключен. Если каталог непустой, но provenance marker отсутствует, импорт **отказывается** работать и откатывает marker вместо дублирования чужих записей. Существующие marker, изменения организаторов, архивы и брони сохраняются.
- `.env.local`, credentials, `.tools`, `.next`, локальная БД, logs, QA captures и сгенерированные PDF исключены из Git. Релизный secret scan не выводит значения совпадений.

### Выполненные проверки

- **210 unit/integration tests проходят**, включая consent, сохранность legacy rows при миграции, idempotency, максимум 5, concurrent submit, удаление, изоляцию сессий/PDF, Telegram auth, outbox и Wishlist race/seed safeguards.
- Typecheck, lint, production build Next.js 16.4.3, secret scan и `git diff --check` проходят. Первоначальная ошибка дублирования import/version и неверная категория в новом тесте исправлены до итогового прохода.
- Итог Chrome/WebKit: **93 уникальных сценария проходят** (75 Chrome, 18 WebKit). Первый полный прогон: 87 passed, 6 failed. Причины шести: замена двух портретов и ожидание 15 approved photos вместо 17 с парой. После просмотра actual/diff и проверки границ изменений обновлены ровно 10 portrait-only baselines; повторный прогон 6 затронутых сценариев и усиленного consent payload test: 7 passed. Неизменённые 87 не запускались повторно. Тесты работают только с изолированным QA proxy/PGlite, без production DB/Telegram.
- Настоящий Docker/native PostgreSQL integration отдельно не запускался: Docker, pg_dump/pg_restore/psql и локальный PostgreSQL отсутствуют. SQL/integration проверены на PGlite; это не проверка сети/backup Amvera.
- Проверены read-only Telegram `getMe` и `getWebhookInfo`: токен действителен для `@amwed_bot`, whitelist содержит 2 корректных ID, webhook отсутствует. Токен и сами ID не выводились. Polling не запускался локально, чтобы не конфликтовать с production worker.
- Дополнительно проверены 16 файлов фактического `.next/static`: значения текущих token, webhook secret и DATABASE_URL в клиентский bundle не попали.

## 2. Не выполнено из-за ограничений доступа

### Amvera и база

- CLI Amvera и его авторизованная конфигурация не обнаружены, API credentials отсутствуют. Панель не использовалась. Не подтверждены фактические имена/статусы ресурсов, тариф, баланс, переменные, регион, storage, replica count, логи и deploy revision.
- Исторически в проекте упоминались web `anya-maxim-wedding`, worker `anya-maxim-bot-m1` в Moscow-1 и PostgreSQL `wedding-db`. Это **ориентиры для поиска**, а не подтверждение существования/запуска этих ресурсов сейчас. Новые приложения и базы не создавались.
- Локальная конфигурация БД указывает базу `wedding`, порт 5432 и внутренний host `cnpg-wedding-db-rw`. Read-only подключение из текущего окружения завершилось `ENOTFOUND`: внутренний адрес не разрешается с компьютера. Это не доказывает, что кластер не работает.
- Не прочитаны production schema_migrations, schema и RSVP counts. Backup не создан, не скачан и не восстановлен. **Production migrations не запускались.** Неизвестно, какие из 001–014 уже применены; 015 требуется новой версии. Старые migration-файлы не переписаны.
- Startup web и worker сам применяет pending migrations. Поэтому нельзя включать новую версию до backup review, даже «просто проверить запуск».

### Доставка кода

- GitHub API подтвердил **4 активных push-webhook Amvera**: 2 на `webhook.git.msk0.amvera.ru`, 2 на `webhook.msk1.amvera.ru`. GitHub Actions workflows отсутствуют.
- Точные приложения, регионы и ветки фильтруются на стороне Amvera, недоступной этому окружению. Публикация main или произвольной ветки без проверки может запустить нежелательные сборки/миграции. Ни webhook, ни настройки GitHub не менялись.
- **Push не выполнялся**, опубликованных релизных веток/коммитов нет. Force push/reset не использовались. Локальный релизный коммит не означает deploy.
- В истории коммита `86fdd4c1971a` обнаружен прежний непустой TELEGRAM_BOT_TOKEN в `.env.local`. Он не совпадает с текущим. Значение не выводилось. Первоначальную проверку automatic approval review отклонил без отдельного разрешения; после явного разрешения владельца выполнен **один** getMe: Telegram вернул HTTP/error_code **401**, старый токен недействителен. Текущий токен проверен отдельно и действует. История не переписывалась; старый токен нельзя восстанавливать в Variables, менять действующий токен из-за этой исторической записи не требуется.

### Домен и smoke tests

- `https://anyaxmaxim.ru` ответил HTTP 200, заголовок HTML `anyaxmaxim.ru`; признаков свадебного приложения/Next.js в ответе не обнаружено. Это не подтверждение работающего свадебного сайта.
- Старый технический `https://anya-maxim-wedding-justnooob.amvera.io` недоступен из текущего окружения. Нынешний technical URL надо взять в Amvera, не угадывать.
- DNS A/NS запросы не дали проверяемого результата из текущей сети; никаких IP/CNAME/TXT значений не выдумывалось. Регистрация домена/доступ к REG.RU и привязка сертификата к wedding-приложению не проверены.
- Production RSVP, PDF, Mini App, statistics, notifications, /start и /stats не тестировались. Физические Android/iOS/macOS и работа бота при выключенном компьютере не проверены.

## 3. Мои действия: порядок ручного завершения

### Шаг A. Найти правильные ресурсы, пока не включать приложения

1. В Amvera выберите текущий регион (ориентир Moscow-1) и существующую группу. Найдите web, bot и PostgreSQL. Сверьте web по `APP_ROLE=web`, bot по `APP_ROLE=bot`, БД по имени `wedding`. Запишите их фактические имена и технический HTTPS URL web. Не создавайте дубликаты.
2. Проверьте баланс/тариф и один регион для web, bot и БД. Сохраните существующие тома и `/data`. Не включайте web/bot, пока не выполнен шаг B.
3. В каждом приложении откройте «Репозиторий»: проверьте GitHub `justnooob/anya-maxim-wedding`, целевую ветку и связь с конкретным webhook. В GitHub → repository Settings → Webhooks сравните 4 hook с нужными приложениями. Устаревшие связи выключайте только после идентификации; не удаляйте вслепую. Не выполняйте push, если остаются неизвестные автодеплои.

### Шаг B. PostgreSQL и пригодный backup — до миграций

1. Запустите **только существующий PostgreSQL**, дождитесь готовности. Во вкладке «Инфо»/«Домены» скопируйте текущий внутренний read/write host. Не используйте старый региональный адрес наугад.
2. Через уже имеющийся безопасный DB client/доступ проверьте identity, migration history и counts. Ниже только чтение; выполните запрос к ledger/RSVP после проверки существования таблиц:

```sql
SELECT current_database(), current_user, version();
SELECT to_regclass('public.schema_migrations'), to_regclass('public.rsvps');
SELECT name, checksum, applied_at FROM schema_migrations ORDER BY name;
SELECT count(*) AS rsvp_total,
       count(*) FILTER (WHERE attendance='yes') AS going,
       count(*) FILTER (WHERE attendance='no') AS not_going
FROM rsvps;
```

3. В PostgreSQL → «Бэкапы» нажмите «Создать бэкап», описание `before-release-2026-11-01`; дождитесь успешного завершения. Не удаляйте старые копии ради освобождения лимита без отдельного решения. Включите scheduled backups: после остановки кластера Amvera их отключает.
4. Проверьте восстановление в **изолированное тестовое хранилище**, не поверх `wedding`: нужны успешное восстановление schema/data, те же counts и readable migration ledger. Сам статус «backup создан»/список архива не заменяет restore test. Если штатное восстановление создаёт новый ресурс, сначала проверьте имеющиеся тестовые ресурсы и стоимость; удалять/заменять рабочую БД нельзя.
5. Если используете PostgreSQL client на своём компьютере, нужны действующий внешний POSTGRES hostname из Amvera и TLS с проверкой сертификата. Пароль вводится в prompt, не в command line. `pg_dump -Fc` создаёт копию, `pg_restore --list` проверяет архив, а `pg_restore --exit-on-error` в отдельную тестовую БД проверяет реальное восстановление. Файлы держать в ignored `backups/`, не Git.
6. Зафиксируйте дату/идентификатор копии и результат restore/count comparison. Пока этого нет, **не запускать `npm run db:migrate`, start:amvera или telegram:production на production**.

### Шаг C. Variables и конфигурация

| Runtime variable | Сайт | Bot |
| --- | --- | --- |
| APP_ROLE | web | bot |
| NODE_ENV | production | production |
| PORT | 3000 | 3000 |
| DATABASE_URL | существующая wedding, актуальный rw host/пароль | та же БД |
| PUBLIC_SITE_URL | временно действующий technical HTTPS origin; после подключения `https://anyaxmaxim.ru` | тот же web origin |
| TELEGRAM_BOT_TOKEN | существующий токен @amwed_bot | тот же токен |
| TELEGRAM_ALLOWED_USER_IDS | существующие два ID | те же два ID |
| WISHLIST_IMPORT_ON_START | 1 только после проверки catalogue/backup; иначе 0 | не нужен |

Токен и DATABASE_URL сохраняйте как secrets, без `NEXT_PUBLIC_`. Формат URL формируйте с URL-encoded паролем; значение не присылайте в чат. TELEGRAM_WEBHOOK_SECRET для production polling не нужен. Build variables/секреты не требуются. `containerPort` остаётся 3000.

Для Wishlist сначала проверьте `app_seed_history` и число `wishlist_items`. Пустой новый каталог можно заполнить утверждённым seed. При существующих marker повторный startup безопасен. Непустой каталог без marker требует отдельного разбора; не удаляйте записи/marker, чтобы обойти защиту.

### Шаг D. Публикация и запуск web, затем bot

1. Только после A–C проверьте, что выбранная ветка Amvera соответствует релизному коду и push не запускает старые приложения. При необходимости сначала отключите автоматический запуск worker до проверки web. С текущего компьютера подготовлена ветка `codex/production-release-2026-11-01`; её код надо доставить в выбранную ветку GitHub/Amvera **без force**. Если назначение hook/ветки не подтверждено, публикацию не выполнять.
2. Используйте существующую интеграцию GitHub во вкладке «Репозиторий». Альтернатива — штатный Git URL **этого же** приложения из панели; URL и deployment branch надо скопировать, не угадывать. GitHub push запускает сборку только при правильно настроенной интеграции.
3. Web: build `npm run build`; runtime `npm run start:amvera`. Миграции выполняются в runtime и записываются один раз в ledger; база не reset. Ожидаемые логи: `Database connection established`, список новых migrations, `Migrations completed`, Next ready. При checksum error остановитесь; не удаляйте ledger и не редактируйте применённые SQL.
4. Проверьте технический HTTPS URL сайта до включения bot. Сверьте RSVP counts с B, схему новых nullable колонок, сохранность legacy rows и отсутствие лишних дубликатов Wishlist. Сначала выполняйте неразрушающие проверки: главная, /wishlist, /venue-rules, calendar.ics, OG, запрет unsigned admin/PDF.
5. Bot: после исправного web включите существующий worker с `APP_ROLE=bot`. Общая команда `npm run start:amvera` выберет worker; прямая поддерживаемая команда **`npm run telegram:production`**. Должна работать одна replica. Закройте локальные telegram:dev/setup и устаревшие экземпляры. DB advisory lock защищает от конкуренции во время rolling restart.
6. Ожидается `Telegram getMe ok`, `webhook disabled`, `Production bot polling started`; `/healthz` показывает polling. `telegram:webhook` не запускать. В Telegram у двух организаторов проверить /start → кнопку Mini App и /stats. Polling/отправка outbox работают в Amvera, без компьютера, но это надо подтвердить после запуска.

### Шаг E. anyaxmaxim.ru и HTTPS

1. В **существующем web** → «Домены» → «Добавить доменное имя» → HTTPS, «Свой домен», ввести `anyaxmaxim.ru` без протокола, нижним регистром.
2. Скопировать **выданные именно этому приложению** A/TXT/другие необходимые записи. В REG.RU → домен → управление DNS добавить их у фактического DNS-провайдера. Значения A/AAAA/CNAME/TXT в этом отчёте отсутствуют намеренно: из текущей конфигурации они не получены. Если NS обслуживаются не REG.RU, менять записи нужно у этого NS-провайдера. Не удалять MX и посторонние записи вслепую.
3. Если подключаете ещё `www`, получать отдельные указания Amvera для этого hostname; правила apex и поддомена отличаются. Дождаться подтверждения DNS и выпуска сертификата в Amvera; не обходить TLS warnings.
4. После реального открытия wedding-сайта по `https://anyaxmaxim.ru` выставить этот origin в PUBLIC_SITE_URL обоих приложений и перезапустить их. Проверить HTTPS, PDF QR/ссылки, календарь и OG-картинку. В BotFather при необходимости обновить существующую Menu Button на `https://anyaxmaxim.ru/telegram`; /start использует этот путь из PUBLIC_SITE_URL автоматически.

### Шаг F. Финальный smoke и rollback

- В обычном браузере `/telegram` показывает только запрет; unsigned admin API 401/403, PDF без guest cookie 401. Не должно быть private data в HTML.
- На телефоне организатора Mini App: список, фильтры, карточка, статистика и новое согласие. /stats согласуется с counts БД. Проверить работу с выключенным компьютером.
- Изолированный тестовый сценарий RSVP на production допускается только с явно помеченными созданными для проверки записями: Приду, Не приду, 5 ответов, отмена добавления, reload, PDF и уведомление. Очистить только эти ID с подтверждением. Реальные записи не трогать. Если такой сценарий не согласован/не изолирован, ограничиться read-only smoke и не объявлять полный E2E выполненным.
- При ошибке остановить следующий зависимый этап. Не выполнять автоматический rollback schema. Возврат к прежнему коду допустим лишь после проверки совместимости с новыми consent и схемой; additive колонки сохранять. Backup нужен для аварии, не для слепого отката поверх новых ответов.

## Источники настройки

- [GitHub/webhook доставка Amvera](https://docs.amvera.ru/applications/git/webhooks.html).
- [PostgreSQL, backups и восстановление](https://docs.amvera.ru/databases/postgreSQL.html).
- [Внутренние адреса, регионы, домены и DNS](https://docs.amvera.ru/applications/configuration/network.html).
- [Официальный CLI и необходимость авторизации](https://docs.amvera.ru/general/cli.html).

Локальные доказательства и logs (не включаются в Git): `qa-artifacts/release-*.log`, `release-external-audit.json`, `release-npm-audit-production.json`, `release-npm-audit-final.json`, browser captures/results. Production passwords, token, full whitelist IDs и гостевые данные в отчёт не включены.
