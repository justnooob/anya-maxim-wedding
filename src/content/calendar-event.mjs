import {wedding,PUBLIC_ORIGIN} from './wedding.mjs';
const utc = time => new Date(`${wedding.dateISO}T${time}:00+03:00`).toISOString().replace(/[-:]/g,'').replace('.000','');
export const event = {
  title:'Аня & Максим. Свадьба',startsAt:utc(wedding.time),endsAt:utc(wedding.endTime),
  location:`${wedding.venue.name}, ${wedding.venue.address}`,url:PUBLIC_ORIGIN,
  description:[wedding.dateLong,`${wedding.time}-${wedding.endTime} (Europe/Moscow)`,wedding.venue.name,wedding.venue.address,...wedding.program.map(item=>`${item.time}. ${item.ticketTitle}`),`Карта: ${wedding.venue.mapUrl}`,`Сайт: ${PUBLIC_ORIGIN}`].join('\n'),
  uid:'anya-maxim-20270717@wedding-invitation.local',reminderDays:7,reminderLabel:'Добавить напоминание',
};
export function calendarIcs(){
  const escape=value=>value.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Anya and Maxim//Wedding invitation//RU','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-TIMEZONE:Europe/Moscow','BEGIN:VEVENT',`UID:${event.uid}`,'DTSTAMP:20261031T000000Z',`DTSTART:${event.startsAt}`,`DTEND:${event.endsAt}`,`SUMMARY:${escape(event.title)}`,`LOCATION:${escape(event.location)}`,`DESCRIPTION:${escape(event.description)}`,`URL:${event.url}`,'BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:-P7D',`DESCRIPTION:${escape(event.title)}`,'END:VALARM','END:VEVENT','END:VCALENDAR'];
  return lines.flatMap(line=>{const result=[];let part='',bytes=0;for(const char of line){const size=Buffer.byteLength(char);if(bytes+size>75){result.push(part);part=' ';bytes=1;}part+=char;bytes+=size;}result.push(part);return result;}).join('\r\n')+'\r\n';
}
