# Dress Code · финальные корректировки

## Уточнение двух женских образов и FAQ

03/06 теперь использует выбранное пользователем изображение с лифом на одно плечо и вытянутой драпировкой. Название «Светлый оливковый с драпировкой».

05/06 повторно уточнён по новому reference с органзовым бантом, драпированным лифом и мягким воланом. Фасон перенесён в прежнюю комнату на тот же манекен. Название «Оливковый с воздушным бантом». Обновлены только эти два image asset и их captions. SHA файлов, titles, descriptions и eyebrows остальных 01/02/04/06 сравнены с сохранённым состоянием, изменений нет.

Оба финальных кадра просмотрены рядом со всеми шестью разрешёнными женскими образами и в mobile/desktop lookbook. Людей и частей тела нет. Все source refs, final hashes и captions записаны в silhouetteRevision / finalCopy в LOOKBOOK_ASSET_AUDIT.json.

FAQ дополнен двумя пунктами сразу после поздравлений. Текст до площадки разбит на три абзаца. Возвращение содержит ссылку «Максиму», общий существующий URL https://t.me/sfokin1337. Default все закрыты, один activeFaqId открывает максимум один ответ. Предыдущий ответ закрывается перед раскрытием следующего. При смене длинного ответа удерживается экранное положение нажатой строки, без перехода к началу секции или scrollIntoView. Ручная прокрутка/касание сразу прекращают удержание. Reduced motion переключается без анимации. Фокус остаётся на trigger; aria-controls, aria-expanded, labelled regions и inert сохранены.

Новые browser tests подтверждают переходы, порядок, ссылку, focus-visible, максимум один ответ одновременно и стабильность нажатой строки на 375/1440px, видимое смещение менее 1px.

Проверки уточнения завершены. Typecheck, lint, 127/127 unit/integration tests, production build, secrets check и git diff --check прошли. Контрольный browser regression без обновления snapshots прошёл 49/49 за 6.6 минуты. Обновлён 31 существующий baseline, добавлены 4 transfer screenshots, различия просмотрены вручную. Перечень сохранён в локальном tmp/faq-silhouette/baseline-changes.json. Предпросмотр http://localhost:3100/#dress-code работает с HTTP 200; production не затрагивался, push не выполнялся.

---

Только локально. Production, Amvera, deployment, БД, RSVP API и Telegram не менялись. Push не выполнялся.

Этот отчёт описывает актуальную версию после октябрьского follow-up и заменяет прежнее описание floating navigation в LOOKBOOK_INTERACTION_REVIEW.md.

## Floating tabs

1. На desktop и mobile одна позиция, top center viewport. Fixed nav остаётся в portal под main#top вне transform-анимации Dress Code.
2. CSS top calc(env(safe-area-inset-top,0px) + 10px), left 50%, transform translateX(-50%). right и bottom равны auto на всех breakpoint, в том числе reduced motion.
3. Общая подложка rgba(10,10,10,.65), backdrop blur 14px, padding 5px 12px 10px, radius 5px, без рамки и тени.
4. Вкладки имеют ту же структуру, подписи «Для девушек / Для мужчин», «Одежда / Аксессуары», размеры, отступы, шрифт, underline, звёздочку и состояние aria-pressed. Единственное необходимое отличие от исходных цветов текста для контраста на тёмной подложке — светлые чернила #d9d2c0 и активное золото #f0dda8. Исходные controls не перекрашены. Золотая линия сохранена. Focus-visible имеет видимую золотую обводку.
5. isInsideDressCodeSection определяется по полному DOM-rect секции, top <= 0 и bottom > 0. Это позволяет работать до последних пикселей секции, без прежнего раннего отключения на viewport-centre sentinel. Выше и ниже Dress Code nav скрыт.
6. Original tabs visibility определяется отдельно через реальное пересечение controls с viewport, bottom > 0 и top < innerHeight. Никаких palette/materials/carousel sentinel.
7. Upward threshold 32px накопленного движения. Downward threshold 32px. Дрожание 1–2px игнорируется; смена направления сбрасывает накопление, но не видимость.
8. При остановке и продолжении движения вверх nav остаётся видимым до появления original controls. Это проверяется длинным последовательным подъёмом через lookbook, materials, guidance и palette.
9. В nav только четыре вкладки. Стрелки, счётчик и Allowed/Not allowed остаются локально возле lookbook.
10. Original и floating controls меняют тот же React state. Переключение на Materials не вызывает scrollTo, focus автоскролл не нужен. Проверка настоящим pointer click при normal motion сохраняется.

