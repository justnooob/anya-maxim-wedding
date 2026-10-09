# Browser regression

Небольшой Playwright suite: 13 тестов и 14 эталонных PNG. Эталоны отражают публичный visual + motion polish от 9 октября 2026.

## Запуск

Нужны зависимости проекта (npm ci), Node.js 20+ и установленный Google Chrome. Используется канал Chrome, дополнительный Chromium скачивать не нужно. Порты 3300 и 3310 должны быть свободны; текущий preview на 3000/3100 не затрагивается.

```powershell
npm run test:browser
```

Команда сначала собирает production Next.js, затем запускает отдельный локальный preview и тесты. Если production build уже готов:

```powershell
node node_modules/playwright/cli.js test
```

HTML-отчёт, ошибки, actual/diff screenshots и traces:

```powershell
npm run test:browser:report
```

## Скриншоты

Эталоны: tests/browser/__screenshots__/chrome/win32/. Их нужно сохранять в Git. Временные test-results/ и playwright-report/ игнорируются Git и ESLint.

- Homepage: 375×812, 430×932, 1440×900, вся страница.
- Закрытый и открытый конверт.
- FAQ с четырьмя раскрытыми ответами.
- RSVP GOING и NOT_GOING.
- Success после первого и второго гостя.
- Telegram Mini App: список и детальная карточка с максимальными строками.

После намеренной визуальной правки сначала проверьте diff в отчёте. Обновление эталонов:

```powershell
npm run test:browser:update
```

Обновление делает скриншоты текущего сайта новыми эталонами. Не используйте его просто для скрытия неожиданного падения теста. Сравнения рассчитаны на Windows и Chrome; изменения ОС, браузера и рендеринга шрифтов требуют отдельного визуального ревью.

## Поведение и изоляция

Проверяются horizontal overflow, клавиатурное и обычное раскрытие FAQ, GOING → NOT_GOING, чистая форма второго гостя, два сохранённых ответа после reload, превышение лимита textarea и длинные слова без пробелов. Mini App получает синтетическую подписанную Telegram-авторизацию и гостя с максимально длинными значениями.

Snapshot-тесты используют reduced motion для стабильных кадров; отдельный smoke test оставляет обычные анимации и проверяет быстрые переключения, scroll и resize. Это не заменяет ручное motion-ревью или проверку реального Telegram на телефоне.

API обслуживает локальная PostgreSQL-совместимая PGlite fixture в памяти с реальными migrations и handlers. Перед каждым тестом сбрасываются только её временные данные. Настоящая PostgreSQL, production migrations и Telegram API не вызываются. Внешние browser requests заблокированы. /qa/reset существует только в тестовом helper, при QA_BROWSER=1, и не является route production-приложения.

Playwright закреплён на версии 1.62.1. В текущей среде registry install не удалось проверить из-за сетевых/TLS ошибок; локальные прогоны использовали эту же версию из доверенного bundled runtime. package-lock содержит обычные registry URLs, без локальных путей. Чистый npm ci требует доступа к npm registry.

Дополнительно сохраняются review кадры Hero/Date/Venue/Dress Code/Guests/Program при 375, 430, 768 и 1440 px в test-results/. Проверяются восстановленный переход через самолётик, фокус, быстрое листание, смена категорий, клавиатура и touch events. Подробности намеренных визуальных изменений: VISUAL_POLISH_REPORT.md.

Paper-airplane baselines: paper-airplane-375.png и paper-airplane-1440.png. Тест фиксирует реальную CSS-анимацию letter-flight на 350 ms, проверяет folded paper surfaces, hidden/inert main до полёта и доступный Hero/фокус после него. Отдельно проверяется короткий reduced-motion путь.
