import {rsvpDetail} from '../rsvp/detail.mjs';
// Reuse persisted-field presentation; omit organizer-only trivia from the keepsake.
export function ticketGuest(row){
  const omitted=new Set(['Имя','Кто','Музыка','Дресс-код']);
  return {name:row.guest_name,attendance:row.attendance,fields:rsvpDetail(row).fields.filter(field=>!omitted.has(field.label)).map(field=>({...field,label:field.label==='Трансфер'?'Трансфер туда':field.label}))};
}
