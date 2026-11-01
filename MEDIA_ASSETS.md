# Локальные media assets, 25 октября 2026

Production, API, backend, БД, RSVP business logic и deployment в этом проходе не менялись. Push не выполнялся.

## Утверждённые портреты

| № | Гость | Роль | Новый файл |
|---|---|---|---|
| 1 | Ольга | Мама жениха | `public/images/guests/olga.webp` |
| 2 | Владислав | Папа жениха | `public/images/guests/vladislav.webp` |
| 3 | Галина Николаевна | Бабушка жениха | `public/images/guests/galina-nikolaevna.webp` |
| 4 | Сергей Иванович | Дедушка жениха | `public/images/guests/sergey-ivanovich.webp` |
| 5 | Наталья | Тетя жениха | `public/images/guests/natalya.webp` |
| 6 | Лидия Васильевна | Бабушка жениха | `public/images/guests/lidia-vasilyevna.webp` |
| 7 | Олег | Дядя жениха | `public/images/guests/oleg.webp` |
| 8 | Мария | Тетя невесты | `public/images/guests/maria.webp` |
| 9 | Надежда Константиновна | Бабушка невесты | `public/images/guests/nadezhda-konstantinovna.webp` |
| 10 | Анатолий | Отчим невесты | `public/images/guests/anatoly.webp` |

Все исходники 1122×1402 преобразованы в 800×1000 WebP quality 90 существующим sharp. Совокупный размер 0.92 МиБ. Лица, волосы, возраст, одежда, выражения и фон не менялись. Новые портреты сохраняют полный кадр и единый формат 4:5, object-position 50% 50%; дополнительных индивидуальных смещений не понадобилось. На экранах до 350 px шрифт имён новых портретов немного уменьшается, чтобы Николаевна/Васильевна не разрывались внутри слова. Для длинного отчества в четырёхколоночной раскладке 701–1200 px предусмотрен отдельный меньший кегль. Браузерный тест измеряет каждое слово, а не только общий overflow. Для них отключён старый sepia/saturation-фильтр. Оставшиеся родственники и все друзья сохраняют прежние фотографии и геометрию. Галина Николаевна (family-6, бабушка жениха) и Галина Ивановна (family-7, бабушка невесты) остаются разными людьми.

## Мотя

Использованы именно **последние файлы с рабочего стола**, а не предыдущие Downloads и не найденная в процессе CC0-запись. Источник: записи, переданные пользователем и явно одобренные для сайта. Отдельная лицензия не предоставлена; CC0/public domain им не приписывается.

| Файл | Длительность | Размер | Источник / usage |
|---|---|---|---|
| `public/audio/motya-meow-1.mp3` | 0.95 с | 10391 байт | Последний Desktop/motya-meow-1.mp3, предоставлен пользователем |
| `public/audio/motya-meow-2.mp3` | 0.95 с | 10629 байт | Последний Desktop/motya-meow-2.mp3, предоставлен пользователем |
| `public/audio/motya-meow-3.mp3` | 0.95 с | 11020 байт | Последний Desktop/motya-meow-3.mp3, предоставлен пользователем |

Файлы скопированы без изменения байтов. Полные SHA-256 в MEDIA_ASSETS.json; все три различны. В Chrome декодируются, mono; декодированный sample rate 48 kHz. Исходный голос, pitch, динамика и длительность не менялись. Нет синтеза, oscillator, AI или внешней загрузки во время использования. Локальный media request к своему сайту нужен для получения MP3; сторонние запросы не нужны. Загрузка начинается только по пользовательскому действию. Громкость HTMLAudioElement 0.7. Лимит по sessionStorage, блокировка overlap, подсчёт только после успешного play(), клавиатура и пятисекундный toast сохранены.

**Проверка на слух:** самостоятельное прослушивание через колонки в этой среде не подтверждено. Не выдаём browser decode за оценку натуральности или высоты голоса. Это выбранные пользователем записи; окончательно оценить звучание можно в preview. Найденные CC0-материалы и промежуточные WAV не используются и не входят в public.

## Удалено

