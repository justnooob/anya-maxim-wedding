> Актуальные корректировки и новый top-center floating UI описаны в [LOOKBOOK_FOLLOWUP_REVIEW.md](LOOKBOOK_FOLLOWUP_REVIEW.md). Ниже сохранён отчёт предыдущего прохода.

# Dress Code · завершение полного прохода

Только локальная работа. Production, Amvera, deployment, PostgreSQL, RSVP API и Telegram не менялись. Push не выполнялся.

## Полный lookbook

До прохода в runtime было 32 фотографии. Каждая получила новую сгенерированную замену. Вместе с новым «Клоунским набором» финальный набор содержит 33 новых кадра. Ни один финальный runtime path не указывает на прежнюю фотографию. Все файлы находятся в public/images/dress-lookbook-v5/, WebP 960×1200.

В рамках текущего прохода выполнено 40 генераций встроенным image_gen. 33 финальных результата приняты после индивидуального визуального просмотра, 4 варианта с людьми отвергнуты, ещё 3 варианта пересозданы, два из-за слишком светлой сумки и один ради отчётливой рубчатой фактуры вельвета. Семь корректных mannequin/display-генераций первой части этого же прохода сохранены; это новые замены исходных архивных фотографий, а не старые runtime assets.

Для каждого кадра использована его старая сцена из RAR как основной reference. Сохранены тип mannequin/display, постановка, сопоставимые масштаб и ракурс, cream walls, молдинги, окно слева, светлый пол, золотой столик и ботаника справа, направление света. Одежда показана только на безликих портновских манекенах; аксессуары на прежних предметных подиумах. Реальных людей, лиц, кожи, рук и ног в финальном наборе нет.

Все positive images сверены с текущими оливковыми, затемнёнными молочными и сливочно-золотыми значениями. Учтены разные материалы и силуэты, кремовая рубашка и отсутствие случайного чёрного/чистого белого. Все negative images тоже созданы заново; запрещённый признак оставлен намеренно. У женских платьев подпись не запрещает нормальный фасон из-за неправильного цвета. Это ручная визуальная проверка фотографий при естественном освещении, не утверждение о буквальном RGB каждого пикселя.

Полный manifest LOOKBOOK_ASSET_AUDIT.json содержит old filename, group/status, описание исходной сцены, требуемое изменение, material, target color, silhouette, new filename, prompt, hashes оригинала и результата, размеры и отдельные признаки ручной проверки.

## Полный mapping old → new

