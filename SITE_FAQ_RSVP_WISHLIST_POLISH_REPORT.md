# Правки сайта и существующих подарков

Ветка: codex/site-copy-faq-wishlist-polish. Основа: актуальный main после PR #6 и #7. PR #6 уже merged, повторно открыть его для новых изменений нельзя. Production/deployment не выполнялись.

## Тексты и типографика

- Удалён весь kicker «За городом. Рядом с вами.» из Venue, без пустого wrapper.
- «Кто будет»: «Если вы себя здесь видите, то вы избранный».
- Церемония: «Можно плакать, разрешаем. Не плакать запрещаем.»
- Удалена целиком schedule-note с фразой о примерном времени.
- Убран kicker «Немного о подарках».
- Четыре информационных абзаца Wishlist оформлены единообразно: Montserrat 16–18 px, line-height 1.85, спокойный оливковый цвет.
- Добавлен отдельный абзац о габаритном подарке, слова «Аней» и «Максимом» ведут на существующие https://t.me/Selesssta и https://t.me/sfokin1337. target=_blank и rel=noopener noreferrer; стиль question-link, keyboard focus сохранён.
- Нижнее пояснение заменено указанным текстом про конкретный комплект постельного белья и «Текстиль от Светланы», без декоративного шрифта.
- При «Не приду»: «Очень зря, многое упускаете», Montserrat 17–18 px.

### Great Vibes

Точное название подтверждено владельцем. Найден локальный архив Downloads/Google_Sans,Great_Vibes.zip: Great_Vibes/GreatVibes-Regular.ttf и OFL.txt. Скопированы public/fonts/great-vibes-regular.ttf и great-vibes-OFL.txt. Подключён один Regular 400 через font-face, CDN не используется. Применён только к дате и цифрам countdown; подписи единиц остаются Montserrat. Логика/дата/время countdown не менялись. Размер даты responsive, без искусственного утолщения; проверены 320, 375, 390, 430, 768, 1024, 1440 px и разные двухзначные цифры.

## FAQ: причина и исправление

Существовавшие RAF и ResizeObserver одновременно компенсировали высоту, измеряя разные фазы кадра. Жёсткие 420 мс переключения не совпадали с CSS 460 мс. Это создавало конкурирующие коррекции и раннее открытие следующего ответа.

Оставлен один ResizeObserver перед paint. Он удерживает нажатую строку на прежней координате, не прокручивая к началу секции. Следующий ответ открывается по transitionend высоты, с fallback по вычисленной длительности. Сохранён один activeFaqId. Браузерный scroll anchoring отключён только на время компенсации; явный ввод пользователя её отменяет. Убрана зависимость срока компенсации от event.timeStamp. Высота меняется 520 мс с мягким стартом; opacity 240 мс. Reduced motion и keyboard/focus сохранены.

Browser QA измеряет позицию именно после layout/ResizeObserver, на окрашиваемых кадрах, а не в RAF до observer. Также контролируются фокус, максимум один открытый ответ и скорость изменения scroll с учётом интервала между кадрами WebKit. Эталоны не обновлялись.

## RSVP: ближнее и дальнее

Общие CSS-переменные scoped к RSVP: между вопросами 36 px desktop / 30 px mobile; от label до ответа 12 / 10 px; между вариантами 6 / 4 px. Сохранены touch-targets не меньше 44 px. Убраны конфликтующие старые margin-top:25px !important внутри paper-options; подсказки/other-поля/checkbox сгруппированы. Раздел питания сохранил существующую композицию. Business logic, обязательность, API, сессии и валидация не менялись.

## Источники и рабочая БД

Публичный API прочитан только для сверки существующих товаров. Обнаружены текущие ID Kärcher, Ridberg, Tefal и Canon; остальные три не видны в публичном списке, что НЕ доказывает их отсутствие/архив: проверить через Mini App.

Прямой доступ к БД проверен только SELECT 1 и завершился ENOTFOUND. Никаких INSERT/UPDATE/DELETE, seed, migration или повторного импорта не запускалось. Telegram initData не подделывался. PostgreSQL не изменена. Исторические catalog-v2.json, initial-v1.json и импортированная партия из PR #6 не переписывались.

Все предложения записаны как **неисполняемый ручной handoff** docs/wishlist-revisions-2026-11-05.json. Файл не подключён к startup/API/seed и не создаёт подарки. В нём ровно семь целей с прежними seed/ID, старыми ссылками и предложенными значениями; нет isVisible/операций создания.

## Семь существующих позиций