Для каждого файла подтверждены 0 runtime references и 0 необходимых test/script references. Динамические пути проверены отдельно: Watercolor kind; карты family/friends; content Dress Code; CSS texture variables. Исторические manifests/docs не являются runtime-зависимостями; старый Dress Code v1 manifest помечен historical/retired, provenance сохранена.

| Путь | Причина / замена |
|---|---|
| `public/images/botanical-review.jpg` | Unused botanical review contact sheet |
| `public/images/dress-lookbook/men-blue.webp` | Retired v1; replaced by lookbook-v2 and women-clothing-v3 |
| `public/images/dress-lookbook/men-casual.webp` | Retired v1; replaced by lookbook-v2 and women-clothing-v3 |
| `public/images/dress-lookbook/men-milk.webp` | Retired v1; replaced by lookbook-v2 and women-clothing-v3 |
| `public/images/dress-lookbook/men-moss.webp` | Retired v1; replaced by lookbook-v2 and women-clothing-v3 |
| `public/images/dress-lookbook/men-muted.webp` | Retired v1; replaced by lookbook-v2 and women-clothing-v3 |
| `public/images/dress-lookbook/men-neon.webp` | Retired v1; replaced by lookbook-v2 and women-clothing-v3 |
| `public/images/dress-lookbook/men-neutral.webp` | Retired v1; replaced by lookbook-v2 and women-clothing-v3 |
| `public/images/dress-lookbook/women-butter.webp` | Retired v1; replaced by lookbook-v2 and women-clothing-v3 |
| `public/images/dress-lookbook/women-fuchsia.webp` | Retired v1; replaced by lookbook-v2 and women-clothing-v3 |
| `public/images/dress-lookbook/women-ivory.webp` | Retired v1; replaced by lookbook-v2 and women-clothing-v3 |
| `public/images/dress-lookbook/women-neon.webp` | Retired v1; replaced by lookbook-v2 and women-clothing-v3 |
| `public/images/dress-lookbook/women-olive.webp` | Retired v1; replaced by lookbook-v2 and women-clothing-v3 |
| `public/images/dress-lookbook/women-print.webp` | Retired v1; replaced by lookbook-v2 and women-clothing-v3 |
| `public/images/dress-lookbook/women-sage.webp` | Retired v1; replaced by lookbook-v2 and women-clothing-v3 |
| `public/images/dress-men-1.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-men-2.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-men-3.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-men-reference-1.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-men-reference-2.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-men-reference-3.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-men-reference-4.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-men-reference-5.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-men-reference-6.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-women-1.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-women-2.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-women-3.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-women-reference-1.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-women-reference-2.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-women-reference-3.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-women-reference-4.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-women-reference-5.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/dress-women-reference-6.webp` | Retired initial dress photos; replaced by v2/v3 |
| `public/images/guest-1.jpg` | Replaced relative placeholders or unassigned placeholders; dynamic family/friends mapping checked |
| `public/images/guest-14.jpg` | Replaced relative placeholders or unassigned placeholders; dynamic family/friends mapping checked |
| `public/images/guest-15.jpg` | Replaced relative placeholders or unassigned placeholders; dynamic family/friends mapping checked |
| `public/images/guest-16.jpg` | Replaced relative placeholders or unassigned placeholders; dynamic family/friends mapping checked |
| `public/images/guest-19.jpg` | Replaced relative placeholders or unassigned placeholders; dynamic family/friends mapping checked |
| `public/images/guest-20.jpg` | Replaced relative placeholders or unassigned placeholders; dynamic family/friends mapping checked |
| `public/images/guest-21.jpg` | Replaced relative placeholders or unassigned placeholders; dynamic family/friends mapping checked |
| `public/images/guest-22.jpg` | Replaced relative placeholders or unassigned placeholders; dynamic family/friends mapping checked |
| `public/images/guest-7.jpg` | Replaced relative placeholders or unassigned placeholders; dynamic family/friends mapping checked |
| `public/images/guest-8.jpg` | Replaced relative placeholders or unassigned placeholders; dynamic family/friends mapping checked |
| `public/images/venue-mariage-1.webp` | Retired venue; current two Pushkinskaya photos retained |
| `public/images/venue-mariage-2.webp` | Retired venue; current two Pushkinskaya photos retained |
| `public/images/venue-mariage-3.webp` | Retired venue; current two Pushkinskaya photos retained |
| `public/images/venue-mariage-4.webp` | Retired venue; current two Pushkinskaya photos retained |
| `public/images/venue-mariage-5.webp` | Retired venue; current two Pushkinskaya photos retained |
| `public/images/venue-mock.webp` | Retired venue; current two Pushkinskaya photos retained |