| Старый runtime asset | Группа | Новый asset |
|---|---|---|
| public/images/dress-women-clothing-v3/butter-column.webp | women-clothes/allowed | public/images/dress-lookbook-v5/butter-column.webp |
| public/images/dress-women-clothing-v3/chartreuse-midi.webp | women-clothes/avoid | public/images/dress-lookbook-v5/chartreuse-midi.webp |
| public/images/dress-women-clothing-v3/deep-olive-slip.webp | women-clothes/allowed | public/images/dress-lookbook-v5/deep-olive-slip.webp |
| public/images/dress-women-clothing-v3/emerald-fitted.webp | women-clothes/avoid | public/images/dress-lookbook-v5/emerald-fitted.webp |
| public/images/dress-women-clothing-v3/eucalyptus-embroidered.webp | women-clothes/allowed | public/images/dress-lookbook-v5/eucalyptus-embroidered.webp |
| public/images/dress-women-clothing-v3/ivory-short.webp | women-clothes/avoid | public/images/dress-lookbook-v5/ivory-short.webp |
| public/images/dress-women-clothing-v3/mint-tulle.webp | women-clothes/avoid | public/images/dress-lookbook-v5/mint-tulle.webp |
| public/images/dress-women-clothing-v3/olive-short.webp | women-clothes/allowed | public/images/dress-lookbook-v5/olive-short.webp |
| public/images/dress-women-clothing-v3/sage-ballgown.webp | women-clothes/allowed | public/images/dress-lookbook-v5/sage-ballgown.webp |
| public/images/dress-women-clothing-v3/silver-champagne.webp | women-clothes/avoid | public/images/dress-lookbook-v5/silver-champagne.webp |
| public/images/dress-women-clothing-v3/warm-gold-asymmetric.webp | women-clothes/allowed | public/images/dress-lookbook-v5/warm-gold-asymmetric.webp |
| public/images/dress-lookbook-v2/women-accessories-black.webp | women-accessories/avoid | public/images/dress-lookbook-v5/women-accessories-black.webp |
| public/images/dress-lookbook-v2/women-accessories-cream.webp | women-accessories/allowed | public/images/dress-lookbook-v5/women-accessories-cream.webp |
| public/images/dress-lookbook-v2/women-accessories-gold.webp | women-accessories/allowed | public/images/dress-lookbook-v5/women-accessories-gold.webp |
| public/images/dress-lookbook-v2/women-accessories-ivory.webp | women-accessories/allowed | public/images/dress-lookbook-v5/women-accessories-ivory.webp |
| public/images/dress-lookbook-v2/women-accessories-neon.webp | women-accessories/avoid | public/images/dress-lookbook-v5/women-accessories-neon.webp |
| public/images/dress-lookbook-v2/women-accessories-pearl.webp | women-accessories/allowed | public/images/dress-lookbook-v5/women-accessories-pearl.webp |
| public/images/dress-lookbook-v2/women-accessories-silver.webp | women-accessories/avoid | public/images/dress-lookbook-v5/women-accessories-silver.webp |
| public/images/dress-lookbook-v2/men-accessories-bow.webp | men-accessories/allowed | public/images/dress-lookbook-v5/men-accessories-bow.webp |
| public/images/dress-lookbook-v2/men-accessories-brown.webp | men-accessories/allowed | public/images/dress-lookbook-v5/men-accessories-brown.webp |
| public/images/dress-lookbook-v2/men-accessories-neon.webp | men-accessories/avoid | public/images/dress-lookbook-v5/men-accessories-neon.webp |
| public/images/dress-lookbook-v2/men-accessories-olive.webp | men-accessories/allowed | public/images/dress-lookbook-v5/men-accessories-olive.webp |
| public/images/dress-lookbook-v2/men-accessories-print.webp | men-accessories/avoid | public/images/dress-lookbook-v5/men-accessories-print.webp |
| public/images/dress-lookbook-v2/men-accessories-sport.webp | men-accessories/avoid | public/images/dress-lookbook-v5/men-accessories-sport.webp |
| public/images/dress-lookbook-v2/men-accessories-tie.webp | men-accessories/allowed | public/images/dress-lookbook-v5/men-accessories-tie.webp |
| public/images/dress-lookbook-v2/men-clothes-blue.webp | men-clothes/avoid | public/images/dress-lookbook-v5/men-clothes-blue.webp |
| public/images/dress-lookbook-v2/men-clothes-milk.webp | men-clothes/allowed | public/images/dress-lookbook-v5/men-clothes-milk.webp |
| public/images/dress-lookbook-v2/men-clothes-moss.webp | men-clothes/allowed | public/images/dress-lookbook-v5/men-clothes-moss.webp |
| public/images/dress-lookbook-v2/men-clothes-neon.webp | men-clothes/avoid | public/images/dress-lookbook-v5/men-clothes-neon.webp |
| public/images/dress-lookbook-v2/men-clothes-neutral.webp | men-clothes/allowed | public/images/dress-lookbook-v5/men-clothes-neutral.webp |
| public/images/dress-lookbook-v2/men-clothes-sage.webp | men-clothes/allowed | public/images/dress-lookbook-v5/men-clothes-sage.webp |
| public/images/dress-lookbook-v2/men-clothes-sport.webp | men-clothes/avoid | public/images/dress-lookbook-v5/men-clothes-sport.webp |
| Новый пример | men-accessories/avoid | public/images/dress-lookbook-v5/men-accessories-clown.webp |

## Responsive frame

Убраны фиксированные высоты и растягивание cream frame. Внутренний viewport сохраняет 4:5. Ширина ограничена доступной шириной и высотой экрана через svh; padding от 4 до 9 px. На коротких экранах уменьшается весь viewport пропорционально. Нет crop, увеличения объекта или CSS recolor. Фото показывается через object-fit: contain. Общий резерв коротких пояснений измеряется по реальному тексту, чтобы смена кадра не вызывала скачки.

Автоматические проверки проходят на 320×568, 375×667, 390×844, 430×932 и 812×375 во всех четырёх состояниях и обеих группах. Существующие проверки материалов дополнительно охватывают 768, 1000, 1024 и 1440 px.

