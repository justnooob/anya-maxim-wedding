# Англоязычные подписи, 26.10.2026

Работа только локальная. Amvera/production DB/deployment не использовались. Push/commit не выполнялись.

Найден C:/Users/maks1/Downloads/BickhamScriptPro-Regular.ttf. Также найден Semibold, он не подключался. Regular скопирован в public/fonts/bickham-script-pro/bickham-script-pro-regular.ttf. Формат подтверждён SFNT header как TrueType, name table: Bickham Script Pro Regular / Regular, 931 840 байт. SHA-256 копии совпадает с исходником. Готового локального fontTools/woff2 converter нет; новые зависимости не устанавливались, сторонние версии/другие шрифты не скачивались.

Подключение через существующий CSS @font-face, family Bickham Script Pro, weight 400/style normal, font-display:swap. Единственный файл. Fallback локальный Pitholica Delicate, затем cursive. Правила вынесены в src/app/english-signatures.css, импорт последним в layout. Цветовые свойства/золото/shimmer не менялись.

Найдены и заменены все отображаемые английские декоративные подписи:

- над конвертом, .opening-signature;
- имена на открытом письме, .letter-names, включая тот же шрифт у &;
- надпись на обоих крыльях самолётика, .paper-wing::after;
- английский бренд в шапке Telegram Mini App. Он выделен отдельным span; подпись «Для организаторов» сохраняет Montserrat и цвет.

В Hero отображается кириллическое АННА & МАКСИМ; оно не менялось. Других отображаемых английских подписей в footer/секциях не найдено. Calendar PRODID и URL остались техническими строками. Date, FAQ, RSVP, Dress Code и гости не менялись.

Кегль адаптирован под меньшую визуальную высоту Bickham: верхняя подпись 38→44 desktop и 30→36 mobile; высота строк сохранена 53.2/42 px. В письме desktop clamp(58px,12cqw,108px), mobile 52px, до360px 36px. Подобранные line-height/padding сохраняют прежнюю высоту строки письма (примерно 64.7px на375px и42.5px на320px) и дают запас росчеркам. На самолётике размер/позиция прежние. Mini App 30px с прежней высотой header-line22px и видимым overflow для росчерков; нижние блоки не сдвигаются. Никакого faux italic, letter-spacing0, kerning/ligatures включены. Цвет верхней подписи #30382b сохранён.

Responsive просмотр: 320,375,390,430,768,1024,1440. Canvas ink bounds проверяют верхние/нижние выносы и боковые края отдельно от контейнера. Английские подписи nowrap, без horizontal overflow и пересечения с датой. Все компоненты открываются по прежней последовательности; в review artifacts используются завершённые finite animations, чтобы не путать проходящий перед письмом конверт с clipping шрифта.

Добавлен browser regression с реальным HTTP200/931840-byte font asset, document.fonts.check, вычисленной font-family, ink bounds на7ширинах, единым font у &, псевдоэлементами самолётика и проверкой неизменности кириллицы/даты/русской Mini App подписи.

Результаты и точный список intentional baselines приведены ниже.

## Baselines

После ручного просмотра diffs обновлены 22 существующих baselines, новых нет. Все публичные homepage/Date/Venue/Dress Code/Guests/Program/FAQ/RSVP baselines сохранены побайтово. На Mini App summary dimensions остались 375×1141; pixel diff ограничен английской подписью (x18–154, y58–83), остальные элементы совпадают.

- envelope-mobile-seal.png
- envelope-open.png
- envelope-sealed.png
- paper-airplane-1440.png
- telegram-banquet-320.png
- telegram-congratulations.png
- telegram-detail-long.png
- telegram-drink-drill.png
- telegram-filters.png
- telegram-food-drill.png
- telegram-list.png
- telegram-more.png
- telegram-music.png
- telegram-review-detail.png
- telegram-review-guests.png
- telegram-review-more.png
- telegram-review-music.png
- telegram-review-summary.png
- telegram-review-transfer.png
- telegram-summary-320.png
- telegram-summary.png
- telegram-transfer.png

Typecheck/lint, 105 unit/integration tests и build прошли. Полный browser update pass: 37 passed (5.9m). Финальный npm run test:browser без update: 37 passed (5.8m), failures/skips нет. Новый тест дополнительно проверяет прежнюю высоту Mini App brand22px и отсутствие overlap на всех7ширинах. Check:secrets и git diff --check прошли. Пороги сравнения снимков не менялись.

Всего изменены22существующих baselines:3 envelope,1 paper-airplane-1440,18 telegram. Все остальные существующие baselines совпадают с SHA-256 до задачи. Preview перезапущен с финальной сборкой. Локальный font URL отвечает HTTP200,931840байт. Никаких CDN/font downloads из интернета, production действий или push.
