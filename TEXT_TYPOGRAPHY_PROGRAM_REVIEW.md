# Локальная типографика, тексты, программа и друзья — 25 октября 2026

Production/Amvera/production DB/deployment не использовались. Backend/API/RSVP business logic не менялись. Push/commit не выполнялись.

## Дата

Выбран существующий локальный **Marck Script**: public/fonts/font-5.ttf, лицензия public/fonts/LICENSE-marckscript.txt. Сравнён с локальными Bad Script и Cormorant Garamond italic. Marck Script выбран за выразительные, различимые и достаточно плотные цифры; новые fonts/CDN не добавлялись. Royal Kaynin и остальные роли шрифтов не менялись.

Исправлены: скрытие date-large через display:none на mobile; отсутствие запаса под выносные штрихи при clip-path; тесная геометрия inline time. Дата теперь отдельный block с width:max-content/max-width:100%, box-sizing:border-box, внутренними полями .12em .22em .2em, line-height:1.45 и letter-spacing:.015em. Размер desktop clamp(50px,5.8vw,94px), mobile clamp(52px,14vw,68px). Финальная reveal-маска inset(-.2em -.25em) оставляет место чернилам. Reduced motion по-прежнему снимает маску. Мобильный порядок: вводный текст, дата, календарь, время. Внешнее ограничение декора секции сохранено.

Проверены 320/375/390/430/768/1440: дата видима целиком, последняя 7 внутри контейнера. Браузерный тест измеряет actualBoundingBoxLeft/Right цифр через Canvas, запас внутри time и границы секции, а не только scrollWidth; проверяет reduced/normal motion. Скриншоты всех шести ширин просмотрены; кадры в test-results и tmp/text-polish.

## RSVP intro

Оставь нам пару слов. Мы очень хотим увидеть тебя за нашим, а в идеале за соседним столом.

Стили/структура формы и submit/session validation не менялись. Проверены переносы на mobile.

## Как всё будет

| Время | Событие | Подпись |
|---|---|---|
| 15:00 | Встречаемся на площадке | Потом пускать не будем. Ну только если очень сильно попросите. |
| 15:30 | Церемония | Можно плакать, разрешаем. Можно и не плакать. |
| 16:00 | Начало банкета | С этого момента всё серьёзно. Едим, пьём и начинаем отмечать. |
| 21:00 | Дискотека | К этому времени уже можно не делать вид, что вы пришли только поесть. |
| 22:00 | Расходимся | Да, рано. Нет, это не ошибка. У площадки тоже есть свои дедлайны. |

Подписи используют существующие 16px desktop/15px mobile, line-height 1.8, спокойную opacity .8 и ограничение ширины 470px. Заголовки остаются крупнее. Времена и порядок не менялись. Существующий ResizeObserver обновляет хвост линии по реальной высоте последнего пункта, включая подпись; проверено совпадение конца линии и маркера 22:00 на шести ширинах. Timeline reveal/progress и reduced-motion fallback сохранены. Подписи — обычные семантические p, не aria-hidden.

## FAQ

Новый заголовок: **Поздравления и поздравительные речи**.

Первый абзац сохранён дословно. Второй отдельный p:

Если вы хотите сделать какое-то необычное поздравление и вам для этого нужно будет включить видео, музыку, фотографии или что вы там ещё придумаете, то их надо отправить нашему диджею Ивану за несколько дней до мероприятия, то есть не позднее 14.07.2027.

Ссылка «диджею Ивану»: https://t.me/apseng_vane, target=_blank, rel=noopener noreferrer. Использует существующий question-link, включая hover/focus-visible. Accessible name — диджею Ивану. Проверены открытие/закрытие accordion клавиатурой, два абзаца, дата дедлайна, точное «то есть» и keyboard focus.

## Новые друзья

Сначала пользователь разрешил две перестановки, затем явно разрешил заменить фотографии друзей (это заменяет прежнее ограничение не добавлять их).

| Порядок вложений | Имя | ID | Файл |
|---|---|---|---|
| 1 | Карина | friends-2 | public/images/guests/friends/karina.webp |
| 2 | Асель | friends-7 | public/images/guests/friends/asel.webp |
| 3 | Александра | friends-5 | public/images/guests/friends/alexandra.webp |
| 4 | Ирина | friends-9 | public/images/guests/friends/irina.webp |
| 5 | Илья | friends-4 | public/images/guests/friends/ilya.webp |
| 6 | Даниил | friends-8 | public/images/guests/friends/daniil.webp |
| 7 | Анастасия | friends-10 | public/images/guests/friends/anastasia.webp |
| 8 | Виктория | friends-0 | public/images/guests/friends/viktoria.webp |
| 9 | Сергей | friends-1 | public/images/guests/friends/sergey.webp |
| 10 | Денис | friends-3 | public/images/guests/friends/denis.webp |
| 11 | Андрей | friends-6 | public/images/guests/friends/andrey.webp |

Все 11 — 800×1000 WebP quality 90, 4:5. Никакой генерации, ретуши или изменения внешности. Центрированный crop до 4:5; у Андрея убрана часть свободного неба/нижнего края исходника, лицо и волосы сохранены. Проверено визуально mobile/desktop. Данные/IDs не зависят от порядка отображения.

Финальный порядок: Виктория, Сергей, Карина, Денис, Александра, Илья, Андрей, Асель, Ирина, Даниил, Анастасия. Обе требуемые пары поменяны местами. Родственники не менялись. У всех 26 гостей теперь утверждённые фотографии.

Удалены 11 больше не используемых numeric placeholders: guest-2/5/6/9/10/12/13/18/23/24/25.jpg. Проверены src/tests/scripts и динамическая карта; прямых runtime/test refs не осталось. Полная provenance/размеры — MEDIA_ASSETS.json. Звуки Моти не менялись.

## Regression подход

Полный первый npm run test:browser выполнен до обновления эталонов. Реальные Date/Program/FAQ/RSVP/friends и намеренные diffs просмотрены. Полные homepage всегда проверяют реальный текущий layout. Изолированные component screenshots временно фиксируют старую геометрию только вне снимаемого блока: это предотвращает смену subpixel-сглаживания неизменённых секций из-за новой высоты даты/программы/FAQ. Новые captions/intro/FAQ не скрываются в собственных snapshots; пороги pixel comparison не ослаблялись. Unrelated venue/dress/Мотя baselines остаются прежними.

Этот пакет полностью прошёл typecheck, lint, 99 unit/integration tests, 32 browser tests, production build, check:secrets и git diff --check до следующей задачи о группировке Родных. Изменённые baselines: congratulations-error.png, congratulations-together.png, faq-expanded.png, guests-friends-1440.png, guests-friends-375.png, homepage-1440x900.png, homepage-375x812.png, homepage-430x932.png, october-date-1440.png, october-date-375.png, october-schedule-1440.png, october-schedule-375.png, rsvp-going.png, rsvp-not-going.png. Новые baselines: faq-speeches-1440.png, faq-speeches-375.png, rsvp-intro-1440.png, rsvp-intro-375.png. Остальные эталоны сохранены побайтово. Дальнейшая группировка Родных документируется отдельно в FAMILY_LAYOUT_REVIEW.md.

Денис: после первоначального пакета пользователь выбрал другое фото (codex-clipboard-48cbf13c-58c9-460b-b710-22d44cc7c6cb.png). denis.webp заменён последним изображением, без изменения ID/позиции. В публичном каталоге только один актуальный файл Дениса.