## Изображения

Перегенерированы 15 кадров. Из них 12 прямо указаны в новых требованиях; ещё 3 положительных мужских аксессуарных кадра нарушали общее правило — содержали костюм/манекен или сложенную основную одежду. Они заменены предметными сценами с сохранением идеи комплекта.

Встроенный image_gen использован 16 раз: 15 финальных кадров, один первоначальный спортивный кадр затем получил отдельно запрошенную нашивку BEAR. Версия без логотипа не подключалась в runtime. Новые финалы находятся в public/images/dress-lookbook-v6/, WebP 960×1200. Все 18 корректных прежних кадров v5 сохранены без изменения байтов.

Логотип BEAR добавлен по двум пользовательским references именно на переднюю панель кепки. Сохранены композиция, обувь, сумка, часы, очки, room scene и освещение.

Для каждой генерации просмотрен полный результат. Нет людей, лиц, человеческих рук, ног, кожи или частей тела на mannequin. Сохранены cream room, окно слева, botanical art/столик справа, свет и сопоставимые ракурс/масштаб. Одежда на портновском манекене, все аксессуары в предметных сценах без платьев, пиджаков, костюмов, рубашек или брюк.

| Перегенерированный ID | Финальный title |
|---|---|
| butter-column.webp | Светлое сливочное масло |
| chartreuse-midi.webp | Принт и обильная вышивка |
| eucalyptus-embroidered.webp | Чистый оливковый силуэт |
| ivory-short.webp | Слишком короткая почти белая шампань |
| olive-short.webp | Сливочный шёлк |
| sage-ballgown.webp | Воздушный светлый оливковый |
| warm-gold-asymmetric.webp | Золотистое сияние |
| women-accessories-cream.webp | Оливковые аксессуары |
| women-accessories-gold.webp | Золотые босоножки |
| men-accessories-brown.webp | Тёплый коричневый |
| men-accessories-neon.webp | Кислотные и яркие акценты |
| men-accessories-olive.webp | Спокойные оливковые детали |
| men-accessories-print.webp | Активные принты |
| men-accessories-sport.webp | Слишком спортивные аксессуары |
| men-accessories-tie.webp | Оливковый галстук |

Сохранены без изменения изображения

- deep-olive-slip.webp
- emerald-fitted.webp
- mint-tulle.webp
- silver-champagne.webp
- women-accessories-black.webp
- women-accessories-ivory.webp
- women-accessories-neon.webp
- women-accessories-pearl.webp
- women-accessories-silver.webp
- men-accessories-bow.webp
- men-clothes-blue.webp
- men-clothes-milk.webp
- men-clothes-moss.webp
- men-clothes-neon.webp
- men-clothes-neutral.webp
- men-clothes-sage.webp
- men-clothes-sport.webp
- men-accessories-clown.webp

## Порядок женских разрешённых образов

1. Тёмный тёплый оливковый, «Настоятельно рекомендуем».
2. Светлое сливочное масло, новый глянцевый атлас, «Настоятельно рекомендуем».
3. Воздушный светлый оливковый.
4. Золотистое сияние.
5. Чистый оливковый силуэт.
6. Сливочный шёлк.

Чередуются три оливковых и три сливочно-золотых образа. Первым среди сливочных стоит атлас. Recommended eyebrow только у двух заданных карточек, в обычном и fullscreen просмотре.

## Captions и материалы