Цены ниже — ориентир из доступных индексированных страниц Ozon без специальной банковской скидки, не обещание live-цены/доставки. Наличие подтверждается видимой кнопкой покупки в индексированной карточке, на момент ручного сохранения проверяется заново.

| Существующая позиция | Новая модель / ссылка | Ориентир, ₽ | Фото / готовность |
|---|---|---:|---|
| Logitech G733 LIGHTSPEED, белая гарнитура | MCHOSE V9 Turbo+, белый/золотой · [Ozon](https://www.ozon.ru/product/naushniki-igrovye-besprovodnye-mchose-v9-turbo-c-mikrofonom-i-zaryadnoy-dok-stantsiey-3878746307/) | 8957 | /images/wishlist-v2/revisions-2026-11-05/mchose.webp |
| Ridberg Discover, чемоданы L + M + S | Ridberg Discover, белые чемоданы L + M + S · [Ozon](https://www.ozon.ru/product/komplekt-chemodanov-so-semnymi-kolesami-ridberg-discover-l-m-s-white-black-2712329109/) | Не подтверждена | /images/wishlist-v2/revisions-2026-11-05/ridberg.webp |
| Tefal IXEO Power QT2020E0 | Tefal IXEO Vision QT1811E0, белая · [Ozon](https://www.ozon.ru/product/parovaya-gladilnaya-sistema-tefal-ixeo-vision-qt1811e0-3064077356/) | 35000 | /images/wishlist-v2/revisions-2026-11-05/tefal.webp |
| Frameo BX-101, 10.1" | Точная модель не подтверждена · [Ozon](https://www.ozon.ru/product/tsifrovaya-fotoramka-akrilovaya-elektronnaya-foto-i-video-ramka-5792470559/) | Не подтверждена | Нет подтверждённого референса; не применять замену. |
| DeLonghi Magnifica Evo ECAM290.61.B | DeLonghi Magnifica Evo ECAM290.61.B · [Ozon](https://www.ozon.ru/product/kofemashina-avtomaticheskaya-zernovaya-delonghi-ecam290-61-b-1450-vt-15-bar-13-stepeney-pomola-1067024681/) | 43693 | Сохранить текущую фотографию; новая не требуется. |
| Kärcher SC 3 Deluxe | Kärcher SC 3 Deluxe, белый/чёрный · [Ozon](https://www.ozon.ru/product/paroochistitel-karcher-sc-3-deluxe-1-513-430-0-s-nasadkami-dlya-doma-kerher-1351946433/) | 22858 | /images/wishlist-v2/revisions-2026-11-05/karcher.webp |
| Canon SELPHY CP1500 | Canon SELPHY CP1500, белый · [Ozon](https://www.ozon.ru/product/canon-printer-struynyy-selphy-cp1500-fotoprinter-russkaya-versiya-kabel-usb-belyy-3450450885/) | 19411 | /images/wishlist-v2/revisions-2026-11-05/canon.webp |

Все старые и новые ссылки полностью перечислены в JSON, вместе с публично наблюдавшимися ID.

- Logitech G733 (раньше G735) меняется в существующей строке на MCHOSE V9 Turbo+, белый/золотой, с магнитным dock. Не вторая карточка. Сверен точный Ozon 3878746307.
- Ridberg: три кейса L+M+S, белые с чёрными деталями. Прямая ссылка Ozon раскрылась, но цена/наличие там недоступны. Конструкция и 3 штуки сверены с карточкой того же комплекта у [iCover](https://www.icover.ru/catalog/product/komplekt_chemodanov_ridberg_discover_l_m_s_white_black_/). Цену 11300 ₽ не заменять догадкой; перепроверить вручную.
- Tefal — именно IXEO Vision QT1811E0, не белая перекраска старого QT2020E0. Доска/резервуар/стойка/утюг сверены по референсу Ozon 3064077356.
- Рамка 5792470559: short URL раскрыт, но точная карточка/фото/диагональ/цена недоступны через fetch, web и Chrome. Похожие AKOSLI на 5/7/10,1 дюйма не считаются этим товаром. Новое фото НЕ генерировалось, существующая Frameo НЕ заменена. Нужны сведения или скриншоты конкретной карточки. Пункт остаётся заблокированным.
- Кофемашина: новая ссылка на ту же ECAM290.61.B, фото сохраняется.
- Kärcher: по действующей ссылке бело-чёрный SC 3 Deluxe 1.513-430.0. Новый asset сверён с реальной формой бака, шлангом и напольной насадкой.
- Canon: белый CP1500 с кабелем USB по названию продавца. Фотопринтер сублимационный, несмотря на ошибочный тип «струйный» в заголовке магазина. Пояснение цвета сделано зависимым от названия: старые чёрные Canon глобально не переименовываются.

## Предметные изображения и визуальная проверка

Использован встроенный image_gen, по одному вызову на товар, с референсом реального продукта. Итоговые WebP 1000×1000, quality 86, новые имена без перезаписи прежних исходников:

- public/images/wishlist-v2/revisions-2026-11-05/mchose.webp
- public/images/wishlist-v2/revisions-2026-11-05/ridberg.webp
- public/images/wishlist-v2/revisions-2026-11-05/tefal.webp
- public/images/wishlist-v2/revisions-2026-11-05/karcher.webp
- public/images/wishlist-v2/revisions-2026-11-05/canon.webp

Сохранены точная геометрия/цвет/количество изделий. Композиции различаются: рабочий стол, прихожая, гардеробная, хозяйственная зона, фотоальбом. Без рекламных плашек, цветов/свечей/лент. Сопоставлены референсы и финальные изображения. QA-сравнения: qa-artifacts/site-polish-2026-11-05/comparison-mchose.jpg, comparison-ridberg.jpg, comparison-tefal.jpg, comparison-karcher.jpg, comparison-canon.jpg. Слева референс, справа итог. Эти исходники/коллажи локальные и игнорируются Git.

Общий prompt каждого вызова: edit exact referenced product; preserve model geometry, correct colors and all supplied components; remove marketing panels and duplicate inset products; square photorealistic editorial still life, daylight, real shadows, neutral material setting; no people, flowers, candles or invented attachments. Дополнения: MCHOSE — белое/золотое оголовье и oval dock с RGB; Ridberg — ровно 3 белых кейса с чёрными деталями; Tefal — QT1811E0, доска/белая стойка/тауповые ручки; Kärcher — белый бак, чёрный верх, один шланг и floor nozzle; Canon — один белый CP1500, открытый paper cassette и откидной LCD. Генерации сверены с референсами; более подробные данные источников находятся в JSON.

## Ручное применение после визуального подтверждения и деплоя assets

1. Mini App → Вишлист → найти **существующую** карточку по прежнему названию/ID. Если архивна, не восстанавливать. Не нажимать «Добавить подарок» и не запускать импорт.
2. Проверить активные и исторические брони. При наличии истории/брони не подменять изделие: текущий сервер блокирует замену, согласовать безопасное решение с гостем.
3. Для свободной карточки изменить поля через существующий редактор из JSON. Использовать новый локальный путь фото только после отдельного одобренного деплоя этой ветки; сейчас он существует локально.
4. Сохранить текущие категорию/приоритет, если нет отдельной необходимости. Видимость не менять автоматически: reviewed-карточка вернётся на проверку по существующим правилам; публикация остаётся отдельным явным действием.
5. У Ridberg сначала проверить цену, у рамки дождаться точной модели и фото. Кофемашину/рамку/наушники, не найденные в публичном списке, сначала найти в админке; при отсутствии не создавать замену.

## Проверки и статус

Успешны typecheck, lint, production build; 234/234 unit/integration. Browser: 28/28 Chrome/WebKit (14 сценариев матрицы copy/FAQ/RSVP, 4 просмотра подготовленных карточек, 10 существующих сценариев RSVP/FAQ). Secret scan успешен (750 путей, 624 текстовых снимка); git diff --check успешен. Матрица: 320, 375, 390, 430, 768, 1024, 1440 px, Chrome/WebKit, промежуточные кадры FAQ, GOING/NOT_GOING, информационные абзацы и ссылки. Отдельный mock-preview показывает существующие шесть подготовленных изменений в реальном компоненте карточки, не записывая их в БД. Новые baselines не принимаются автоматически.

**Полный пакет пока не готов к публикации:** блокируется точная акриловая рамка и цена Ozon Ridberg. Остальные UI/текстовые изменения и пять фото подготовлены для локального просмотра. Реальная PostgreSQL не изменена. Нет deployment, push в Amvera или автоматической публикации подарков.


Локальные визуальные артефакты: qa-artifacts/site-polish-2026-11-05/date-375.jpg, date-1440.jpg, rsvp-going-375.jpg, wishlist-intro-375.jpg, venue-375.jpg, schedule-1440.jpg, products-375.jpg, products-1440.jpg. Все просмотрены; наложений/обрезки даты и текстов не обнаружено. Внутри browser/*/faq-frames.json сохранены измерения промежуточных кадров. Browser config для повторения: tmp/playwright-site-polish.config.mjs (локальный); тесты находятся в tests/qa/site-polish.spec.ts и tests/qa/flows.spec.ts.
