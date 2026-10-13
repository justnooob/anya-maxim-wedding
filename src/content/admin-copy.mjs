export function guestCount(n){return n+' '+(n%10===1&&n%100!==11?'гость':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'гостя':'гостей');}
export function formatGuestList(label,guests){return label+' — '+guestCount(guests.length)+'\n'+guests.map(guest=>guest.name).join('\n');}
