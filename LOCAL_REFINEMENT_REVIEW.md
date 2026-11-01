# Локальный пакет 26.10.2026

Production, Amvera, production DB и deployment не использовались. Push/commit не выполнялись. Данные и порядок людей, desktop-разделение семьи и swipe logic сохранены.

## Конверт и дата

Надпись Anya & Maxim (пользователь назвал её Maxim & Anya) сохраняет свой текст и шрифт, цвет взят из существующего --ink, #30382b. Контраст с cream-фоном превышает 10:1.

На mobile до 600 px центр сургуча привязан к 54% высоты самой кнопки/лицевой стороны конверта. translate:-50% -50% учитывает размер печати; ранее top:42% позиционировал верхний край печати и её центр оказывался примерно на 60% высоты конверта. Desktop, размеры, бумага и последовательность открытия/самолётика сохранены. Browser regression измеряет привязку при высотах 650/932 px.

Дата использует уже локально подключённый Bad Script (typography-0.ttf, существующая лицензия). Предварительно визуально сравнены Marck Script, Bad Script, Pitholica Delicate и Royal Kaynin. У двух последних отсутствуют подходящие цифровые глифы; Bad Script даёт рукописный характер и характерные семёрки. Никакого CDN или нового font asset. Крупный clamp(), line-height:1.6, внутренние поля и расширенная конечная clip-mask сохраняют цифры и выносные штрихи. Проверяются фактические Canvas ink bounds, не только box overflow.

## Venue

Первой стала прежняя вторая фотография, площадка церемонии (pushkinskaya-02.webp). Второй прежняя первая, фасад с вечерней подсветкой (pushkinskaya-01.webp). Оба файла прежние, fullscreen сохранён.

IntersectionObserver впервые замечает gallery при threshold .15, запоминает deadline Date.now()+10000 и отключается. Повторные callbacks защищены ref. До этого нет autoplay timer. Один effect владеет одним timeout и очищает его при изменении состояния/unmount. Первая смена не раньше 10 секунд с первого просмотра; затем прежний цикл 5 секунд. Manual interaction откладывает смену на 10 секунд. Fullscreen/document.hidden приостанавливают timer. Reduced motion сохраняет прежнее отсутствие autoplay.

Плашка использует существующий тёмный #303b2a с альфой 79%, blur 12px и тонкую золотую границу. Светлый текст #faf6eb, акценты #e1cb94; золотая кнопка прежняя. Без backdrop-filter фон более плотный (#303b2af2). Контраст просмотрен на обеих фотографиях desktop/mobile. Адрес, парковка и карта сохранены, ночёвка не возвращалась.

## Dress Code

Только до 700 px уменьшены padding секции 65→52/48, отступ heading 45→24, help 36→24, основной переключатель 35→24, второй 40→26 (без отрицательного верхнего margin), palette intro 26→20, guidance gap 24→20 и нижний отступ 48→36, lookbook 72→40, заголовок lookbook 28→20, controls 25→20, верх anti-lookbook 46→30 px. Размеры фотографий и шрифтов сохранены. Вместо фиксированного guidance min-height 600 px измеряется максимум реальных текстов при текущей ширине. ResizeObserver обновляет резерв при resize/fonts; все страницы используют общий резерв, поэтому переключение не прыгает. Desktop CSS остаётся прежним.

## Семья и фото

Mobile labels теперь «Жениха | Невесты». Desktop headings прежние. Состояние, 50px threshold, horizontal > vertical×1.5, крайние жесты, вертикальный scroll, keyboard и reduced motion сохранены. Новый портрет Галины Ивановны подключён по указанию пользователя; сведения в MEDIA_ASSETS.md/json. Остальные фото, соответствия и порядок прежние.

## Public copy

Убраны 4 длинных тире из FAQ; средних тире в public copy не найдено. Технические строки Telegram/admin не переписывались. Переписаны 9 двоеточий в 7 пользовательских строках: 5 в Dress Code (фасон, подходят, главный ориентир, подбор брюк/обуви, оливковая семья) и 4 в Venue Rules (штраф площадки, кальян, курение, итоговое перечисление). Даты, время и URL сохранены. Двоеточия в коротких alt-описаниях не являются вводом перечисления и оставлены.