## Floating tabs

Global pagination полностью удалена. Count, arrows и статусные заголовки остаются только возле своих галерей. На палитрах и материалах счётчиков/стрелок нет.

Два плавающих ряда «Женщины / Мужчины» и «Одежда / Аксессуары» появляются после накопленных 32 px вверх. После 32 px вниз скрываются полностью. Движения до 2 px игнорируются. Используется reading anchor в середине viewport, чтобы панель не появлялась поверх Venue из-за маленького фрагмента Dress Code у края экрана. Выше и ниже секции панель скрыта и inert. При видимых исходных переключателях плавающий дубль скрыт.

Используются те же page-switch и dress-section-switch, без отдельного оформления buttons. Typography, sizes, padding, gaps, radius, active/inactive colors, underline/star, hover, pressed и focus унаследованы от существующих компонентов. Browser test сравнивает вычисленные стили кнопок напрямую. Добавлена только компактная общая подложка с тёмным tint #30382b26, blur 14 px, padding 5/12/10 px, без border и тяжёлой тени. Цвета самих tabs не менялись.

Fixed-панель портируется в main#top за пределы анимированного Dress Code. Это сохраняет существующие стили и hidden/inert-состояние main, но исключает ошибочную привязку position: fixed к scale/transform секции. Добавлен отдельный normal-motion regression с настоящим pointer click и проверкой viewport bounds, без автоматической прокрутки Playwright.

Original и floating используют общий state. Переключение через floating не вызывает scroll-to-top, сохранение позиции проверяется с допуском 4 px. Переход панели 220 ms, reduced motion убирает сдвиг и анимацию.

## Статус и fullscreen

Каждый из 33 примеров имеет стабильный id и явный status. SVG-палец находится в круге 36×36 px; размеры одинаковы во всех группах и разрешениях. Allowed #647553, Not allowed #AD746A. Круг закреплён за внутренним viewport фото с отступом 12 px. Emoji нет.

Фото открывается кликом, тапом, Enter или Space. Desktop показывает image слева и компактную тёмную панель справа; mobile показывает пояснение под фото. Есть close, Escape, previous/next, count, ArrowLeft/Right, swipe, focus trap, focus return и scroll lock. Native dialog блокирует фон. Fullscreen ограничен текущими gender/page/status, без loop и перехода в другую группу. Обычная галерея сохраняет циклическое листание. Все контролы пользуются одной позицией галереи.

Clown asset — public/images/dress-lookbook-v5/men-accessories-clown.webp. Только четвёртый negative пример мужских аксессуаров. Большие красно-кремовые ботинки, красный нос и маленькая бабочка находятся в прежней серьёзной студии. Title и text сохранены дословно; total группы равен 4.

## Финальные captions

Все тексты сверены с финальными изображениями. Обновлены 11 подписей положительных примеров, добавлена подпись clown. Остальные сохранены там, где новая фотография продолжает показывать тот же признак. Полный итоговый текст каждого кадра ниже.

