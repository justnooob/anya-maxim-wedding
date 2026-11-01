# Full UI/UX QA

## Wishlist · 30 октября 2026

Новый модуль завершён локально. Этот раздел описывает его актуальную проверку; результаты прежних проходов ниже сохранены как история. Production, Amvera, deployment, production migration и push не выполнялись.

1. Публичный route: `/wishlist`, metadata «Вишлист | Аня & Максим», ссылка назад к `/#gifts`. В HTML только intro и статическая оболочка; никакой серверной выдачи имён брони.
2. Schema: `wishlist_items`, `wishlist_links`, `wishlist_reservations`, отдельные `wishlist_sessions`, изменяемые `wishlist_categories` и `wishlist_settings`. Явная Drizzle schema находится в `src/server/db/wishlist-schema.mjs` и экспортируется существующей schema.
3. Migration: следующая после 011, `012_wishlist.sql`. Создаёт таблицы/indexes/FK/checks, категории и default privacy=false; не добавляет товары, не меняет RSVP. Проверены clean DB, применение поверх текущей schema и сохранение существующего RSVP. Повторное применение контролирует существующий checksum ledger.
4. API: GET/POST `/api/wishlist` (list/reserve/own cancel), GET/POST `/api/telegram/wishlist` (list/stats/save/move/visibility/archive/admin cancel/privacy). Использованы существующие transaction, bounded requests, rate limits и Telegram authorization.
5. Anonymous ownership: отдельная HttpOnly SameSite=Lax cookie; в production Secure `__Host-` cookie. В БД только SHA-256 token. CSRF digest отделён от RSVP. Повреждённая/потерянная/устаревшая cookie получает новую сессию через GET, без 500.
6. Чужую бронь нельзя снять по имени или item ID. POST требует активную Wishlist session, совпадающий owner, trusted Origin, CSRF и confirmation. Lost-cookie отмена доступна организаторам.
7. Одновременная бронь защищена transaction + item `FOR UPDATE` + partial unique single-active index. Composite FK не позволяет обойти single, записав multiple в reservation. Promise.all двух независимых сессий дал ровно один success и один controlled409; прямой обход repository отвергнут DB constraint. В браузере повторён сценарий двух независимых contexts.
8. Фильтры: категория, четыре непересекающихся ценовых диапазона, «Все»/«Свободно». Без цены показывается только в «Все цены». Mobile controls компактные, без отдельной большой панели.
9. Ссылки: до 8 магазинов с editable label/URL, добавлением, удалением и up/down reorder. Только http/https без credentials; новые вкладки noopener/noreferrer. Сервер не получает metadata и не скачивает изображения.
10. «Очень хотим»: спокойный золотой marker и первый уровень public sorting; внутри приоритета сохраняется manual order. Mini App показывает priority/statistics.
11. Homepage teaser: отдельная текстовая композиция после Dress Code, divider и ссылка «Посмотреть вишлист». Не содержит товарного preview. Отдельный спокойный reveal.
12. FAQ «А что дарить?» сохраняется: короткий текст про конверт и дополняющий его Wishlist; inline accent link ведёт на `/wishlist`.
13. Mini App: отдельный вход «Вишлист ↗», summary counts, список/детали/редактор, active reservations с именем и датой. Нижние пять прежних разделов сохранены. Все Wishlist endpoints проверяют тот же signed initData, auth_date и whitelist до доступа к БД.
14. Create: подтверждён unit/integration и реальным browser UI созданием нового подарка с магазинами, ценой и priority.
15. Edit: подтверждены изменение title/comment/links, удаление ссылки, сохранение; server version conflict сохраняет чужие изменения и требует refresh.
16. Delete: archive с confirmation; reserved item дополнительно требует явного acknowledgement. В browser проверены disabled confirm до checkbox и успешное удаление занятого подарка. История сохраняется.
17. Hide/show: отдельный async switch, подтверждено API и browser UI, hidden item отсутствует в public list и нельзя забронировать по известному ID.
18. Ordering: mobile up/down, сериализованная DB операция; проверены API, UI и priority/manual public sorting.
19. Admin cancel: подтверждён API и UI. Бронь получает cancelled_at/cancelled_by, подарок снова свободен. Archive записывает отдельную причину archive.
20. Responsive: весь текущий набор из 100 viewport (280–3840 px), включая все 12 запрошенных размеров; дополнительно 12 admin editor/confirmation viewport и 3 reflow-эквивалента 125/150/200%. Включены landscape, длинное слово без пробелов, max-length имени, keyboard focus cycle, Escape, ширина/высота modal. Ручной browser просмотр выполнен на 1440 и 390 px; временный viewport override сброшен.
21. `npm test`: **173/173** unit/integration tests. Новых Wishlist tests: 9, включая security/actions, migration preservation, race и ownership. Дополнительно SSR security test обновлён так, чтобы protected Wishlist component не мог отрендериться без authorization.
22. Browser: финальный `npm run test:browser` **55/55** (49 прежних + 6 Wishlist), отдельный responsive Wishlist **115/115**. Итого 170 сценариев в этих двух наборах; повторные focus прогоны не прибавлены к счётчику. Логи: `qa-artifacts/wishlist-browser-final.log`, `wishlist-responsive-final.log`, `wishlist-complete-unit.log`. Typecheck/lint/build/secrets/diff check успешны.
23. Baselines: **11 новых Wishlist + 22 обновлённых существующих**. Основные изменения: три homepage (teaser), Mini App (вход Wishlist), один viewport после Dress Code. Before/after просмотрены вручную; unrelated isolated sections исключают только offscreen teaser из test fixture. Full-page snapshots используют настоящий layout. Pixel tolerance не повышался. Список: `qa-artifacts/wishlist-baselines-changed.json`; contact sheets `wishlist-changes-1.jpg`, `wishlist-changes-2.jpg` и отдельные homepage/Mini App before/after.
24. Ограничения: Docker executable отсутствует, поэтому отдельный server PostgreSQL/multi-process нагрузочный прогон не выполнен. SQL/constraints работают в PostgreSQL-совместимом PGlite; его connections сериализуются fixture, это не замена production DB locking. Физические iOS/Android keyboard и embedded Telegram WebView недоступны, проверены Chrome reflow/landscape/native dialogs и синтетический SDK. Нет upload service или marketplace auto-import; image URL либо собственный `/images/...` asset с fallback. Категории хранятся в таблице, отдельного category-management UI пока нет. Multiple разрешает по одной активной броне на сессию без общего quantity cap; reservation mode нельзя менять после появления истории. Реальные товары не придуманы: только явно обозначенный local demo seed вне production migration.