Итого удалено **49 файлов, 5 495 526 байт ≈ 5.24 МиБ** из public. Добавленные десять WebP и три MP3: 999 456 байт. Чистое уменьшение public примерно **4.29 МиБ**. Это экономия рабочего дерева/будущего commit, не удаление файлов из прошлой истории Git. Пустой dress-lookbook удалён. В Git видны 35 tracked deletions; 14 удалённых v1 lookbook файлов ещё не были отслеживаемыми, поэтому удаления их производных отдельно в git diff не появятся. Ничего не staged и не committed.

## Оставлено намеренно

- Все текущие dress-lookbook-v2 (28), dress-women-clothing-v3 (11), их manifests и provenance.
- Текущие Pushkinskaya WebP и оригиналы public/images/venue/pushkinskaya-01.png, pushkinskaya-02.png: исходники действующей площадки, не старые варианты. PNG вместе около 3.04 МиБ; не удалены автоматически.
- Hero couple.jpg; Envelope/Letter/Airplane paper textures, wax seal и watercolor-forest. Ссылки через CSS variables также проверены.
- Все необходимые placeholders: family guest-3,4,11,17; friends guest-2,5,6,9,10,12,13,18,23,24,25. Друзья не менялись.
- Browser screenshot baselines, fixture assets, /venue-rules assets и шрифты.

## Возможно удалить позже

- watercolor-branch.webp, watercolor-sweeping.webp, watercolor-calendar-corner.webp: прежние варианты ботаники остаются в типах Watercolor/provenance. Не удалены из-за оговорки о сохранении stationery assets.
- watercolor-atelier-03.webp и watercolor-atelier-04.webp: текущий VenueSection уже не выводит эти декоры; сохранены как часть утверждённого комплекта из 10 веточек.
- Семь women-clothes в dress-lookbook-v2 заменены v3, но сохранены по прямому запрету автоматического удаления новых v2 assets; sage также является reference в v3 manifest.

## Проверки и snapshots

Браузерные тесты проверяют соответствие всех десяти путей именам, 4:5, декодирование, обеих Галин, Родные/Друзья и отсутствие overflow на 320/375/390/430/768/1440. Новые тесты аудио проверяют три разных файла, длительность, decode и реальные local media requests. Существующий тест проверяет неуспешный play, overlap, три успеха, cap после reload, Enter/Space и toast 5 секунд.

Первый полный browser run выполнен без обновления. Просмотрены реальные изображения родственников mobile/desktop и diff. У component snapshots ниже Guests фиксация прежней offscreen-геометрии альбома только на время снимка устраняет зависимость сглаживания текста от его новой высоты; реальные страницы и снимки гостей остаются с новой геометрией. Порог сравнения не ослаблялся.

Разрешённые намеренные изменения baselines: homepage-375x812.png, homepage-430x932.png, homepage-1440x900.png, guests-relatives-375.png, guests-relatives-1440.png. Остальные baselines должны остаться побайтово прежними относительно начала этого прохода.

Финальный результат: typecheck — pass; lint — pass без предупреждений; npm test — 98/98 pass; npm run test:browser — 31/31 pass после исправлений, без snapshot update; production build — pass; check:secrets — pass; git diff --check — pass. Повторно просмотрены 320/375/390/430/768/1440; overflow отсутствует, hover scale 1.02. В локальном preview все три последних MP3 возвращают HTTP 200 с точными размерами исходников. Проверка SHA-256 подтверждает ровно пять изменённых baseline-файлов из списка выше; все остальные сохранены. Полных бинарных дубликатов среди 92 оставшихся image assets нет. Preview: http://localhost:3100/#guests, Мотя: http://localhost:3100/#questions.

## Второй пакет портретов

