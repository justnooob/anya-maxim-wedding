// Canonical public wedding facts shared by the website, calendar and PDF.
// PUBLIC_SITE_URL remains the runtime request/Telegram origin, including local QA.
export const PUBLIC_ORIGIN = 'https://anyaxmaxim.ru';
export const ANYA_TELEGRAM_URL = 'https://t.me/Selesssta';
export const MAXIM_TELEGRAM_URL = 'https://t.me/sfokin1337';
export const wedding = {
  date: '17.07.2027', dateISO: '2027-07-17', dateLong: '17 июля 2027', time: '15:00', endTime: '22:00', timeZone: 'Europe/Moscow',
  venue: {name:'Пушкинская Усадьба',address:'Зелёная ул., 1, городской посёлок Фёдоровское',mapUrl:'https://yandex.ru/maps/?text='+encodeURIComponent('Пушкинская Усадьба, Зелёная ул., 1, городской посёлок Фёдоровское')},
  program: [
    {time:'15:00',title:'Встречаемся на площадке',ticketTitle:'Встреча гостей',detail:'Потом пускать не будем. Ну только если очень сильно попросите.'},
    {time:'15:30',title:'Церемония',ticketTitle:'Церемония',detail:'Можно плакать, разрешаем. Можно и не плакать.'},
    {time:'16:00',title:'Начало банкета',ticketTitle:'Банкет',detail:'С этого момента всё серьёзно. Едим, пьём и начинаем отмечать.'},
    {time:'21:00',title:'Дискотека',ticketTitle:'Дискотека',detail:'К этому времени уже можно не делать вид, что вы пришли только поесть.'},
    {time:'22:00',title:'Расходимся',ticketTitle:'Завершение вечера',detail:'Да, рано. Нет, это не ошибка. У площадки тоже есть свои дедлайны.'},
  ],
};