Обнаруженные и исправленные дефекты нового модуля: явный autofocus на имя после showModal; цикл Tab внутри обоих dialogs; перенос успешного фокуса после cleanup dialog вместо конкурирующего RAF; доступные названия select; async switches вместо визуально откатывающегося controlled checkbox; защита от параллельной инициализации cookie при focus-refetch. Шесть повторных mobile/desktop booking/cancel проверок прошли после focus исправления, затем прошёл полный 55-test regression без обновления snapshots. Дополнительно выполнен отдельный browser lifecycle test на настоящем `next dev` (Strict Mode) через локальную QA-БД: **1/1**, лог `qa-artifacts/wishlist-dev.log`. Mount guard не теряет первый GET при повторном запуске effects и не обновляет state ушедшей страницы. Этот дополнительный dev test не включён в число 170 сценариев двух основных наборов.

Полная техническая памятка: `WISHLIST.md`. Demo data/SDK существуют только в локальном QA harness с `QA_BROWSER=1`; production routes не содержат seed endpoint, development items не попадают в migration.

29 октября 2026. Только локальный проект Wedding. Итоговый повторный QA после motion revision и правок Venue / Guests: **214/214 расширенных, 49/49 regression browser tests, 164/164 unit/integration tests**. Исторические результаты предыдущих итераций сохранены ниже отдельно.

## Последняя проверенная версия

Дополнительная точечная правка RSVP: intro теперь запускает бумагу и все semantic groups формы одним каскадом (100 ms + 85 ms на группу), независимо от положения отдельных полей относительно viewport. Новые условные поля присоединяются к уже раскрытой сцене. Проверено после изменения: 3 новых browser tests на 375/768/1440 px, 6 choreography tests и 4 RSVP/regression tests; 164 unit/integration, typecheck, lint, production build и diff check успешно. Baselines этой правкой не менялись. Полные числа ниже относятся к предшествующему полному QA-проходу.

