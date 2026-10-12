# Локальный пакет изменений, 12 октября 2026

Выполнено только в существующем проекте Wedding. Push/deploy не выполнялись. Подключений к production PostgreSQL, production migrations и изменений Amvera/env не было. Все database tests использовали PGlite. Новые зависимости не добавлялись.

## 1. Изменённые файлы

- Контент: `src/content/public-sections.ts`, новый `src/content/dress-code.ts`, `src/content/rsvp-limits.mjs`.
- Публичный frontend: `src/components/DressCode.tsx`, `src/components/RSVP.tsx`, `src/app/polish.css`.
- Mini App: `src/components/TelegramAdmin.tsx`.
- Backend: `src/server/rsvp/validation.mjs`, `repository.mjs`, `http.mjs`, `detail.mjs`; `src/server/db/schema.mjs`; `src/server/telegram/admin.mjs`, `mini-app.mjs`.
- Новая миграция: `migrations/008_guest_updates.sql`. Миграции 001–007 не изменены.
- Ресурсы: `public/images/venue/pushkinskaya-01.png`, `pushkinskaya-02.png`, оптимизированные `.webp` рядом.
- Tests: `tests/unlimited-guests.test.mjs` заменил `tests/two-guests.test.mjs`; обновлены `hardening.test.mjs`, `stage-b.test.mjs`, `mini-app.test.mjs`, `mini-app-security.test.mjs`, `rsvp-success.test.mjs`, helpers и `tests/browser/regression.spec.ts`.
- Secret scan: `scripts/check-secrets.mjs` читает большие бинарные PNG без переполнения стандартного буфера; ошибки Git скрывают raw output.
- Accessibility: в `src/components/InvitationExperience.tsx` фокус после перехода устанавливается после React commit, когда main уже не inert. Конверт, письмо, полёт, Hero и их тайминги не изменены.
- Документация: `README.md`, `STATIONERY_ASSETS.md`, `BROWSER_TESTS.md`, этот отчёт; visual system дополнен правилами нового lookbook.
- Visual baselines: перечислены ниже.

## 2. Venue

Пушкинская Усадьба, Зелёная ул., 1, городской посёлок Фёдоровское. Есть парковка, спальных мест нет. Новая карта ищет именно этот адрес. Старые фотографии не используются.

Два фото: 01 / 02 и 02 / 02. Существующие автосмена, ручная пауза, directional transition, зелёная информационная часть и ботаника сохранены. WebP созданы установленным sharp без генеративной обработки: 153724 и 218402 bytes вместо PNG 1505073 и 1681023 bytes. Оригиналы сохранены. Длинный адрес проверен на mobile.

## 3. Dress Code

Для каждой категории: четыре крупных swatches с названием и применением → материалы → короткое объяснение → самостоятельный lookbook «Так можно» → lookbook «Так не надо».

Конфигурация полностью data-driven. Примеры имеют `image`, `title`, `description`; фотографии и пояснения меняются вместе. Есть arrows, keyboard, mouse swipe и настоящий touch swipe. Категории сбрасывают каждый lookbook на первый пример: мужчины приходят справа, женщины слева. Paper/olive/gold/serif/botanicals сохранены; спокойное появление палитры и masked image entrance продолжают текущий motion.

## 4. Какие изображения нужны

Для «Так не надо» подготовлены шесть slots, без скачивания или генерации:

- девушки: неон/кислотный оттенок, активный крупный принт, резкое контрастное сочетание;
- мужчины: кислотно-зелёный пиджак, спортивный образ, активный принт/контраст.

Дополнительно нужны два мужских «Так можно»: оливковый пиджак + оливковый галстук + молочная рубашка; оливковый пиджак + оливковая бабочка. Старые мужские референсы с молочными пиджаками или светлыми аксессуарами не соответствуют новой формулировке полностью, поэтому не показаны как безусловно подходящие. Slots имеют `image:null` и понятный TODO в конфигурации.

## 5. RSVP fields

Имя и фамилия, placeholder «Имя Фамилия». Client/server требуют две непустые части; 80 Unicode characters сохранены. Кириллица, латиница, дефисы, апострофы и несколько частей допустимы.

«Кто вы?» сохранено, placeholder «Сват, брат, муж, жена». Трансфер: `self`, `kupchino`, `pavlovsk` с точными публичными labels. Обновлена подпись музыки; лимит и counter 300 сохранены. Ночёвки нет в форме, новом payload, required validation, текущих admin details, stats или filters. Исторический database column сохранён; новые записи получают NULL.