Проверены все 33 title/status/description. Изменены 13 описаний — пять женских положительных, два женских отрицательных, два женских аксессуарных, три мужских отрицательных аксессуарных и описание мужского галстука после удаления рубашки. Для двух дополнительных мужских аксессуарных кадров brown/olive прежние подписи соответствуют новым предметам. Полный финальный copy audit для всех 33 находится в LOOKBOOK_ASSET_AUDIT.json, finalCopy, material, accessoryOnly.

Женский принт объясняет именно цветы и вышивку. Почти белое мини объясняет одновременно длину, цвет и фасон. Golden sandals и оливковая сумка описаны по финальным предметам. Спортивные аксессуары описывают кроссовки/сумку/кепку/часы; принты описывают узоры на предметах. Точная фраза клоунского примера сохранена.

24 ранее утверждённых Materials assets, палитры, основные пояснения, жирное «должен», кремовая рубашка и предупреждение про чёрные носки не изменены.

## Fullscreen, responsive и cleanup

Native dialog использует те же final images/captions и общий gallery index. Границы — текущий gender/page/allowed-or-avoid. Внутри группы нет перехода в другую, крайние стрелки disabled. Escape, Tab/Shift+Tab, arrows, swipe, scroll lock, inert и возврат focus остаются.

Responsive frame 4:5, object-fit contain, без растяжения пустой paper frame. SVG thumbs 36×36, одинаковый top/right 12px. Высота captions измеряется по всем текстам, включая длинный Recommended eyebrow; при смене кадров не прыгает.

Удалены 15 заменённых v5 runtime assets после обновления refs. Их локальная резервная копия лежит в ignored tmp/lookbook-followup/replaced. В public нет промежуточных генераций. Остальные 18 v5 assets не удалены.

## Проверки

Typecheck, lint и 124/124 unit/integration tests прошли. Первый browser-прогон выявил намеренные visual diffs и ошибку импорта в новом тесте, она исправлена. После ручного просмотра изображений и UI обновление baselines завершилось 47/47. Контрольный прогон без обновления завершился 47/47, 6.6 минуты. Отдельный npm run build также прошёл. npm run check:secrets и git diff --check прошли.

Добавлены три browser tests, два для top-center/persistence на 375 и 1440px, один для всех изменённых кадров и рекомендованного порядка на desktop/mobile. Сохранились проверки normal-motion pointer click без автоскролла, fullscreen keyboard/swipe/focus, image aspect ratio, статусов, отсутствия overflow и стабильной высоты. Общий responsive проход включает 320, 375, 390, 430, landscape 812×375 и desktop 1440.

Изменены 37 существующих baselines и добавлены 42 новых. Изменения ограничены Dress Code, floating, fullscreen и полными homepage captures. Отдельные baseline FAQ, RSVP, Mini App, Date, Hero, Program, Guests, Materials и палитр не изменились.

### Изменённые baselines

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
- lookbook-clown-1440.png
- lookbook-clown-375.png
- lookbook-floating-lookbook.png
- lookbook-floating-materials.png
- lookbook-floating-palette.png
- lookbook-fullscreen-1440.png
- lookbook-fullscreen-375.png
- lookbook-short-frame.png
- women-clothing-v3-anti-1440.png
- women-clothing-v3-anti-375.png
- women-clothing-v3-anti-430.png
- women-clothing-v3-approved-1440.png
- women-clothing-v3-approved-375.png
- women-clothing-v3-approved-430.png

### Новые baselines

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
- final-recommended-butter-column-1440.png
- final-recommended-butter-column-375.png
- final-recommended-deep-olive-slip-1440.png
- final-recommended-deep-olive-slip-375.png
- floating-original-1440.png
- floating-original-375.png
- floating-top-center-1440.png
- floating-top-center-375.png
- floating-upward-hold-1440.png
- floating-upward-hold-375.png

Команды повторения

```text
npm run typecheck
npm run lint
npm test
npm run test:browser
npm run test:browser:update
npm run build
npm run check:secrets
git diff --check
```

Манифест сохраняет все final prompts в followupPrompt, reference-derived source, SHA до/после, finalCopy и результаты ручного review. Новые assets сохраняются именно в repository, а не ссылаются на tool cache.
