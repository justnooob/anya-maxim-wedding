import {calendarIcs} from '@/content/calendar-event.mjs';
export const dynamic='force-static';
export function GET(){return new Response(calendarIcs(),{headers:{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'inline; filename="anya-maxim-wedding.ics"'}});}