- Venue: полностью удалены парковка с разделителем и wrapper, «Рассмотреть площадку ↗» и отдельный нижний dock со стрелками. Нет оставшегося min-height панели или задержек удалённых элементов. Адрес и карта подтянуты. Фотографии, autoplay, пауза после ручного листания, keyboard, swipe и fullscreen сохранены. Pointer capture исправляет завершение свайпа поверх соседнего overlay.
- Guests: на всех breakpoint порядок «карточка пары → заголовок стороны → родственники»; карточки жениха и невесты наклонены на −2° и +2°. На mobile заголовок стороны виден под карточкой. Переключение сторон сохраняет высоту, inert и фокус.
- Venue и Guests отдельно проверены на 280, 320, 375, 390, 430, 768, 1000, 1001, 1024, 1440 и 1920 px. Полная матрица: 100 viewport, 813 состояний; document/masked overflow, clipped text, gaps, small targets, console и network errors: **0** в проверенных сценариях.
- Motion запускается при входе ведущего края элемента на 20–28% высоты экрана снизу: visual80%, scene75%, card77%, detail72% от верхнего края. Normal/reduced motion, быстрый scroll, resize, переход письма через самолётик и keyboard focus проверены. CPU ×4: 1304 кадров, p50 16.7 ms, p95 16.8 ms, max 66.8 ms; это синтетическая проверка Chrome, не замер физического телефона.
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run check:secrets` и `git diff --check`: успешно. Browser: `npm run test:qa` **214/214**, финальный `npm run test:browser` **49/49**. Логи: `qa-artifacts/venue-family-full-qa.log`, `venue-family-browser-verified.log`, `venue-family-unit.log`.
- После ручного просмотра before/after обновлено 90 visual baselines; список и contact sheets указаны в конце отчёта. Pixel tolerances не увеличивались. Один первоначальный full-page desktop capture не успел снять два стабильных кадра за 10 s: передача кадров страницы >20 MP получила 30 s timeout. Три отдельных повторения desktop homepage и полный финальный набор прошли без повторного обновления baselines.
- Production, Amvera, production DB, deployment и push не использовались. Browser/API fixtures локальные; Telegram и organizer data синтетические.

## Summary

- Проверены 100 размеров основной матрицы, от 280 px до 3840 px по ширине, включая 35 соседних breakpoint-размеров.
- Геометрическая матрица: 813 состояний. После motion revision и проверки Venue независимый QA-набор расширен до 214 browser tests: 100 matrix и 114 специализированных сценариев.
- Найдено и исправлено 11 дефектов: один High, девять Medium, один Low. Неисправленных воспроизводимых дефектов в проверенных локальных сценариях не осталось.
- Просмотрены screenshots всех основных секций на 13 representative размерах, отдельные крайние состояния и motion storyboards. Ограничения проверки физических устройств перечислены ниже.
- Добавлены countdown, карточки пары, четыре FAQ и отдельный обратный трансфер; существующий трансфер до площадки сохранён.

## Scope и методика

Проверяется существующий сайт, без нового проекта и без изменения production. Amvera, production PostgreSQL, deployment и push не использовались. Backend-проверки выполняются через реальный RSVP/API-код и временную PostgreSQL-совместимую PGlite. Telegram SDK и organizer data в browser fixture синтетические; отправки реальных сообщений нет.

Добавлен независимый набор `tests/qa`, а не только повтор прежних 49 browser tests. Основная матрица содержит 100 уникальных размеров: все 65 точных размеров из исходного задания и 35 соседних значений около breakpoints. На каждом размере проверяются публичная страница, четыре состояния Dress Code, длинный FAQ, GOING с длинным вводом и NOT_GOING. На 13 representative размерах дополнительно снимаются все основные секции, вся страница и правила площадки. Общая геометрическая матрица: 813 состояний.

Для измерения стабильного layout используется reduced motion. Normal motion отдельно проверяется на 13 размерах, включая portrait, landscape, tablet, ultrawide и эквиваленты reflow при 125/150/200% zoom. Снимки основных секций и обзорные contact sheets просмотрены визуально; отдельные граничные состояния проверяются в исходном разрешении.

Артефакты находятся в локальной папке `qa-artifacts/`, исключённой из Git. JSON-отчёты содержат viewport, CSS selector, bounding box и величину overflow. Намеренный вылет акварельного декора и native horizontal rails материалов отделены от overflow контента. Обнаруживается и overflow внутри маскированного section, а не только document scrollWidth. Gap audit ищет большие промежутки между содержательными элементами и пустой хвост текста lookbook/form.

## Найденные дефекты

| ID | Severity | Воспроизведение / причина | Исправление и retest |
|---|---|---|---|
| UI-01 | Medium | 568×320 и 653×280: короткая бумага и содержимое письма теряли согласованную геометрию; CTA оказывался ниже видимой части сцены. Ширина cqw и минимальные размеры текста рассчитывались по разным ограничениям. | Для высоты ≤500 px введена согласованная 600 px сцена и читаемый прокручиваемый лист. Обычные размеры и последовательность самолётика сохранены. Intro edge tests проверяют доступность CTA, поворот и переход в Hero. |
| UI-02 | Medium | После footer → повторное открытие письма Enter на desktop иногда оставался связан с кнопкой уже скрытого main. | Фокус переносится на кнопку конверта, затем на действие письма. Проверены повторное открытие и клавиатура на восьми граничных размерах. |
| UI-03 | Medium | В fullscreen галерее площадки циклический Tab периодически уходил с контролов диалога в браузере Chrome. | Добавлен явный цикл первого/последнего контрола, как у lookbook. Проверены Tab, Shift/обычная навигация, Escape и возврат фокуса. |
| UI-04 | Medium | 280 px: длинные заголовки программы выходили за колонку шириной 116 px; отдельные scrollWidth превышали её на 7–18 px. | min-width:0 и перенос длинных слов в заголовках. Линия программы продолжает измеряться от реального последнего marker. |
| UI-05 | High | Увеличение текста до 200% обрезало FAQ и некоторые крупные надписи. Нулевой document overflow скрывал проблему внутри clipped section. | Убраны min-content ограничения проблемных колонок; добавлены локальные переносы Hero/FAQ/программы/RSVP/площадки, безопасные части даты. На 280 px дата получает плавный размер 46–54 px и остаётся одной строкой. Countdown допускает дополнительный перенос целых числовых групп при увеличении текста. |
| UI-06 | Medium | Не был указан viewport-fit=cover, поэтому предусмотренные CSS safe-area offsets не получали нужные значения на соответствующих экранах. | Добавлен viewportFit и отступы важных контролов. При CDP inset сверху 44 px плавающая панель располагается на 54 px. Это эмуляция, не физический iPhone. |
| UI-07 | Medium | Reload по fragment URL мог оставлять страницу у Hero: native restoration выполнялся, пока main скрыт до hydration. | Однократное восстановление после раскрытия main, load и fonts.ready. Ручной ввод/скролл отменяет ожидание. Холодный вход и reload проверены для date, venue, dress-code, guests, schedule, questions, rsvp; целевой сценарий повторён три раза. |
| UI-08 | Medium | Цвет обычной inline ссылки FAQ #8e733f давал около 4.09:1 на #f8f4eb при небольшом размере текста. | Сохранён золотой характер, цвет слегка затемнён до #846b3b. Hover/focus и ссылка-заглушка wishlist используют тот же язык. |
| UI-09 | Medium | Новое поле обратного трансфера было в серверном detail formatter, но отсутствовало в явной группировке карточки Mini App. | Добавлена отдельная строка в группе транспорта. Проверены четыре комбинации туда/обратно через draft, реальный API и Mini App. |
| UI-10 | Low | Смена системной настройки на reduced motion после загрузки оставляла классы motion-ready у уже зарегистрированных элементов. | При смене настройки классы очищаются вместе с timeline-ready; содержимое раскрывается сразу. Старый regression и новые motion tests проверяют это поведение. |
| UI-11 | Medium | 1024×900: при scroll к началу гостей последние пиксели Dress Code ещё находились в viewport, поэтому floating tabs перекрывали заголовок следующей секции. | Граница показа теперь учитывает фактическую высоту панели и её top/safe-area offset. Панель целиком остаётся внутри своей секции. Повторены все 11 ширин карточек пары и проверки DPR/reflow/safe-area. |

При добавлении новых функций дополнительно устранены два интеграционных несоответствия: очень узкая дата не должна переносить год с ведущей точкой; новое поле обратного трансфера должно входить не только в серверный formatter, но и в явный список групп деталей Mini App. Эти правки не меняют ранее сохранённые RSVP.

Первоначальные 429 при сотне последовательных fixture-сессий были ограничителем тестового стенда, а не дефектом публичного UI. Каждый тест теперь сбрасывает только синтетическую fixture-БД. Также исправлены ошибочные ожидания новых тестов: имя busy-кнопки меняется при отправке; toast Моти появляется после лимита, а не после первого мяуканья; переход на fragment должен быть завершён до reload. Лимиты приложения не ослаблялись.

## Interaction matrix

| Область | Проверка |
|---|---|
| Intro | Конверт, двойное нажатие, письмо, CTA, промежуточный самолётик, Hero, inert/focus, повтор из footer, поворот экрана |
| Hero / дата | Финальная видимость, читаемая дата с последней 7, reminder .ics с недельным alarm, увеличение текста |
| Venue | Ручные стрелки, свайпы, autoplay и пауза 10 секунд, fullscreen, keyboard loop, Escape, focus return |
| Dress Code | Женщины/мужчины × одежда/аксессуары, все группы, bounded fullscreen, свайпы, resize, быстрые нажатия |
| Materials | Native horizontal rails, отсутствие захвата вертикального скролла, hover/focus hints |
| Floating tabs | Центрирование сверху, scroll-up intent, область своей секции, reflow, safe area, отсутствие pagination внутри |
| Семья | Две стороны на desktop, одна на compact, прежний порядок 15 родственников, две новые карточки пары, возврат из друзей |
| Программа | Все пять времён и подписей, переносы 280 px, линия до последнего marker, последовательное раскрытие |
| FAQ | Все закрыты, ровно один active id, повторное закрытие, быстрый intent, длинные ответы, новые ссылки, keyboard |
| Мотя | Локальное аудио по действию пользователя, лимит сессии, toast; без autoplay |
| RSVP | GOING, NOT_GOING, обязательность, other drinks, максимальный ввод, сокращённый payload, clean next guest |
| RSVP submit | Медленный ответ, double click, отсутствие duplicate, ошибка 503, повтор, success, refresh, сохранённая session |
| Rules / links | Внутренние fragment destinations, правила, browser back, корректные target/rel inline-ссылок |
| Loading | Задержанные шрифты/картинки, повторная загрузка, намеренно сломанные картинки без разрушения формы/FAQ |
| Admin | Прямой вход без initData закрыт, синтетический authorized list/detail/delete, длинные ответы, новое поле |

## Countdown

Отсчёт расположен под существующей композицией даты и календаря. Target берётся из того же content, что дата и время приглашения: **2027-07-17T15:00:00+03:00**, то есть **2027-07-17T12:00:00Z**. Устройство в другом часовом поясе не меняет физический момент свадьбы.

Полные месяцы считаются календарным прибавлением к текущему московскому времени с ограничением дня последним днём нужного месяца. Если кандидат переходит target, число месяцев уменьшается. Остаток раскладывается в дни/часы/минуты/секунды. Месяц не равен условным 30 дням. Последняя неполная секунда округляется вверх; при target и позже значения строго нулевые.

Один client interval раз в секунду заново сравнивает абсолютные timestamps. При hidden вкладке interval очищается; visibilitychange/pageshow сразу пересчитывают остаток и запускают максимум один timer. При unmount всё очищается. Запросов к API/БД/Telegram на каждом tick нет. Browser test проверяет число активных секундных intervals, resume после сдвига времени, достижение нуля и отсутствие запросов.

SSR даёт детерминированное начальное состояние, реальное время устанавливается после mount. Текст и цифры обновляются без повторного reveal. Screen reader получает `role=timer`, `aria-live=off`; секунды не объявляются автоматически.

Desktop и обычный mobile показывают пять групп в строку. При ≤340 px используется 3+2, по центру. При увеличении текста flex layout переносит целые группы, без обрезки подписей. Числа используют существующий Cormorant Garamond и tabular numerals, подписи Montserrat. Заполненных карточек, новых шрифтов и flip-clock нет.

Zero-state сохраняет пять групп и ту же высоту: «Всё. По нулям.», затем 00 месяцев / дней / часов / минут / секунд. Открытие после начала также проверяется.

Unit tests охватывают секунду/минуту/час/день/месяц, конец месяца, 30/31 день, февраль 2027, leap-year clamp, смену года, последнюю миллисекунду, target и дату после него; диапазоны проверены на каждом дне 2026/2027. Отдельно проверены русские окончания. Unit subprocess и browser contexts проверяют Europe/Moscow, Europe/Berlin, Asia/Tokyo, America/New_York в одинаковый абсолютный момент.

Созданы восемь visual states: desktop, mobile, very narrow, landscape, tablet, 200%-reflow, большие значения месяцев/дней и zero. Изображения просмотрены до принятия изменений; узкий вариант скорректирован после просмотра.

## Scroll animations

29 October 2026, second revision. Local only. Envelope, letter and paper-airplane choreography remain separate. No public layout redesign or backend change.

## Trigger policy

Source: `src/client/motion-scenes.mjs`. Leading edges enter reading windows measured from viewport top: **visual80%, scene75%, card77%, detail72%**. IO threshold0; negative bottom margins use pixels calculated from viewport HEIGHT. IO percentage margins resolve against WIDTH and would be incorrect in landscape. Resize recalculates margins without resetting completed scenes.

Previously the positive bottom margin started reveals below the viewport;420–650ms durations and tiny movements made some text feel static. Venue panel and lookbook caption now have independent gates so mobile text below tall images cannot finish offscreen.

Durations and delays below are ms; default easing `cubic-bezier(.22,1,.36,1)`. Opacity/travel run together. No bounce, loops, added parallax or animated backdrop blur.

| Section / trigger | Main effect and sequence | Durations, delays and stagger | Mobile |
|---|---|---|---|
| Hero / main unhidden after airplane | Photo opacity/scale1.035→1; names; date; lines/scroll | Photo1200; names750 at900/990/1080; date600 at1300; details500 at1480; total1980 | Photo1100; names700 at800/900/1000 |
| Date75% | Intro; three date segments; start time | Intro700/800; date750/850 at200/300/400; time700/800 at520 | Existing responsive date geometry retained |
| Calendar80%; reminder72% independently | Paper from side; ornament/month/weekdays/grid; reminder | Paper850/1000; contents700 at100/180/260/360; leaves900 at180; reminder550/650 | Side18; original leaf opacity .24/.25, tablet .28/.25, desktop .34/.38 |
| Countdown75% | Heading; values; unit labels | Heading650/750; values750/800 from160 in100 steps; units650/700 from340 in100 steps | Narrow layout retained; ticks never replay entrance |
| Venue photo80%, panel75% | Photo mask/scale1.025→1; separately gated olive panel; kicker/title/name/address/map | Photo900/1050; panel800/900 at250; contents650/750 from400/520/650; map600/650 at760 | Panel vertical22 instead of horizontal28; own gate below photo. Removed parking/separator and extra CTA/arrow dock have no reserved delay or wrapper |
| Dress heading75%, notices72%, tabs75% | Heading mask/subtitle; notice paragraphs; two tab rows | Heading750/850; subtitle700/800 at140; notices700/850 step140; tabs650/750 step110 | Main rise22 instead of28; original sizes retained |
| Palette heading72%, each family77% | Heading/copy; family name/description; fan of five shades; hint | Heading700/800 step140; family700/800 step120; shades750/850 from260 step110 | Each family gated separately; no offscreen second-fan wave |
| Materials heading72%, groups80%, notes72% | Labels; opposing photo groups and masks; notes | Labels700/850; photos750/900 from180/280/380; notes700/850 | Photo rise18;750/800/850; no lateral travel |
| Lookbook77%, caption77% independently | Heading; cream frame; image; badge; eyebrow/title/caption; pagination | Heading700/800; frame750/850 at160; mask1000 at300 (avoid350); badge550/650 at650; caption700/800 at480/580/700; controls550 at920 | Frame rise22; mask850; caption own gate below photo; slides do not replay entrance |
| Guests heading75%, selectors/labels72%, cards77% | Heading; selectors; couple card; family-side label; relatives. Whole paper cards, portraits and names/roles participate | Cards750/850 with0/100/200 wave; portrait850 from160; name650/750 from260; role from340 | Whole cards rise20, wave0/70/140; desktop opposing24px. Couple prints have balanced -2°/+2° tilt; side labels follow the print on every breakpoint |
| Program heading72%, events75% | Heading/subtitle; progressive stem; per-event time/title/caption | Stem1100; markers450 at160; time750/850; title700/850 at160; caption700/850 at300 | Time travel16 instead of24; each event independently gated |
| FAQ heading72%, rows72% | Heading mask; short row wave; independent accordion | Heading750/850; rows650/750 with0/85/170 repeating | Same behavior; no auto-scroll or added accordion delay; clicked-row compensation runs after layout via ResizeObserver |
| RSVP intro72%, shared trigger for whole form | Heading/intro starts paper and every semantic group, including fields below viewport; action/privacy follow | Paper750/850; groups650/750; cumulative delays100ms +85ms per group; success opacity450 | No per-field viewport gate; newly mounted details join the completed intro scene; keyboard and reduced-motion bypass retained |
| Footer75% or document-end fallback | Quiet rise/opacity | 650/750 | Remains reachable when tall viewport prevents reaching75% gate |
| Botanicals80% | Opacity and scale .98→1 | 900/1000 at180 | Existing computed opacity captured; no new assets |

## Lifecycle, accessibility and compatibility

Stable scene keys remember completed entrances across scrolling and category/slide changes. Inert family content registers on activation. Countdown text-node updates do not trigger page registration. One shared passive scroll/resize RAF continues to serve both motion and floating tabs.

A jump exceeding90% viewport height exposes passed/current content immediately. Ordinary smaller scroll uses reading windows. At document end visible pending content reveals even if a gate is physically unreachable. Focus bypass applies only to pending ancestors, avoiding a snap when already appearing controls gain focus. Instant overrides last two frames and do not disable later hover/swipe.

Floating dock keeps220ms transition, upward intent and portal placement. Venue autoplay and manual pause window remain independent. Gallery swipe/modal controls and RSVP two-guest session/validation are unchanged. No main transform, animated margins or section heights.

Reduced motion exposes content immediately with no entrance masks, translation or stagger. Switching preference flushes pending scenes. Controls never require finishing an animation for access.

## Browser evidence

`tests/qa/choreography.spec.ts`: pending at90% viewport, visible intermediate animation inside58–80%, settled compositions at390/768/1440; Hero mid/after at375/1440; restored scroll/focus/reduced motion.

`tests/qa/motion.spec.ts`:22 normal-motion viewport/reflow sizes, fast/back scroll, finished heading masks and unshifted cards, CPU4× storyboard, reduced motion. Existing100-viewport layout matrix and interaction suites retained. The125/150/200% zoom scenarios use equivalent CSS reflow, not native browser-menu zoom.

Before/mid/after screenshots and performance JSON are local artifacts under ignored `qa-artifacts/`. Ordinary baselines are captured after animation completion. Final counts and limitations are in `FULL_UI_UX_QA_REPORT.md`. The page has one photo Hero plus couple cards; no separate two-photo chapter was invented.


## FAQ и обратный трансфер

После «Как добраться обратно» добавлены ровно четыре пункта, в заданном порядке: своя машина; оставить машину; опоздание; изменение планов. Затем прежние правила площадки и контакты. Сохранён один active FAQ state и возможность закрыть всё.

«Фёдоровского» ведёт на предоставленный Yandex Maps URL. «Максиму» и «Ане» используют существующие Telegram destinations. Все настоящие внешние ссылки имеют `_blank` и `noopener noreferrer`, обычный accent-link и keyboard focus. Wishlist остаётся null placeholder без fake navigation.

**Трансфер до площадки сохранён:** самостоятельно / от Купчино / от Павловска. Новый `returnTransfer` независим от него, значения `needed` / `not_needed`. Для GOING требуется явный выбор на client и server; NOT_GOING отправляет только краткий payload. Сообщение об ошибке находится рядом с группой, radio labels имеют touch height ≥44 px.

Поле сохраняется в versioned draft, восстанавливается после refresh, очищается для нового гостя и хранится отдельной PostgreSQL колонкой `return_transfer`. Миграция `011_return_transfer.sql` добавляет nullable колонку и constraints, не изменяет старые ответы. У исторических записей отображается «Не указано», ответ не придумывается.

Mini App и подробный Telegram formatter показывают отдельную строку «Обратный трансфер до Купчино». Короткое основное push-уведомление по-прежнему содержит только имя гостя и кнопку открытия; транспортные сведения туда не добавлены, поскольку текущий push их не содержит.

Unit migration test создаёт запись до migration 011, проверяет её сохранность и NULL, затем сохраняет оба значения через реальный repository и читает organizer detail. Browser tests проходят четыре независимые комбинации туда/обратно, draft, API и Mini App. Новые FAQ проверяются на 280/320/360/375/390/430 px; новое поле отдельно на девяти portrait/landscape/tablet/desktop размерах.

## Карточки пары

В каждой стороне семьи над двумя колонками находится одна карточка: Максим / Жених и Аня / Невеста. На compact layout видна карточка только выбранной стороны, по центру. Две карточки не входят в счётчик 15 родственников и не появляются у друзей. Сохраняются существующие бумага, тень, небольшой наклон и типографика.

Последняя композиционная правка: порядок в DOM и визуально одинаковый на desktop/mobile: вводная карточка → заголовок стороны → родственники. Максим имеет -2° наклон влево, Аня +2° вправо. Заголовок стороны теперь видим и на compact layout. Browser tests проверяют порядок, знак/величину наклона, вертикальные границы, центрирование, активную сторону, отсутствие карточек пары у друзей и сохранение высоты при переключении.

## Venue: удаление дополнительной композиции

Полностью удалены DOM-элементы «Есть парковка», разделитель/обёртка venue-arrival, подпись «Рассмотреть площадку ↗» и дополнительная плашка стрелок. Удалены их content keys, неиспользуемые CSS rules и entrance delays. У панели убран min-height680px; она занимает высоту оставшегося содержания. Карта идёт после адреса, без пустой строки/старого блока парковки. Высота большого фото desktop сохранена как часть панорамной композиции.

Фото остаётся настоящей кнопкой с accessible name. Сохраняются click/fullscreen, keyboard arrows, swipe, autoplay и10-секундная пауза после ручного листания; controls внутри fullscreen остаются. Pointer capture исправляет жест, начинающийся на фото и заканчивающийся поверх панели. Motion содержит только фото, панель, kicker/heading/name/address и карту; карта начинается на760ms вместо прежнего950ms, отдельного1000ms ожидания удалённых controls нет.

Добавлены11 browser scenarios Venue и обновлены11 сценариев пары на280/320/375/390/430/768/1000/1001/1024/1440/1920px. Все22 целевые проверки прошли до продолжения полного QA. Actual screenshots каждого размера сохранены в qa-artifacts/venue-clean-W.png и couple-W.png; desktop/mobile/tablet просмотрены вручную. Существующий тест autoplay/manual pause также прошёл с keyboard navigation вместо удалённой плашки.

Использованы только приложенные заглушки. Локальные WebP сохраняют исходные размеры: Максим 544×800, Аня 115×115. Маленький исходник Ани мягкий на больших экранах; AI-upscale и генерация не выполнялись. Mapping и SHA записаны в `MEDIA_ASSETS.json`. Центрирование, положение над родственниками, переключение, keyboard, сохранение высоты и отсутствие карточек у друзей проверяются на 11 ширинах, включая 1000/1001 px.

## Responsive matrix

Повторный прогон: 100/100 размеров прошли. Статус FIXED означает исправленный дефект в соответствующем размере с последующим retest; PASS означает отсутствие найденного дефекта в проверенных состояниях, а не сертификацию всех возможных устройств.

| Viewport | Состояний | Результат |
|---|---:|---|
| 280×653 | 8 | FIXED |
| 320×480 | 8 | FIXED |
| 320×568 | 9 | FIXED |
| 320×640 | 8 | FIXED |
| 360×640 | 8 | PASS |
| 360×720 | 8 | PASS |
| 375×667 | 9 | PASS |
| 375×812 | 8 | PASS |
| 390×844 | 9 | PASS |
| 393×852 | 8 | PASS |
| 412×915 | 8 | PASS |
| 414×896 | 8 | PASS |
| 430×932 | 9 | PASS |
| 360×800 | 8 | PASS |
| 390×1000 | 8 | PASS |
| 480×854 | 8 | PASS |
| 568×320 | 8 | FIXED |
| 640×360 | 8 | FIXED |
| 667×375 | 8 | FIXED |
| 740×360 | 8 | FIXED |
| 812×375 | 8 | FIXED |
| 844×390 | 9 | FIXED |
| 896×414 | 8 | FIXED |
| 932×430 | 8 | FIXED |
| 280×720 | 8 | FIXED |
| 300×900 | 8 | FIXED |
| 540×720 | 8 | PASS |
| 653×280 | 8 | FIXED |
| 600×960 | 8 | PASS |
| 768×1024 | 9 | PASS |
| 800×1280 | 8 | PASS |
| 820×1180 | 8 | PASS |
| 834×1194 | 8 | PASS |
| 960×600 | 8 | PASS |
| 1024×768 | 9 | FIXED |
| 1180×820 | 8 | PASS |
| 1194×834 | 8 | PASS |
| 1280×800 | 8 | PASS |
| 1024×600 | 9 | FIXED |
| 1152×648 | 8 | PASS |
| 1280×720 | 8 | PASS |
| 1366×768 | 9 | PASS |
| 1440×900 | 9 | PASS |
| 1536×864 | 8 | PASS |
| 1600×900 | 8 | PASS |
| 1680×1050 | 8 | PASS |
| 1920×1080 | 9 | PASS |
| 1920×1200 | 8 | PASS |
| 2048×1152 | 8 | PASS |
| 2560×1440 | 9 | PASS |
| 2560×1600 | 8 | PASS |
| 2880×1800 | 8 | PASS |
| 2560×1080 | 8 | PASS |
| 3440×1440 | 9 | PASS |
| 3840×1600 | 8 | PASS |
| 1000×400 | 8 | FIXED |
| 1200×500 | 8 | FIXED |
| 500×1000 | 8 | PASS |
| 900×1400 | 8 | PASS |
| 1400×600 | 8 | PASS |
| 2000×700 | 8 | PASS |
| 391×844 | 8 | PASS |
| 853×393 | 8 | FIXED |
| 1001×701 | 8 | PASS |
| 1365×767 | 8 | PASS |
| 498×900 | 8 | PASS |
| 499×900 | 8 | PASS |
| 500×900 | 8 | PASS |
| 501×900 | 8 | PASS |
| 502×900 | 8 | PASS |
| 598×900 | 8 | PASS |
| 599×900 | 8 | PASS |
| 600×900 | 8 | PASS |
| 601×900 | 8 | PASS |
| 602×900 | 8 | PASS |
| 698×900 | 8 | PASS |
| 699×900 | 8 | PASS |
| 700×900 | 8 | PASS |
| 701×900 | 8 | PASS |
| 702×900 | 8 | PASS |
| 766×900 | 8 | PASS |
| 767×900 | 8 | PASS |
| 768×900 | 8 | PASS |
| 769×900 | 8 | PASS |
| 770×900 | 8 | PASS |
| 798×900 | 8 | PASS |
| 799×900 | 8 | PASS |
| 800×900 | 8 | PASS |
| 801×900 | 8 | PASS |
| 802×900 | 8 | PASS |
| 898×900 | 8 | PASS |
| 899×900 | 8 | PASS |
| 900×900 | 8 | PASS |
| 901×900 | 8 | PASS |
| 902×900 | 8 | PASS |
| 998×900 | 8 | PASS |
| 999×900 | 8 | PASS |
| 1000×900 | 8 | PASS |
| 1001×900 | 8 | PASS |
| 1002×900 | 8 | PASS |

## Проверки и baselines первого QA-прохода

Ниже результаты первого QA-прохода до отдельной motion revision. Снимки принимались после просмотра diff. Актуальные дополнительные результаты находятся в следующем разделе.

| Проверка | Финальный результат |
|---|---|
| npm run typecheck | PASS |
| npm run lint | PASS |
| npm test | 158/158, включая migration и Mini App authorization |
| npm run test:qa | 188/188, без skipped/flaky |
| npm run test:browser | 49/49, без обновления baselines в финальном прогоне |
| npm run build | PASS; также выполнен в обеих browser-командах |
| npm run check:secrets | PASS, без раскрытия значений |
| git diff --check | PASS |

Всего 237 различных browser tests в двух наборах. В матрице из 813 состояний: 0 document overflow, 0 masked content overflow, 0 clipped text, 0 excessive gaps, 0 small-target findings, 0 console errors и 0 ошибочных локальных HTTP responses. Это результат конкретных detector rules и визуальной проверки, а не гарантия всех устройств.

В последнем отдельном CPU 4× sample: 353 RAF-интервала, p50 16.7 ms, p95 33.3 ms, максимум 50.1 ms. Cold/cached CLS в тесте с задержанными assets: 0.00247 / 0.00247. Эти числа относятся к локальному Chrome и синтетическому сценарию.

Ручной просмотр actual/diff выполнен до обновления. Изменено 112 прежних baselines: новые countdown/карточки пары/FAQ/обратный трансфер, contrast/focus и сопутствующая растеризация текста. У изолированных component snapshots сохранён существующий fixture-helper; полные страницы и независимая QA-матрица проверяют настоящий layout без его подмены. Это ограничение старого regression-набора отдельно компенсируется независимыми screenshot/geometry tests.

<details><summary>Изменённые browser baselines (112)</summary>

- congratulations-default.png
- congratulations-error.png
- congratulations-private.png
- congratulations-public.png
- congratulations-together.png
- dress-allowed.png
- dress-avoid.png
- dress-families-men-1440.png
- dress-families-men-320.png
- dress-families-women-1440.png
- dress-families-women-320.png
- dress-men.png
- dress-notices-1440.png
- dress-women.png
- envelope-mobile-seal.png
- envelope-open.png
- envelope-sealed.png
- faq-expanded.png
- faq-speeches-1440.png
- faq-transfer-to-1440.png
- fashion-men-accessories-1440.png
- fashion-men-accessories-375.png
- fashion-men-clothes-1440.png
- fashion-men-clothes-375.png
- fashion-overlay-men-accessories.png
- fashion-overlay-men-clothes.png
- fashion-overlay-women-accessories.png
- fashion-overlay-women-clothes.png
- fashion-women-accessories-1440.png
- fashion-women-accessories-375.png
- fashion-women-clothes-1440.png
- fashion-women-clothes-375.png
- final-look-butter-column-1440.png
- final-look-butter-column-375.png
- final-look-chartreuse-midi-1440.png
- final-look-chartreuse-midi-375.png
- final-look-deep-olive-slip-1440.png
- final-look-deep-olive-slip-375.png
- final-look-eucalyptus-embroidered-1440.png
- final-look-eucalyptus-embroidered-375.png
- final-look-ivory-short-1440.png
- final-look-ivory-short-375.png
- final-look-men-accessories-brown-1440.png
- final-look-men-accessories-brown-375.png
- final-look-men-accessories-neon-1440.png
- final-look-men-accessories-neon-375.png
- final-look-men-accessories-olive-1440.png
- final-look-men-accessories-olive-375.png
- final-look-men-accessories-print-1440.png
- final-look-men-accessories-print-375.png
- final-look-men-accessories-sport-1440.png
- final-look-men-accessories-sport-375.png
- final-look-men-accessories-tie-1440.png
- final-look-men-accessories-tie-375.png
- final-look-olive-short-1440.png
- final-look-olive-short-375.png
- final-look-sage-ballgown-1440.png
- final-look-sage-ballgown-375.png
- final-look-warm-gold-asymmetric-1440.png
- final-look-warm-gold-asymmetric-375.png
- final-look-women-accessories-cream-1440.png
- final-look-women-accessories-cream-375.png
- final-look-women-accessories-gold-1440.png
- final-look-women-accessories-gold-375.png
- final-recommended-butter-column-375.png
- final-recommended-deep-olive-slip-375.png
- guests-friends-1440.png
- guests-friends-375.png
- guests-relatives-1440.png
- guests-relatives-375.png
- guests-relatives-bride-375.png
- homepage-1440x900.png
- homepage-375x812.png
- homepage-430x932.png
- lookbook-below-chapter.png
- lookbook-clown-1440.png
- lookbook-clown-375.png
- lookbook-clown-fullscreen-375.png
- lookbook-fullscreen-375.png
- lookbook-short-frame.png
- material-desktop-hint.png
- materials-black-warning-1440.png
- materials-men-accessories-1440.png
- materials-men-clothes-1440.png
- materials-women-accessories-1440.png
- materials-women-clothes-1440.png
- october-date-1440.png
- october-date-375.png
- october-schedule-1440.png
- october-venue-1440.png
- relatives-swipe-bride.png
- relatives-swipe-groom.png
- relatives-switch-bride.png
- relatives-switch-groom.png
- relatives-tap-bride.png
- relatives-tap-groom.png
- rsvp-agreements.png
- rsvp-food-block.png
- rsvp-going.png
- rsvp-intro-375.png
- rsvp-not-going.png
- rsvp-session-multiple.png
- rsvp-success-first.png
- rsvp-success-second.png
- telegram-congratulations.png
- telegram-detail-long.png
- telegram-review-detail.png
- venue-panorama-desktop.png
- women-clothing-v3-anti-1440.png
- women-clothing-v3-anti-375.png
- women-clothing-v3-approved-1440.png
- women-clothing-v3-approved-375.png

</details>

Новые countdown baselines (8): `countdown-desktop.png`, `countdown-landscape.png`, `countdown-large-values.png`, `countdown-mobile.png`, `countdown-tablet.png`, `countdown-very-narrow.png`, `countdown-zero.png`, `countdown-zoom-200-reflow.png`.

После первого полного повторного QA исправлены ещё два воспроизведения: date при text 200% с reduced motion и floating dock над началом Guests на 1024 px. После этого повторён весь независимый набор 188/188 и обычный набор 49/49. После fixes дополнительно просмотрено и принято одно отличие растеризации цифр пагинации fashion-women-accessories-375.png (212 pixels); допуски сравнения не менялись. Затем обычный regression повторён целиком.


Команды:

```powershell
npm run test:qa
npm run test:browser
npm run typecheck
npm run lint
npm test
npm run build
npm run check:secrets
git diff --check
```

`npm run test:qa` создаёт independent screenshots, JSON layout audit, traces при ошибках и report в `qa-artifacts/`. Countdown visual baselines находятся в `tests/qa/__screenshots__/chrome/win32/`. Исходные browser baselines остаются в `tests/browser/__screenshots__/chrome/win32/`.

## Motion revision: review, defects and evidence

**Последняя правка после визуального ревью:** запуск перенесён раньше, при входе примерно20–28% viewport-height композиции. Leading-edge gates теперь visual80%, scene75%, card77%, detail72% от верха экрана. Длительности и choreography не менялись. Проверки обновлены: pending на90%, вход до70% и обязательное промежуточное состояние. На финальной сборке7/7 targeted browser tests (390/768/1440, Hero375/1440, restore/focus/reduce, modal320×480),164/164 unit/integration, typecheck/lint/build прошли.

Перед этой корректировкой порогов обычный regression прошёл49/49 без snapshot update. Расширенный набор завершил202/203: один тест оборвался на setup POST /qa/reset с ECONNRESET локального test proxy, до действий на странице; его повтор на финальной сборке прошёл в указанных7/7. Таким образом203 различных расширенных сценария имеют успешное выполнение, но последний полный запуск не объявляется203/203 green. Новые пороги дополнительно проверены в54 scene-exposure сценариях внутри трёх choreography tests.10/10 повторов длинного FAQ прошли после ResizeObserver fix. Новых baselines в motion revision нет.

Этот проход заменяет прежние короткие entrance-анимации. Ранними были общие появления с положительным нижним root margin: они запускались ещё под экраном. Быстрыми были420–650ms раскрытия palette, materials, notices и captions; малые смещения почти не читались. Частично статичными оставались supporting copy, controls, бумажные рамки, названия/роли гостей и semantic groups формы. Полная новая choreography, реальные durations и58/60/62/80% gates записаны в Scroll animations выше и MOTION_MAP.md.

В ручной проверке и regression обнаружены и исправлены дополнительные motion edge cases:

1. Финальный selector заголовка уступал начальному selector по специфичности. Заголовки Program/Dress/FAQ могли оставаться под100% mask после завершения reveal. Финальный selector усилен; browser tests теперь проверяют computed mask и opacity, а не только data-motion-state.
2. У второй группы материалов и карточек невесты более специфичный начальный selector сохранял lateral offset после reveal. Финальные selectors сбрасывают его; проверяется отсутствие остаточного translate.
3. Footer на2560×1440 и3440×1440 физически не доходил до75% reading gate. На конце документа включён ограниченный fallback для видимого pending content.
4. Focus на уже появляющемся control повторно включал instant bypass. Теперь bypass касается только pending ancestors, сохраняя положение уже раскрытого элемента.
5. Переключение длинного FAQ иногда давало однокадровое смещение80–87px. Покадровая диагностика показала запаздывающий RAF layout measurement. Компенсация дополнена ResizeObserver после layout, до paint, с временным отключением native scroll anchoring. Следующее действие пользователя освобождает anchor; состояние чистится при завершении/unmount. Допуски тестов не увеличены. После исправления10/10 повторов mobile/desktop прошли.

В живом локальном браузере просмотрены Hero, Date/calendar/countdown, Venue, Dress intro/palette/materials/lookbook, Guests, Program, FAQ, RSVP и Footer. Дополнительно проверены обычный, медленный и быстрый wheel, mobile390×844 и desktop1440×900, переход NOT_GOING и раскрытие длинного FAQ. Проверка после CSS fix подтвердила видимый заголовок Program. На каждой секции оценивались заметность, своевременность, участие текста/контролов/декора, отсутствие bounce и повторения одного эффекта на всём сайте.

Мобильные фото и тексты получили независимые reading gates, группы палитры раскрываются отдельно. Основной сдвиг16–30px, без масштабирования всей страницы; карточки mobile движутся вертикально. На desktop остаются встречные движения панелей и карточек. Reduced motion, fast/back scroll, восстановленная позиция и изменение ориентации не оставляют скрытого контента.

Просмотрены166 новых кадров:18 semantic anchors ×3 ширины390/768/1440 ×before/mid/after, плюс Hero mid/after375/1440. Контактные листы: qa-artifacts/review-motion-{390,768,1440}-{1,2,3}.jpg. Эти состояния добавлены как local QA artifacts, без замены settled visual baselines.

CPU4×:1348 RAF samples, p50≈16.7ms, p95≈16.8ms, max≈66.7ms. В сценарии не обнаружена устойчивая потеря плавности; единичный длинный кадр остаётся. Это измерение desktop Chrome под искусственным slowdown, не обещание FPS физического телефона и не строгое A/B сравнение разных storyboard-наборов. Parallax/animated blur не добавлены.

Повторная геометрическая матрица100 viewport /813 states:0 document overflow,0 masked content overflow,0 clipped text,0 excessive gaps,0 small targets,0 console/network errors в рамках detector rules. Normal-motion отдельно проверяется на22 размерах/reflow, включая18 требуемых размеров и эквиваленты125/150/200% zoom. Для основных scenes проверяется pending на90% высоты и промежуточная анимация после входа в58–80% reading window.

Countdown tick/zero/large values, Venue autoplay/manual pause, floating tabs/upward intent/portal, swipe, category switching, keyboard/focus, modals и оба RSVP success-state остаются в regression suite. Backend/session/admin business logic этим motion pass не менялась.

Для текущей motion revision visual baselines не обновлялись: settled layout сохраняется. Перечень112 обновлённых и8 новых countdown baselines выше относится к предшествующему полному QA, а не к этой переработке.

## Remaining risks и границы проверки

- Это Chrome на Windows с browser emulation. Физические Safari/iOS/Android, настоящий вырез экрана, системная клавиатура и OS overscroll не проверены на реальных устройствах.
- Zoom проверяется через equivalent CSS reflow viewport/deviceScaleFactor, отдельно DPR 1/1.25/1.5/2/3 и увеличение текста 200%. Это не управление нативным меню Chrome Zoom.
- Для клавиатуры телефона эмулируется уменьшенный viewport с focus/scroll; это не доказательство поведения конкретной экранной клавиатуры iOS.
- Внешние destinations проверяются по URL, target/rel и доступности ссылок в интерфейсе. Наличие аккаунта на стороне Telegram/доступность внешнего сервиса не обещается. Реальный Telegram initData и production delivery не вызываются.
- Нагрузочная проверка на реальном hosting, production migration и реальные RSVP не входят в локальный UI pass. Все SQL-тесты используют временные данные.
- Фото Ани остаётся временным низкого разрешения, как указано пользователем.
- Существующая рабочая папка уже содержит множество изменений предыдущих этапов. Ничего не сбрасывалось и не отправлялось в GitHub.


## Baselines последней правки Venue / Guests

После просмотра before/actual/diff приняты 90 обновлённых baselines. Основные изменения: удаление CTA/стрелок/парковки, компактная панель, новый порядок и зеркальные наклоны карточек пары. В остальных мобильных component snapshots сохранены содержание и layout; изменилась субпиксельная растеризация и округление crop на1px из-за другой высоты предшествующего Venue. Временный эксперимент с восстановлением старой offscreen-высоты удалён: новые снимки фиксируют текущую страницу без дополнительной Venue-заглушки. Допуски screenshot comparison не увеличены.

Показаны и просмотрены8 contact sheets baseline-venue-review-1...8.jpg и отдельные actual/diff крупных изменений. SHA-256 manifest и копии до обновления сохранены локально в qa-artifacts/venue-family-baselines-before.json и venue-family-before/. Machine-readable перечень: qa-artifacts/venue-family-baselines-changed.json.

<details><summary>Обновлённые baselines (90)</summary>

- congratulations-default.png
- congratulations-error.png
- congratulations-private.png
- congratulations-public.png
- congratulations-together.png
- dress-accessories-cream-gold-base-375.png
- dress-accessories-cream-gold-base-430.png
- dress-accessories-olive-base-375.png
- dress-accessories-olive-base-430.png
- dress-allowed.png
- dress-avoid.png
- dress-families-men-320.png
- dress-families-women-320.png
- dress-men.png
- dress-notices-375.png
- dress-notices-430.png
- dress-women.png
- faq-expanded.png
- faq-speeches-375.png
- faq-transfer-back-375.png
- faq-transfer-to-375.png
- fashion-men-accessories-375.png
- fashion-men-clothes-375.png
- fashion-overlay-men-accessories.png
- fashion-overlay-men-clothes.png
- fashion-overlay-women-accessories.png
- fashion-overlay-women-clothes.png
- fashion-women-accessories-375.png
- fashion-women-clothes-375.png
- final-look-butter-column-375.png
- final-look-chartreuse-midi-375.png
- final-look-deep-olive-slip-375.png
- final-look-eucalyptus-embroidered-375.png
- final-look-ivory-short-375.png
- final-look-men-accessories-brown-375.png
- final-look-men-accessories-neon-375.png
- final-look-men-accessories-olive-375.png
- final-look-men-accessories-print-375.png
- final-look-men-accessories-sport-375.png
- final-look-men-accessories-tie-375.png
- final-look-olive-short-375.png
- final-look-sage-ballgown-375.png
- final-look-warm-gold-asymmetric-375.png
- final-look-women-accessories-cream-375.png
- final-look-women-accessories-gold-375.png
- floating-original-375.png
- guests-friends-375.png
- guests-relatives-1440.png
- guests-relatives-375.png
- guests-relatives-bride-375.png
- homepage-1440x900.png
- homepage-375x812.png
- homepage-430x932.png
- lookbook-below-chapter.png
- lookbook-clown-375.png
- lookbook-notices-mobile.png
- lookbook-original-tabs.png
- lookbook-palette-mobile.png
- lookbook-short-frame.png
- lookbook-top-mobile.png
- materials-black-warning-375.png
- materials-men-accessories-375.png
- materials-men-clothes-375.png
- materials-women-accessories-375.png
- materials-women-clothes-375.png
- motya-faq-link.png
- october-schedule-375.png
- october-venue-1440.png
- october-venue-375.png
- relatives-swipe-bride.png
- relatives-swipe-groom.png
- relatives-switch-bride.png
- relatives-switch-groom.png
- relatives-tap-bride.png
- relatives-tap-groom.png
- rsvp-agreements.png
- rsvp-food-block.png
- rsvp-going.png
- rsvp-intro-375.png
- rsvp-not-going.png
- rsvp-session-multiple.png
- rsvp-success-first.png
- rsvp-success-second.png
- venue-panorama-desktop.png
- venue-panorama-mobile.png
- venue-pushkinskaya.png
- women-clothing-v3-anti-375.png
- women-clothing-v3-anti-430.png
- women-clothing-v3-approved-375.png
- women-clothing-v3-approved-430.png

</details>


## Wishlist expanded catalogue, 31 October 2026

Latest local verification: 192 unit/integration, 62 browser regression and 333 full UI/UX QA tests passed. See WISHLIST_COMPLETION_REPORT.md for the final catalogue, one-time import safety, responsive checks, visual baselines and practical limits. No production access, deployment or push.