- **Светлое сливочное масло**. Даже самый светлый оттенок заметно жёлто-сливочный, а не почти белый. Простой крой и матовый атлас тоже подходят.
- **Резкий жёлто-зелёный**. Длина и крой подходят, но яркий жёлто-зелёный шартрез слишком насыщенный. Нам нужен более спокойный оливковый.
- **Тёмный тёплый оливковый**. Тёмный оливковый подходит, пока остаётся тёплым и приглушённым. Гладкий шёлк и облегающий силуэт тоже подходят.
- **Холодный глубокий изумруд**. Само вечернее платье подходит по настроению. Но изумруд слишком тёмный, насыщенный и холодный для тёплой оливковой гаммы.
- **Эвкалиптовый и вышивка**. Приглушённый эвкалиптовый остаётся тёплым, без мятного или голубого отлива. Фатин и нежная вышивка тоже подходят.
- **Почти белая шампань**. Само платье подходит, но цвет визуально приближается к белому. Наша светлая граница должна оставаться заметно жёлто-сливочной.
- **Слишком холодная мята**. Фасон и воздушный фатин подходят, но оттенок получается слишком холодным и мятным. Нам нужен более тёплый оливковый тон.
- **Оливковый, короткий вечерний**. Средний оливковый с мягким тёплым подтоном подходит по цвету. Короткая длина и спокойная фактурная ткань тоже подходят.
- **Воздушный тёплый шалфейный**. Светлый шалфейный с тёплым жёлто-оливковым оттенком подходит по цвету. Воздушный шифон и пышный силуэт тоже подходят.
- **Холодная серебристая шампань**. К вечернему силуэту вопросов нет. Оттенку не хватает тёплого сливочно-золотистого подтона, он уходит в холодное серебро.
- **Насыщенное тёплое золото**. Более насыщенное мягкое золото тоже подходит. Ткань может блестеть, если цвет не уходит в бронзу, оранжевый или медь.
- **Тяжёлый чёрный акцент**. Крупная чёрная сумка и тяжёлая тёмная обувь слишком контрастные. Лучше выбрать светлые аксессуары.
- **Кремовые и природные детали**. Сливочный, светлый беж и тёплые природные материалы дают свободу в деталях. Не нужно собирать всё оттенок в оттенок.
- **Тёплое золото**. Золотистые туфли, сумка и украшения мягко дополняют оливковую основу. Спокойный блеск остаётся в тёплой гамме.
- **Светлая обувь**. Сумка и туфли заметно кремовые. Такой тёплый оттенок сочетается с оливковым платьем.
- **Кислотные акценты**. Неоновые детали слишком сильно перетягивают внимание. Лучше взять светлую обувь и спокойную сумку.
- **Жемчуг и светлая сумка**. Кремовый жемчуг и тёплая основа сумки добавляют мягкий блеск. Подойдут к обеим нашим гаммам.
- **Ледяной металлик**. Зеркальное серебро слишком холодное. Лучше выбрать жемчуг или тёплое золото.
- **Бабочка и светлый беж**. Оливковая бабочка, кремовый платок и бежевая обувь сочетаются без резких контрастов. Ремень поддерживает тёплый оттенок обуви.
- **Тёплый коричневый**. Обувь и ремень в одной тёплой коричневой гамме. Такой комплект хорошо сочетается с оливковым костюмом.
- **Кислотные и яркие акценты**. Неоновый галстук и контрастная обувь спорят с палитрой. Лучше выбрать оливковые и тёплые нейтральные детали.
- **Спокойные оливковые детали**. Приглушённые оливковые аксессуары поддерживают молочный образ. Ремень остаётся оливковым, без почти чёрного оттенка.
- **Крупный яркий принт**. Красно-синий рисунок становится главным цветовым акцентом. Однотонный оливковый будет спокойнее.
- **Спорт и тяжёлая фурнитура**. Спортивная обувь и крупный холодный металл выбиваются из праздничного образа. Подойдут аккуратные туфли и спокойная пряжка.
- **Оливковый галстук**. Оливковый галстук сочетается с кремовой рубашкой и тёплой светлой обувью. Гладкий шёлк добавляет праздничный блеск.
- **Синий вместо оливкового**. Синий костюм сам по себе хорош, но здесь не подходит по цвету. Выбирайте оливковый пиджак.
- **Оливковый и молочный**. Оливковый пиджак и галстук сочетаются с молочными брюками и кремовой рубашкой. Светлая обувь поддерживает тёплую гамму.
- **Мох и тёплый коричневый**. Приглушённый оливковый пиджак и бабочка сочетаются с молочными брюками. Кремовая рубашка и коричневая обувь связывают образ.
- **Слишком яркая зелень**. Кислотный зелёный не входит в приглушённую гамму. Выбирайте более мягкий оливковый пиджак.
- **Светлые нейтральные брюки**. Тёмный оливковый пиджак и молочные брюки можно сочетать. Кремовая рубашка, бабочка и коричневая обувь делают переход мягче.
- **Разные оливковые**. Мягкий шалфейный костюм и кремовая рубашка остаются в нашей оливковой гамме. Обувь выбрана в тон образу.
- **Повседневные фактуры**. Поло и кроссовки создают спортивное настроение. Пиджак, рубашка и оливковый галстук сделают образ праздничным.
- **Клоунский набор**. Мы уже продумали программу. Выступление клоуна в нее не входит.

## Materials и сохранённые правила

Все 24 утверждённых material assets сохранены без перегенерации, включая 22–24. Сохранены два смысловых трио 3+3, порядок изображений, палитры и их затемнённые светлые оттенки, тексты и предупреждение про чёрный. Выделяется только слово «должен» в мужском правиле. Рубашка молочная, не белая.

