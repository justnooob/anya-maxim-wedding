# Visual + motion polish report

9 октября 2026. Только публичная композиция и motion; backend, RSVP validation/session, PostgreSQL, API, Telegram worker и Mini App functionality не изменялись. Push не выполнялся.

## Изменения

1. Сохранены cream paper, olive, gold, текущие шрифты и композиции четырёх утверждённых блоков. Отдельный polish.css ограничен публичным #top; Telegram layout не меняется.
2. Письмо → Hero: мягкий crossfade 1400 ms desktop / 950 ms mobile, письмо немного отдаляется scale .94, фотография появляется scale 1.03 → 1. АННА, &, МАКСИМ появляются с перекрывающимися задержками. Нет 3D, вращения, blur или постоянного движения Hero. Пока сцена закрывает сайт, main inert; затем фокус передаётся main.
3. Date left: крупнее и плотнее дата, спокойнее вводный текст, тонкая золотая линия и небольшой символ над временем. Правый календарь сохранён.
4. Program: единый вертикальный running order вместо лесенки, крупное serif время слева, событие справа, тонкая линия и золотые штрихи. На mobile линия слева от двух колонок; «Позже» чуть меньше, чтобы не упираться в соседнее название. Исходные времена/описания сохранены.
5. Guests: desktop hover scale 1.02 / 220 ms, соседние карточки не двигаются, текущие бумажные наклоны сохранены. На touch и reduced motion scale отключён.
6. Typography tokens: body 18/17, detail 16/15, form 18/18, label 15/14, guest caption 13/12, FAQ 17/17 px (desktop/mobile). Счётчики, calendar numbers, pagination, маленькие eyebrows и кнопки не увеличены.
7. Ботаника: 11 разных композиций в публичных секциях (atelier-01…10, mini). Program motif вертикальный, FAQ небольшой асимметричный, RSVP мягкий акцент внизу. Конверт, письмо и Hero не получили новой ботаники.
8. Три motion patterns: text opacity + 22 px / 620 ms; large visual opacity + scale 1.025 / 720 ms; decor opacity + 10 px / 780 ms. Easing cubic-bezier(.22,.7,.25,1), короткие задержки. Gallery frames 720 ms со слабым scale; tabs сохраняют направленную смену кадров, progress плавный. Hover/active/focus состояния согласованы.
9. Mobile: короче переход письма и входы, меньше декора, без parallax, сохранены нативная горизонтальная прокрутка каталога и touch-targets. Проверены 375×812, 430×932, 768 px tablet и 1440×900.
10. Reduced motion: отключены cinematic и пространственные entrance/hover animations, всё содержимое доступно сразу. В screenshot-тестах media emulation задана явно; normal-motion тесты проверяются отдельно.

## Проверенные visual diffs перед обновлением

| Эталон | Причина | Решение |
|---|---|---|
| homepage-375x812.png | Крупнее supporting text, новая программа, FAQ, progress и расположение RSVP botanical; весь контент теперь попадает в неподвижный полный кадр | Intentional |
| homepage-430x932.png | Те же изменения при ширине 430 | Intentional |
| homepage-1440x900.png | Новая иерархия даты, typography, программа, FAQ и декор; нормализованный полный кадр | Intentional |
| faq-expanded.png | Заголовок «И еще пару моментиков», ответы 17 px и небольшой другой accent; тексты ответов сохранены | Intentional |
| rsvp-going.png | Labels, options и ввод крупнее; botanical внизу | Intentional |
| rsvp-not-going.png | Крупнее supporting text/labels, botanical внизу | Intentional |
| rsvp-success-first.png | Крупнее основной текст, botanical внизу; логика второго гостя сохранена | Intentional |
| rsvp-success-second.png | Те же изменения; длинное имя переносится внутри бумаги | Intentional |
| envelope-sealed.png | Нормализован неподвижный reduced-motion кадр; композиция, ассеты и стили конверта не менялись | Test capture change |
| envelope-open.png | Совпадает | Не обновляется по существу |
| telegram-list.png | Совпадает | Не меняется |
| telegram-detail-long.png | Совпадает | Не меняется |

Каждый diff и новые состояния просмотрены до update. Более длинные абзацы после увеличения текста ожидаемы. Нежелательное тесное соседство последнего времени с событием на mobile исправлено. Horizontal overflow и внутренний vertical scroll каталога в проверенных состояниях отсутствуют. Reveal/hover используют transforms и opacity, а не изменение размеров; соседние карточки не сдвигаются. FAQ закономерно меняет высоту при раскрытии, без резкого скачка состояния. Botanical остаётся слабым фоновым акцентом, не закрывает органы управления.

## Verification

Suite расширен до 10 browser tests: исходные 12 baselines плюс секционные review кадры в 4 ширинах и проверка crossfade, фокуса, быстрых arrows/tabs, клавиатурного листания и Chromium touch events. Эти проверки не заменяют тест на физическом iPhone/Safari.

Перед update выполнен npm run test:browser; ожидаемые visual differences исследованы. После ревью выполнены npm run test:browser:update и повторный npm run test:browser без update: 10/10 passed, 12 baseline comparisons стабильны. Дополнительно typecheck, lint, 63/63 обычных tests, production build, secret scan и git diff --check прошли.

## Performance

Новых runtime dependencies, видео, generated bitmap assets и непрерывных scroll handlers нет. Используются CSS и существующий IntersectionObserver. Дополнительный CSS небольшой; filter/saturate и тени фото могут иметь стоимость repaint на слабых устройствах, hover ограничен desktop. Не проводился Lighthouse или замер FPS на физических устройствах; parallax не добавлен.
