// Purchasing identity, not a replacement product or a promise of retailer stock.
export const productReferences=[
 {pattern:/ECAM290\.61\.B/i,note:'Нужна DeLonghi ECAM290.61.B, чёрная. Панель и молочная система на иллюстрации могут отличаться. Проверяйте модель по ссылке.'},
 {pattern:/Станция Макс/i,note:'Нужна Станция Макс с Zigbee, 65 Вт, графит, с регулятором сверху. Не Мини, Миди или Станция 3. Иллюстрация не передаёт все детали корпуса.'},
 {pattern:/KitchenAid.*5KSM175/i,note:'Ориентир: KitchenAid Artisan 5KSM175PSEAC, 4,8 л, кремовый. Чаши и насадки сверяйте в комплектации магазина, не по иллюстрации.'},
 {pattern:/Instax Mini Evo/i,note:'Нужна Fujifilm Instax mini Evo, чёрная. Не mini 12, Wide Evo или другая версия. Картриджи проверяйте отдельно в комплектации.'},
 {pattern:/MoGo 3 Pro/i,note:'Нужен XGIMI MoGo 3 Pro, бежевый. Иллюстрация условная: корпус и подставка могут отличаться. Комплект с PowerBase не подразумевается.'},
 {pattern:/SELPHY CP1500/i,note:'Нужен Canon SELPHY CP1500, чёрный. Это сублимационный фотопринтер. Бумагу и картридж сверяйте по комплектации магазина.'},
 {pattern:/HW-S60D/i,note:'Нужен Samsung HW-S60D/RU, чёрный. Изображение показывает общий вид, точную версию проверяйте по ссылке.'},
 {pattern:/КТ-2403/i,note:'Нужен Kitfort КТ-2403 на 8 бутылок, чёрный. Иллюстрация не является схемой полок и комплектации.'},
 {pattern:/Ninja Creami NC302EU/i,note:'Нужна Ninja CREAMi NC302EU. Количество контейнеров и комплектацию сверяйте в магазине, не по иллюстрации.'},
];
export const productNote=title=>productReferences.find(item=>item.pattern.test(title))?.note||'';
