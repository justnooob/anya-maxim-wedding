# Женская одежда Dress Code, v3

Только локальный проход, без push и deployment. Изменён только контент Девушки → Одежда и связанные browser tests / screenshots. CSS, React-компоненты, мужской Dress Code, женские аксессуары, Venue, Rules, RSVP, Intro, API, DB и Telegram сохранены.

1. **Approved: 6 новых изображений.** Тёплый светлый sage; светлый eucalyptus; средний olive; глубокий тёплый olive; светлый butter; насыщенное тёплое золото.
2. **Anti: 5 новых изображений.** Холодная мята/seafoam; глубокий холодный emerald; резкий chartreuse; почти белый champagne/ivory; холодный серебристый champagne.
3. **Силуэты.** Пышный ball gown из шифона; вышитое midi из тюля с короткими объёмными рукавами; короткое фактурное вечернее A-line; длинный минималистичный slip; прямое длинное платье с квадратным вырезом; асимметричное платье на одно плечо. Anti тоже различаются: воздушный многослойный тюль, облегающее с длинными рукавами, плиссированное midi, короткое скульптурное organza, длинное halter-neck. Ограничения объясняются цветом, а не фасоном.
4. **Оливковый диапазон UI.** #B2B995 (светлый тёплый sage), #9CA787 (эвкалиптовый), #7E875C (средний olive), #70794E (мох/хаки), #606941 (глубокий тёплый olive). Приглушённый жёлто-оливковый подтон; без mint/cyan, emerald, холодного forest green, неона и chartreuse.
5. **Butter/gold, отдельное направление.** #ECD794 → #E6CE83 → #D9BF73 → #CBAE61 → #BDA052 внутри самостоятельной группы. Светлая точка заметно жёлто-сливочная, не milk/ivory/off-white; тёмная тёплая золотистая, не бронза/оранжевый/brass/copper. HEX только ориентир UI, ткань оценивается по общему цвету и температуре. Градиента olive → gold нет.
6. **Anti-colour categories.** Каждый кадр показывает конкретную ошибку тона/температуры/насыщенности. Подписи прямо говорят, что красивый фасон может подходить, а неподходящим остаётся цвет. Новые текстовые подсказки не ограничивают кружево, тюль, вышивку или короткую длину.
7. **Прежние используемые изображения заменены.** Семь файлов v2 больше не используются в Девушки → Одежда, физически сохранены как предыдущая версия:

- /images/dress-lookbook-v2/women-clothes-sage.webp
- /images/dress-lookbook-v2/women-clothes-olive.webp
- /images/dress-lookbook-v2/women-clothes-moss.webp
- /images/dress-lookbook-v2/women-clothes-butter.webp
- /images/dress-lookbook-v2/women-clothes-neon.webp
- /images/dress-lookbook-v2/women-clothes-dark.webp
- /images/dress-lookbook-v2/women-clothes-white.webp

8. **Новые assets.** Built-in imagegen, 11 отдельных генераций, единое cream atelier / mannequin / перспектива / soft daylight. Portrait 4:5, WebP 960 px. Exact prompts и source paths: DRESS_WOMEN_CLOTHING_V3_IMAGES.json.

| Группа | Образ | Asset path |
| --- | --- | --- |
| Так можно | Воздушный тёплый sage | public/images/dress-women-clothing-v3/sage-ballgown.webp |
| Так можно | Эвкалиптовый и вышивка | public/images/dress-women-clothing-v3/eucalyptus-embroidered.webp |
| Так можно | Оливковый, короткий вечерний | public/images/dress-women-clothing-v3/olive-short.webp |
| Так можно | Глубокий тёплый olive | public/images/dress-women-clothing-v3/deep-olive-slip.webp |
| Так можно | Светлое сливочное масло | public/images/dress-women-clothing-v3/butter-column.webp |
| Так можно | Насыщенное тёплое золото | public/images/dress-women-clothing-v3/warm-gold-asymmetric.webp |
| Другой вариант | Слишком холодная мята | public/images/dress-women-clothing-v3/mint-tulle.webp |
| Другой вариант | Холодный глубокий изумруд | public/images/dress-women-clothing-v3/emerald-fitted.webp |
| Другой вариант | Резкий жёлто-зелёный | public/images/dress-women-clothing-v3/chartreuse-midi.webp |
| Другой вариант | Почти белый champagne | public/images/dress-women-clothing-v3/ivory-short.webp |
| Другой вариант | Холодный серебристый champagne | public/images/dress-women-clothing-v3/silver-champagne.webp |

9. **Browser screenshots.** Сначала выполнен npm run test:browser без обновления эталонов. Diff вручную просмотрены: изменения ограничены женской одеждой и её областью на full-page homepage. Добавлен тест women clothing varied silhouettes and warm colour boundaries: все 11 кадров × 375/430/1440 (33 review captures), стрелки, клавиатура, свайп, циклический возврат, стабильная высота и отсутствие horizontal overflow. Полный список изменённых/новых baselines за этот проход приведён ниже после hash comparison. Unrelated screenshots не обновляются.

## Проверка

- typecheck и lint;
- 78 unit/integration tests;
- production build;
- browser regression / просмотр 33 кадров на трёх ширинах;
- контроль сохранения размеров на 320 и 390 в общем suite;
- secret scan и git diff --check;
- сравнение content object: всё, кроме women-clothes, идентично состоянию до этого прохода.

Предпросмотр: http://localhost:3100/#dress-code.

## Baselines: точный список за этот проход

Изменены 10 связанных снимков:

- dress-allowed.png
- dress-avoid.png
- dress-families-women-1440.png
- dress-families-women-320.png
- dress-women.png
- fashion-women-clothes-1440.png
- fashion-women-clothes-375.png
- homepage-1440x900.png
- homepage-375x812.png
- homepage-430x932.png

Добавлены 6 новых:

- women-clothing-v3-anti-1440.png
- women-clothing-v3-anti-375.png
- women-clothing-v3-anti-430.png
- women-clothing-v3-approved-1440.png
- women-clothing-v3-approved-375.png
- women-clothing-v3-approved-430.png

Хеши всех остальных snapshots совпадают с состоянием до задачи, включая мужские категории, женские аксессуары, Venue, Rules, Intro, FAQ, RSVP и Telegram. Full-page homepage обновлены только из-за изменённого женского блока.

Иллюстрации: 11 WebP, суммарно 1 030 160 байт. Незавершённых слотов нет.

Итог: typecheck / lint / production build прошли; 78 unit/integration tests и 26 browser tests прошли. Browser suite повторно запущен без update-snapshots: 26 / 26. Все 33 review captures созданы. Secret scan и git diff --check прошли. Push/deployment не выполнялись.