## QA

Проверяются 320,375,390,430,768,1000,1024,1440 px. Снимки и измерения находятся в tmp/local-polish. Добавлены проверки положения сургуча, public copy и mobile spacing; расширена проверка Venue autoplay с виртуальными часами и повторным IO callback. Итоговые результаты тестов и список intentional baselines будут зафиксированы после финального прогона.

## Baselines

Обновлены 42 существующих baselines, добавлен envelope-mobile-seal.png. Перед обновлением просмотрены реальные варианты на desktop/mobile и visual diffs. Все существующие RSVP, Telegram, Friends и Program baselines сохранились побайтово. Offscreen snapshot fixture сохраняет прежние отступы только у не снимаемого Dress Code, чтобы изменение его высоты не перерисовывало AA неизменённых секций; full-page и Dress Code всегда снимают реальное состояние. Пороги сравнения не ослаблялись.

- dress-allowed.png (updated)
- dress-families-men-1440.png (updated)
- dress-families-men-320.png (updated)
- dress-families-women-1440.png (updated)
- dress-families-women-320.png (updated)
- dress-men.png (updated)
- dress-women.png (updated)
- envelope-mobile-seal.png (new)
- envelope-sealed.png (updated)
- faq-expanded.png (updated)
- faq-speeches-1440.png (updated)
- faq-speeches-375.png (updated)
- fashion-men-accessories-375.png (updated)
- fashion-men-clothes-1440.png (updated)
- fashion-men-clothes-375.png (updated)
- fashion-women-accessories-375.png (updated)
- fashion-women-clothes-1440.png (updated)
- fashion-women-clothes-375.png (updated)
- guests-relatives-1440.png (updated)
- guests-relatives-375.png (updated)
- guests-relatives-bride-375.png (updated)
- homepage-1440x900.png (updated)
- homepage-375x812.png (updated)
- homepage-430x932.png (updated)
- motya-faq-link.png (updated)
- october-date-1440.png (updated)
- october-date-375.png (updated)
- october-venue-1440.png (updated)
- october-venue-375.png (updated)
- relatives-swipe-bride.png (updated)
- relatives-swipe-groom.png (updated)
- relatives-switch-bride.png (updated)
- relatives-switch-groom.png (updated)
- relatives-tap-bride.png (updated)
- relatives-tap-groom.png (updated)
- venue-fullscreen.png (updated)
- venue-panorama-desktop.png (updated)
- venue-panorama-mobile.png (updated)
- venue-pushkinskaya.png (updated)
- venue-rules-1440.png (updated)
- venue-rules-375.png (updated)
- women-clothing-v3-approved-1440.png (updated)
- women-clothing-v3-approved-375.png (updated)

Typecheck, lint, 105 unit/integration tests, local production build, check:secrets и git diff --check прошли. Полный browser update pass: 35 passed (6.5m). Финальный npm run test:browser без обновления baselines: 35 passed (5.5m), failures/skips нет. Тесты используют изолированный локальный QA harness, synthetic data и in-memory PostgreSQL, без production DB/Telegram-запросов.

Финальные измерения guidance: 505 px на 320 px и 397 px на 375/390/430 px, вместо прежних 600 px. Секция Dress Code на 375 px стала короче с 4193 до 3816 px, при неизменном размере изображений и текста. Переключение всех четырёх fashion pages сохраняет высоту в пределах 4 px. Контраст подписи на cream 10.68:1; основной светлый текст плашки имеет минимум 5.66:1 даже при белом фоне фотографии.

Финальный Next preview перезапущен с последней сборкой. http://localhost:3100/#guests отвечает HTTP 200. Из 26 портретов изменён ровно один, galina-ivanovna.webp. Все 11 портретов друзей сохранены побайтово. Порядки обеих сторон и Friends не менялись.
