# Родные: две стороны приглашения

Работа выполнена только локально. В этом проходе не менялись фото, подписи, имена, Друзья, RSVP, FAQ, программа, Venue, Dress Code, backend/Telegram/Amvera/deployment. Предыдущий завершённый пакет текстов/портретов сохранён. Push/commit не выполнялись.

## Desktop

Свыше 1000 px обе стороны видны одновременно, в пределах одного существующего guest-chapter. Слева «Со стороны жениха», справа «Со стороны невесты». Каждая сторона — сетка 2 колонки. Между сторонами gap 64 px; отдельные фоны/рамки секций не добавлялись. Сохранены существующие paper prints, фотографии, hover, тени, ботаника и scroll reveal карточек. Одиночная Мария занимает одну ячейку.

Жених: Ольга → Владислав → Лидия Васильевна → Сергей Иванович → Галина Николаевна → Олег → Наталья → Екатерина.

Невеста: Дарья → Вячеслав → Анатолий → Ангелина → Надежда Константиновна → Галина Ивановна → Мария.

Порядки вынесены в src/content/family-sides.mjs и ссылаются на существующие стабильные guest IDs. Данные/файлы людей не копируются и не переназначаются.

## Breakpoint и compact layout

До 1000 px включительно — Жених | Невеста и 2 карточки в ряд. Порог выбран по существующему переходу guest-grid/типографики при 1000 px; проверены 768 (compact), 1024 и 1440 (wide). Compact album ограничен 540 px; на узком телефоне занимает прежнюю ширину. По умолчанию Жених. При переключении Друзья → Родные последняя сторона сохраняется в local useState. После reload снова Жених. SessionStorage не добавлялся.

Обе compact-группы занимают одну CSS grid-area; visibility/inert/aria-hidden скрывают неактивную сторону, а общий grid резервирует максимальную высоту. Поэтому 8/7 карточек не меняют высоту списка при tap/swipe. Вручную и в браузере измерены 320/375/390/430/768: высота до/после одинакова, overflow 0. На 1024/1440 видны обе стороны.

## Управление

Один state side используется и кнопками, и swipe. Кнопки имеют type=button, role=group у контейнера, aria-label/aria-pressed/aria-controls и видимый focus-visible. Неактивная надпись переключателя имеет более читаемый оливковый цвет внутри существующей палитры; активный цвет и золотой индикатор сохранены. Enter/Space работают нативно. Явный aria-label исключает декоративную CSS-звёздочку из accessible name.

Pointer Events распознают жест только внутри списка на compact-экране. Threshold 50 px. Горизонталь должна быть строго больше вертикали ×1.5. Влево с Жениха → Невеста; вправо с Невесты → Жених. Внешние крайние жесты и маленькие движения ничего не делают. Pointer capture сохраняет завершение жеста при выходе пальца за край. Pointer cancel очищает ref.

CSS touch-action:pan-y pinch-zoom разрешает нативный вертикальный скролл и pinch zoom. preventDefault для scroll/touchmove не используется. При вертикальном движении браузер может отменить pointer gesture; сторона не меняется. Browser regression использует настоящие CDP touchStart/Move/End и проверяет реальное изменение window.scrollY при вертикальном жесте.

## Motion

Opacity 250 ms ease, горизонтальный transform 320 ms на существующем --invite-ease, расстояние 18 px. Жених уходит влево, Невеста приходит справа; обратно наоборот. Никаких loops/bounce/новой physics dependency. При prefers-reduced-motion:reduce transition:none, смена мгновенная. Существующая initial scroll-анимация бумажных карточек сохранена.

## QA

Responsive: 320,375,390,430,768,1024,1440. Проверены оба точных порядка, длинные имена, отсутствие растяжения последней карточки, active states, overlay height, tap, native swipe в обе стороны, ниже порога, vertical, крайние жесты, Enter/Space, возврат из Друзей и reload, normal/reduced motion.

Перед изменением сохранены SHA-256 всех 26 portrait assets; после реализации изменённых фотографий 0. Друзья имеют те же IDs, данные, фотографии, порядок и visual baselines, что до этой задачи.

Новые unit tests: 5 (порог и направления, крайние/малые жесты, vertical dominance, нечисловые координаты, точный состав/порядок без дубликатов). Полный npm test: 104 pass. Отдельный полный browser-сценарий семейных сторон с настоящими touch events прошёл после проверки снимков: tap/swipe, edge/threshold/vertical, scroll/height stability, keyboard, state return/reload и normal/reduced motion.

Первый npm run test:browser выполнен без обновления. Просмотрены обе mobile-стороны и wide layout на 1024/1440. Offscreen snapshot fixture воспроизводит прежнюю геометрию семьи только при съёмке других секций, поэтому их baselines не перезаписываются. Full-page и Guest captures всегда снимают реальную новую композицию.

Обновлены 5 существующих baselines: guests-relatives-375.png, guests-relatives-1440.png и homepage-375x812.png / homepage-430x932.png / homepage-1440x900.png. Полностраничные снимки изменились из-за новой семейной композиции.

Добавлены 7 baselines: guests-relatives-bride-375.png, relatives-switch-groom.png, relatives-switch-bride.png, relatives-tap-groom.png, relatives-tap-bride.png, relatives-swipe-groom.png, relatives-swipe-bride.png. Все остальные существующие baselines, включая оба friends-снимка, совпадают с SHA-256 до семейной задачи. Машинный список: tmp/family-layout/snapshot-changes.json.

Typecheck, lint, 104 unit/integration tests, production build, check:secrets и git diff --check прошли. Финальный полный npm run test:browser после точечного обновления проверенных снимков: 33 passed (5.5m), без обновления baselines, failures/skips нет. Новая family-проверка входит в эти 33 теста. Browser suite использует локальные синтетические данные и in-memory PostgreSQL, без production DB и Telegram-запросов.

Локальный Next preview перезапущен с финальной сборкой; изолированный QA preview доступен по http://localhost:3100/#guests. Production и push не выполнялись.
