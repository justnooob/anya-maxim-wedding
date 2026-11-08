// Shared labels and allowed values for the RSVP question.
export const partyInterest = Object.freeze({
 title:'Хотите ли быть на девичнике/мальчишнике?',
 detailLabel:'Девичник / мальчишник',
 error:'Выбери, хочешь ли ты быть на девичнике/мальчишнике.',
 choices:[{value:'yes',label:'Да, хочу'},{value:'no',label:'Нет, не хочу'}],
});
export const validPartyInterest=value=>value==='yes'||value==='no';
export const partyInterestLabel=value=>value==='yes'?'Да, хочу':value==='no'?'Нет, не хочу':'Ответ не указан';
