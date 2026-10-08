# QA / hardening report

Дата: 2026-10-08. Existing project; без push, reset базы, PDF и изменений аккаунта Amvera.

## 1. Найденные проблемы

Разные пределы текстовых полей; отсутствие counters и общего Unicode counting. Возможность сетевого ожидания без bounded timeout. Риск устаревшего GET перезаписать состояние после submit. Недостаточная обработка исчезнувшей Mini App карточки и пустой последней страницы. Long unbroken names/details могли раздвигать layout. На 320×568 заголовок конверта приближался к конверту, а имена на письме обрезались. Scroll reveal мог делать FAQ ботанику непрозрачной. До Telegram авторизации показывался пустой dashboard.

## 2. Исправления

Общие client/server limits: имя 80, кто 120, аллергии/музыка 300, custom drinks 80. Trim + NFC; Unicode code points вместо UTF-16 units. Составной emoji может состоять из нескольких code points. Counters 0/300, спокойный near-limit акцент; превышение не обрезается silently, блокирует submit и отклоняется сервером. HTML/SQL-like ввод остаётся plain text.

Controlled optional fields сохраняются при переключении attendance; NOT_GOING payload отправляет только имя/attendance и технический submission key. None drink exclusive, custom required. Timeout покрывает fetch и parsing; ошибки показываются спокойно, введённые данные сохраняются. Sync submit lock и UUID submission key исключают создание второй записи от retry того же submit. Version guard игнорирует устаревшую session загрузку.

Новая guest session capacity: максимум 2 существующих RSVP. После первого success доступны чистая форма второго гостя и подсказка. После второго показаны оба ответа, третьей формы нет. При organizer deletion ёмкость возвращается; refresh/focus и polling success обновляют состояние. IP/fingerprint не используются для идентификации; существующее anti-abuse rate limiting не является guest identity.

006_rsvp_limits.sql добавляет NOT VALID constraints без удаления исторических ответов. 007_two_guest_session.sql сохраняет session IDs/старые rows, снимает unique one-answer constraint, добавляет UUID idempotency key, composite unique index, session index и DB trigger ограничения двух строк с row lock. Pending migrations применяются существующим runtime startup, build не требует DATABASE_URL. Новых Amvera variables для этих правок нет.

Mini App: bounded requests, action lock, cancellation на сервере, refresh statistics/list after delete, missing detail без ghost card, возвращение с пустой последней страницы. Wrap/min-width и safe-area поддержка. Public узкий layout исправлен точечно; декоративная прозрачность задана responsive CSS variables. Below-fold ботаника lazy; opening graphics eager.

Отдельный security audit и результаты: TELEGRAM_SECURITY_AUDIT.md.

## 3. Потенциальные риски и границы

Docker отсутствует на этом компьютере. SQL integration tests выполнялись на PGlite PostgreSQL engine, а не на отдельных TCP PostgreSQL connections. В тестовой fixture транзакции сериализованы; production concurrent transactions отдельно не нагрузочно тестировались. API row lock и DB trigger обеспечивают лимит; перед production rollout желательно повторить интеграцию на development PostgreSQL.

Реальный production Telegram/Amvera, временное выключение deployed worker и iOS/Android Telegram WebView здесь не проверялись. Worker restart/retry/outbox покрыты автоматическими тестами с fake Telegram API. Delivery at least once: при успешной отправке и последующем сбое DB commit теоретически возможен повтор push.

Safe-area проверялась с синтетическими SDK insets и CSS env fallback; реальные Telegram fullscreen/orientation transitions требуют device проверки. Реальная offline/browser network emulation не выполнялась: timeout и HTTP mapping проверены тестами, HTTP 500 и delayed submit вручную.

Лимит привязан к cookie session; очистка cookie или другое устройство создаёт новую session по требованиям без fingerprint. Исторические oversized rows сохраняются благодаря NOT VALID, новые должны соблюдать пределы. Автоматическая очистка старых sessions/rate buckets не добавлялась.

## 4. Ручные сценарии

Изолированный localhost QA harness с real components/API и in-memory DB; production данные не использовались. Проверены: NOT_GOING submit, GOING submit, все required fields, 301/300 блокировка и 300/300 разрешение, emoji/длинное имя, yes→no→yes и сохранение draft, напитки none→обычный вариант, delayed loading state, server 500 без потери ввода, first success без старого intro, чистая форма второго гостя, второй success с обоими именами, reload restore.

Mini App: длинные все поля одновременно, все напитки/custom, valid signed fixture, detail, delete confirmation, cancel, confirm, stats/list refresh. Удалён один из двух: кнопка add guest появилась; удалены оба: чистая форма снова доступна. Реальные guest records не удалялись.

FAQ: Enter/Space/mouse, четыре открытых ответа, длинный ответ на mobile, href/target/rel Telegram links, wishlist span без fake href. Открытие конверта клавиатурой и сохранение нижней подсказки на 320×568. Прямой /telegram без initData: только denied state.

## 5. Автоматические тесты

63/63 passed: field exact max/+1, Unicode/NFC/trim/controls, HTML-like/SQL-like text escaping, GOING requirements и optional music, NOT_GOING stripping, exclusive drinks/custom required, cookies/CSRF, unknown/corrupt/expired tokens, idempotence, first/second/third session capacity, deletion/refill one/both, isolated sessions, DB-level bypass rejection, both success markup, notification short text/button, durable outbox/retry, polling restart offset/whitelist/backoff/shutdown, Mini App signed authorization for every admin action, confirmation binding/expiry/cancel/repeat/missing row, safe diagnostics, runtime migrations.

typecheck, lint, production build, secret scanner и git diff --check пройдены. Built Telegram HTML/client bundle проверены отдельно. Browser flows были ручными; dedicated browser automation package не добавлялся, reusable local QA harness лежит в tests/helpers/qa-preview.mjs.

## 6. Viewports

Public geometry/overflow всех section containers, heading/question/success text проверены на 320×568, 360×800, 375×812, 390×844, 430×932, 768×1024, 1366×768, 1440×900, 1920×1080. Document horizontal overflow не найден. Screenshots и отдельная visual inspection выполнялись для узкого конверта/письма, mobile FAQ/RSVP и desktop success/composition; это не полный screenshot review каждого состояния каждого блока на всех девяти размерах.

Mini App stress detail: widths 320,360,375,390,430,768; unbroken long text переносится, горизонтальный overflow отсутствует. Реальные touch gestures/device screenshots не проверялись.

## 7. Performance observations

Фотографии и ботаника уже WebP, локальные шрифты, hero использует обычный img с fetchPriority=high; Next Image сейчас не используется. Большинство ниже fold lazy. Opening botany eager, чтобы не опоздать к появлению. Общий набор публичных assets около 8.28 MiB, крупнейший asset около 465 KiB; это размер файлов, не замер transferred bytes одной страницы. Gallery photos примерно до 375 KiB, hero около 284 KiB. Существуют mock assets, которые сейчас не нужны галереям; удаление не выполнялось без полного asset dependency audit. Lighthouse/Web Vitals lab/field measurements не выполнялись.

## 8. Перед следующим visual/motion pass

Сначала проверить deployment runtime migrations и обе organizer Mini App сессии на реальных телефонах. Выполнить TCP PostgreSQL concurrency test, полный screenshots review section/state × viewport и measured performance audit, включая необходимость responsive srcset / Next Image. Предпочтительно добавить такой browser regression suite перед существенными motion изменениями. Текущий approved visual language сохранён; новых эффектов в QA не добавлено.