Visible figcaption и отдельная строка подписи под материалом удалены. Карточки не резервируют её высоту. На desktop название/подсказка доступны внутри фото по hover и focus-visible. На mobile постоянные labels не возвращаются. Названия сохранены в data, alt и aria-label; карточки доступны с клавиатуры. Нативное горизонтальное листание мобильных трио сохранено.

## Cleanup

После проверки 0 runtime/required-test refs из public удалён 51 устаревший или промежуточный asset. Это 32 прежних runtime-фото, 7 ещё более ранних unused женских примеров и 12 промежуточных v4-файлов, включая 4 невалидных генерации с людьми. Четыре их preview-копии также удалены. Старые исходники для аудита перенесены в ignored tmp/lookbook-pass/removed-runtime-assets, вне production public. Два слишком светлых v5-результата и один вариант с недостаточно выраженной фактурой пиджака заменены принятыми версиями. В public остался только финальный набор из 33 фотографий.

## Tests и baselines

- npm run typecheck — успешно.
- npm run lint — успешно.
- npm test — 122 из 122 unit/integration tests.
- npm run test:browser — полный набор 44 из 44, включая normal motion fixed UI и pointer click без автоматического scroll.
- После последней корректировки вельветовой фактуры дополнительно npm run test:browser -- --grep fashion — 2 из 2, все четыре страницы и все группы галерей; npm test повторно — 122 из 122.
- npm run test:browser:update — намеренные diff просмотрены; старый тест подсчёта rows уточнён до original controls и целевые снимки повторно проверены.
- npm run build — успешно, также выполнялся каждым штатным browser script.
- npm run check:secrets — успешно.
- git diff --check — успешно.

Inventory-тест проверяет 33 новых runtime paths, expected counts каждой группы, SHA-256 результата, отличие от старого оригинала, наличие всех отметок ручного mannequin review и отсутствие старых каталогов в public. Визуальные признаки no people/scene/material проверены вручную; автоматический тест фиксирует результат этого review, а не заменяет компьютерное зрение.

Обновлён 41 существующий baseline и добавлено 15 новых. Неизменённые public sections, RSVP и Mini App используют прежние эталоны. В isolated gallery/material screenshots fixed UI скрывается только на время снимка, сама панель отдельно проверяется на палитрах, материалах и lookbook. Полные homepage screenshots используют реальную страницу. Порог сравнения не ослаблялся.

Изменены

- dress-accessories-cream-gold-base-1440.png
- dress-accessories-olive-base-375.png
- dress-accessories-olive-base-430.png
- dress-allowed.png
- dress-avoid.png
- dress-families-men-1440.png
- dress-families-men-320.png
- dress-families-women-1440.png
- dress-families-women-320.png
- dress-men.png
- dress-women.png
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
- homepage-1440x900.png
- homepage-375x812.png
- homepage-430x932.png
- material-desktop-hint.png
- materials-men-accessories-1440.png
- materials-men-accessories-375.png
- materials-men-clothes-1440.png
- materials-men-clothes-375.png
- materials-women-accessories-1440.png
- materials-women-accessories-375.png
- materials-women-clothes-1440.png
- materials-women-clothes-375.png
- women-clothing-v3-anti-1440.png
- women-clothing-v3-anti-375.png
- women-clothing-v3-anti-430.png
- women-clothing-v3-approved-1440.png
- women-clothing-v3-approved-375.png
- women-clothing-v3-approved-430.png

Добавлены

- lookbook-below-chapter.png
- lookbook-clown-1440.png
- lookbook-clown-375.png
- lookbook-clown-fullscreen-1440.png
- lookbook-clown-fullscreen-375.png
- lookbook-floating-lookbook.png
- lookbook-floating-materials.png
- lookbook-floating-palette.png
- lookbook-fullscreen-1440.png
- lookbook-fullscreen-375.png
- lookbook-notices-mobile.png
- lookbook-original-tabs.png
- lookbook-palette-mobile.png
- lookbook-short-frame.png
- lookbook-top-mobile.png

Локальный предпросмотр http://localhost:3100/#dress-code. Все 33 финальных WebP отдаются локально. Ручная проверка normal motion в live preview после исправления портала показала смещение scroll 0 px при переключении.