## 6. Unlimited session

Cookie остаётся opaque и HttpOnly. Session FK и unique `(session_id,submission_key)` сохраняются. Общего ограничения количества ответов больше нет; действующий hourly rate limit не менялся.

После каждого ответа доступна «Добавить ещё гостя»: очищает поля и submission key; следующий submit получает новый UUID. GET/POST больше не возвращают remaining capacity или capacity 409.

Success и reload показывают компактный счётчик, последний ответ и постоянную кнопку добавления, без списка больших карточек всех гостей. Удаление затрагивает один RSVP; остальные и session продолжают работать. IP/fingerprint не используются как guest identity.

## 7. Миграция 008

- Удаляет только trigger `rsvp_session_capacity` и функцию его проверки.
- Расширяет transfer CHECK: сохраняет legacy `needed` и разрешает новые station values.
- Меняет attendance CHECK так, чтобы GOING не требовал overnight.
- Не удаляет RSVP, session relations, idempotency index или overnight column; не переписывает значения.

В PGlite проверены старые значения overnight/transfer, новые nullable записи, больше двух строк на session и прежний unique idempotency key. Migration runner повторный старт по-прежнему не применяет уже записанные миграции заново.

## 8. Mini App / Telegram

Фильтры: все, придут, не придут, общий трансфер, Купчино, Павловск. Stats отдельно считают станции. Legacy `needed` входит в общий трансфер, в detail помечено отсутствие точки отправления. Ночёвка убрана из интерфейса. Push остаётся коротким, только имя и фамилия плюс кнопка «Открыть».

Telegram signature/whitelist checks и polling architecture не менялись. Security tests расширены новыми filters; future-date fixture получил безопасный временной запас, чтобы время исполнения параллельных tests не превращало его в разрешённый auth_date.

## 9. Tests

Проверены: 1/2/3/5 гостей одной session; несколько NOT_GOING; одинаковый key без дубликатов; разные keys; независимые cookies; corrupted cookies; delete одного/всех и restore; сохранность legacy данных; все три transfers, invalid transfer; отсутствие overnight; однословное имя rejected; полноценное и сложное имя accepted; Mini App station filters/stats и authorization.

Browser suite проверяет пять чистых submissions, новый UUID для каждой, отсутствие overnight в payload, восстановление session, оба lookbook, новые картинки/карту/counter, реальные mouse/touch swipe, responsive, normal/reduced motion и сохранённый самолётик.

## 10. Visual baselines

20 PNG states, 15 browser tests. Обновлены homepage 375/430/1440, RSVP GOING/NOT_GOING/first/second success, Telegram list/detail. Добавлены Venue, Dress women/men, allowed/avoid и success session с пятью гостями.

FAQ source/content не изменены; его capture обновлён после изменившегося положения секции и субпиксельной растеризации текста. Оба airplane baselines теперь снимают сам физический самолётик, полный OpeningScene сохранён отдельным review artifact. Screenshot tests контролируют JS-таймеры и фиксируют реальный CSS flight frame; отдельный normal-motion test проверяет переход в реальном времени. Полёт не менялся. Sealed/open envelope baselines не изменились.

## 11. После восстановления Amvera

Сейчас ничего к production применять не нужно. Позже: подготовленный commit с миграцией 008 должен попасть в repository по отдельному разрешению; обновить сайт и worker из одной версии. Существующий `start:amvera` применит pending 008 при runtime start перед Next.js; повторные старты пропустят её по migration metadata. Затем обновить bot worker с тем же кодом. Новых environment variables или изменений Amvera configuration для этого пакета не требуется. Старые RSVP и overnight сохранятся.

## Итоговая проверка

Typecheck и lint прошли. Обычные tests: 66 passed, 0 failed, PGlite. Browser regression: 15 passed, 20 baselines; отдельные проверки normal/reduced motion и реальные touch gestures. Production build прошёл без запуска production migrations. Secret scan прошёл, значения secrets не выводились. `git diff --check` прошёл. Локальный предпросмотр: http://localhost:3100/ с синтетической PGlite-базой; у Next preview DATABASE_URL направлен на отключённый localhost endpoint только в окружении процесса, файлы env не менялись.
