# Mobile lookbook, 26.10.2026

Работа локальная. Production/Amvera/production DB не использовались, push не выполнялся.

На <=700 px пагинация находится поверх нижней части фотографии, вне анимируемых frames. Одна пара стрелок и один live counter без дублирования controls в DOM. Светлая полупрозрачная подложка с blur 7px и читаемый fallback; touch targets 44×44 px. Pointer events controls не передаются обработчику swipe. Клавиатура, touch/mouse swipe, направление анимации и reset категорий сохранены.

Вместо фиксированного description min-height 360 px измеряется высота наиболее длинных реальных описаний для соответствующего lookbook. На 320 px резерв 256 px, на 375/390 px 229 px, на 430 px 194 px. Сокращены padding над текстом, отступ kicker и margins заголовка. Размеры шрифтов/изображений не уменьшались. Общий резерв между категориями предотвращает скачки; ResizeObserver и fonts.ready учитывают resize/загрузку шрифтов.

Desktop controls остаются под контентом. Полные desktop fashion baselines совпадают побайтово. Два изолированных desktop stage captures теперь включают controls, поскольку controls перенесены внутрь region; фактическая композиция desktop не менялась.

По последующим указаниям пользователя дополнительная CSS-коррекция цвета отменена. Второе фото Venue (pushkinskaya-01.webp) заменено на codex-clipboard-e40ddd24-3db5-4c1b-a21e-4527706b9f84.png, 1402×1122 WebP q90, без crop/цветокоррекции. Первая фотография, порядок, fullscreen и таймеры прежние. Источник зафиксирован в MEDIA_ASSETS.json/md.

Просмотрены 320/375/390/430 и desktop 1440. Overlay находится внутри photo bounds и не пересекается с caption. Проверены 4 страницы (девушки/мужчины × одежда/аксессуары), оба lookbook, стрелки, native touch swipe, normal/reduced motion, отсутствие overflow и стабильность высоты. Финальный focused browser run без update: 12 passed (2.5m). Typecheck, lint, 105 unit/integration tests, build, check:secrets и git diff --check прошли. Обновлены 20 relevant baselines и добавлены 4 overlay states; список в tmp/mobile-lookbook/snapshot-changes.json. RSVP, Guests, Telegram и Program baselines не менялись.

Preview перезапущен с последней сборкой, http://localhost:3100/ отвечает HTTP 200. Скриншоты и измерения в tmp/mobile-lookbook/.
