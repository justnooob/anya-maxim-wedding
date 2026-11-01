const MOSCOW_OFFSET=3*60*60*1000,DAY=86400000;
// Calendar arithmetic in the event's fixed UTC+3 civil time, independent of
// the browser's timezone. Clamp month ends rather than treating a month as 30d.
function addMonths(date,months){
 const year=date.getUTCFullYear(),month=date.getUTCMonth()+months;
 const last=new Date(Date.UTC(year,month+1,0)).getUTCDate();
 return Date.UTC(year,month,Math.min(date.getUTCDate(),last),date.getUTCHours(),date.getUTCMinutes(),date.getUTCSeconds(),date.getUTCMilliseconds());
}
export function calendarCountdown(now,target){
 if(!Number.isFinite(now)||!Number.isFinite(target))throw new TypeError('Countdown requires finite timestamps');
 if(now>=target)return{months:0,days:0,hours:0,minutes:0,seconds:0,finished:true};
 const current=new Date(now+MOSCOW_OFFSET),end=new Date(target+MOSCOW_OFFSET);
 let months=(end.getUTCFullYear()-current.getUTCFullYear())*12+end.getUTCMonth()-current.getUTCMonth();
 if(addMonths(current,months)>target+MOSCOW_OFFSET)months--;
 months=Math.max(0,months);
 let seconds=Math.ceil((target+MOSCOW_OFFSET-addMonths(current,months))/1000);
 const days=Math.floor(seconds/(DAY/1000));seconds%=DAY/1000;
 const hours=Math.floor(seconds/3600);seconds%=3600;
 const minutes=Math.floor(seconds/60);seconds%=60;
 return{months,days,hours,minutes,seconds,finished:false};
}
export function russianUnit(value,forms){const n=Math.abs(value)%100,last=n%10;return forms[n>=11&&n<=14?2:last===1?0:last>=2&&last<=4?1:2];}
