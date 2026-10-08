# Telegram Mini App: security audit

Дата: 2026-10-08. Проверен существующий проект. Push и изменения Amvera не выполнялись.

## Результат и исправления

Публичный /telegram разрешён. До авторизации он содержит только фирменную подпись и сообщение:
«Эта страница доступна только организаторам через Telegram.»

Ранее сервер уже проверял подпись и whitelist, но клиент показывал пустой dashboard и фильтры до проверки. Теперь dashboard появляется только после успешного admin API ответа. При 401/403 клиент очищает список, статистику, выбранную карточку и подтверждение удаления. Без initData SDK callback вообще не запускает загрузку RSVP. Initial HTML также не содержит admin controls или данных гостей.

## Серверная граница

Единственный Mini App admin endpoint: /api/telegram/mini-app, GET и POST. Оба Next.js handler вызывают miniAppRequest; route импортирует server-only и force-dynamic. Авторизация выполняется до разбора action/filter и до подключения к PostgreSQL.

На каждом запросе проверяются:

- непустая initData длиной не более 8192 символов;
- отсутствие повторяющихся параметров;
- hash: ровно 64 hex-символа;
- HMAC-SHA-256, ключ из TELEGRAM_BOT_TOKEN и WebAppData, timingSafeEqual;
- auth_date: целочисленная десятичная Unix timestamp, возраст не более 3600 секунд, допускается до 30 секунд рассинхронизации часов вперёд;
- user.id: положительный safe integer из подписанного JSON, не bot;
- наличие подписанного ID в TELEGRAM_ALLOWED_USER_IDS.

Невалидная авторизация возвращает 403 с одним полем error. Данные, статистика и подтверждения удаления не возвращаются. telegram_user_id в query/body/header не используется как доказательство авторизации. Даже валидная initData в JSON body не заменяет проверяемый X-Telegram-Init-Data.

GET защищает aggregate statistics, paginated guest list, все пять фильтров и detail по UUID. Отдельного search endpoint нет: неизвестный search parameter не добавляет SQL. Filters используют закрытый набор SQL predicates; UUID и offset валидируются. POST защищает delete, confirm и cancel. Подтверждение удаления привязано к серверно установленному organizer ID и имеет срок действия.

Все ответы API: Cache-Control private, no-store и Vary X-Telegram-Init-Data. Других web admin endpoints при инвентаризации не обнаружено. /api/rsvp остаётся публичным guest API с отдельной HttpOnly session и CSRF; /api/telegram/webhook не является Mini App API и production worker от него не зависит.

## Проверки

Добавлен tests/mini-app-security.test.mjs. Для каждого чтения/фильтра/detail/delete/confirm/cancel проверены: нет initData, unsigned fake ID, tampered signature, повреждённые данные, expired/future date, пользователь вне whitelist, duplicate parameter, строковый ID и malformed date. Denied DB fixture падает при любом обращении к PostgreSQL, поэтому тесты подтверждают отказ до DB access. Два whitelist ID проходят; unsigned identity overrides не влияют на выбранную авторизацию.

SSR тест рендерит настоящий TelegramAdmin без effects и проверяет отсутствие dashboard, статистики, списка и кнопки удаления. Route не выполняет server-side чтение RSVP.

scripts/check-telegram-artifacts.mjs отдельно проверяет реальный .next/server/app/telegram.html и весь .next/static JavaScript после build. Скрипт сравнивает configured private environment values без печати значений. Проверка пройдена: initial HTML без RSVP/admin данных, token/DB URL/webhook secret не найдены в client JavaScript. TELEGRAM_BOT_TOKEN не используется компонентом и не импортируется в client dependency tree.

В обычном браузере открывался http://localhost:3000/telegram: только сообщение доступа, dashboard DOM nodes = 0. Авторизованный путь и stress-card проверялись через изолированную loopback QA fixture с синтетической подписью; реальный Telegram token не использовался для браузерных тестов.

Итог: typecheck, lint, 63/63 tests, production build, check:secrets, artifact scan прошли.

## Практические границы

initData является краткоживущим bearer proof: украденную валидную подпись можно повторно использовать в пределах одного часа. Это не обход whitelist; для уменьшения последствий важны HTTPS, отсутствие XSS и неразглашение initData. Одноразовость всех admin запросов не добавлялась: Mini App использует одну initData для нескольких действий. Удаление отдельно требует organizer-bound confirmation.

Реальные Telegram iOS/Android WebView и production Amvera в этом проходе не тестировались. После deployment проверить двумя разрешёнными аккаунтами и аккаунтом вне whitelist. Для открытой дольше часа Mini App нужен повторный запуск через Telegram после отказа по сроку.

Алгоритм сверён с официальной документацией: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