Порядок подтверждён пользователем: 1 — Вячеслав (family-3), 2 — Дарья (family-2), 3 — Галина Ивановна (family-7, бабушка невесты), 4 — Ангелина (family-10). Файлы: public/images/guests/vyacheslav.webp, darya.webp, galina-ivanovna.webp, angelina.webp. Та же подготовка: 800×1000 WebP quality 90, полный кадр 4:5, object-position 50% 50%, без генерации, ретуши и цветовой обработки. Суммарно 394 686 байт. Теперь 14 из 15 родственников имеют утверждённые портреты; фото Екатерины пока прежнее. Друзья и аудио не менялись.

Удалены public/images/guest-3.jpg (Вячеслав), guest-4.jpg (Галина Ивановна), guest-11.jpg (Ангелина), всего 53 670 байт. Проверены прямые ссылки в src/tests/scripts и динамические карты family/friends. guest-17.jpg сохранён для Екатерины. Остальные прежние файлы не удалялись.

Новый пакет проверен на 320/375/390/430/768/1440: overflow отсутствует, полный портрет и hover сохранены. Проверены обе Галины и имена. Build/typecheck/lint и 98 unit/integration-тестов прошли. Скриншоты обновляются только у трёх homepage и двух guests-relatives; все прочие эталоны сравниваются с состоянием до второго пакета. Backend, API, RSVP, production и deployment не менялись. Push не выполнялся.

### Екатерина

Дополнительно подключена public/images/guests/ekaterina.webp (family-13, двоюродная сестра жениха), 800×1000, WebP quality 90, 128 516 байт. Для точного 4:5 убрано около 5 px по бокам исходника, лицо и вертикальный кадр сохранены. Удалён последний временный guest-17.jpg (13 149 байт), который после замены Екатерины больше не используется. Теперь у всех 15 родственников реальные утверждённые портреты; исключение про прежнее фото Екатерины в описании второго пакета выше больше не актуально. Друзья без изменений.

Включая Екатерину, в последнем проходе обновлены только: guests-relatives-1440.png, guests-relatives-375.png, homepage-1440x900.png, homepage-375x812.png, homepage-430x932.png. Все остальные эталоны сохранены побайтово.

### Галина Ивановна, обновление 26.10.2026

По новому прямому указанию пользователя заменён только portrait family-7 (Галина Ивановна, бабушка невесты). Новый исходник codex-clipboard-cb9293eb-b3e7-4bfc-8221-d0bbb7e1b75e.png обработан существующим sharp в 800×1000 WebP quality 90, 173 826 байт. Сохранён 4:5 и центральное положение, без генерации, ретуши и цветовой обработки. Имя, подпись и порядок карточки прежние. Фото Галины Николаевны, бабушки жениха, и все 11 friend assets не менялись. Mapping обновлён в MEDIA_ASSETS.json.

26.10.2026: по последующему указанию пользователя фото Галины Ивановны (family-7, бабушка невесты) заменено на codex-clipboard-34412626-d645-4311-98d6-483b1bbd895c.png. 800×1000 WebP quality 90, 124600 байт. Имя, подпись, порядок и остальные фотографии сохранены. Это актуальная версия вместо предыдущего исходника.

26.10.2026: второе фото Пушкинской Усадьбы (pushkinskaya-01.webp) заменено по прямому указанию пользователя на codex-clipboard-e40ddd24-3db5-4c1b-a21e-4527706b9f84.png, 1402×1122, WebP q90, 287646 байт. Полный кадр без цветокоррекции. Добавленный CSS-фильтр отменён; прежнее общее отображение галереи сохранено.

29.10.2026: добавлены временные портреты пары в `public/images/guests/couple/`: `maxim-placeholder.webp` (544×800) и `anya-placeholder.webp` (115×115). Оба исходника предоставлены пользователем. WebP q90 без увеличения разрешения и AI-обработки. Визуальное отображение наследует существующий стиль бумажных карточек. Маленькое фото Ани намеренно остаётся временной заглушкой. Карточки стоят над двумя соответствующими колонками родственников, не входят в счётчик 15 родственников и скрываются во вкладке друзей. Mapping и SHA-256 записаны в `MEDIA_ASSETS.json`.
