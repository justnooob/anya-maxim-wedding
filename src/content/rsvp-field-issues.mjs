import {congratulationReady,validCongratulation,companionLimit,congratulations} from './congratulations.mjs';
import {validMenuChoice} from './menu.mjs';
import {validReturnTransfer} from './return-transfer.mjs';
import {rsvpLimits,withinLimit,validGuestName} from './rsvp-limits.mjs';

// Form feedback is derived from the current answers, not stored separately.
// Keep it in step with rsvpReady and server validation.
export function rsvpFieldIssues(data){
  const issues={};
  if(!validGuestName(data.guestName))
    issues.guestName=!data.guestName?.trim()?'Укажи, как к тебе обращаться.':`Не больше ${rsvpLimits.guestName} символов.`;
  if(!['yes','no'].includes(data.attendance))issues.attendance='Выбери один из вариантов.';
  if(data.attendance!=='yes')return issues;
  if(!data.who?.trim()||!withinLimit('who',data.who))issues.who=data.who?.trim()?'Не больше 120 символов.':'Заполни это поле.';
  if(!validCongratulation(data.congratulationChoice))issues.congratulationChoice='Выбери вариант поздравления.';
  else if(!congratulationReady(data.congratulationChoice,data.congratulationCompanion))
    issues.congratulationCompanion=congratulations.companionError;
  if(data.congratulationChoice==='public_with_someone'&&data.congratulationCompanion?.trim()&&[...data.congratulationCompanion.trim()].length>companionLimit)
    issues.congratulationCompanion=`Не больше ${companionLimit} символов.`;
  if(!validMenuChoice('hotAppetizer',data.hotAppetizer))issues.hotAppetizer='Выбери горячую закуску.';
  if(!validMenuChoice('mainCourse',data.mainCourse))issues.mainCourse='Выбери основное блюдо.';
  if(!withinLimit('food',data.food))issues.food='Не больше 300 символов.';
  if(!Array.isArray(data.alcoholDrinks)||!data.alcoholDrinks.length)issues.alcoholDrinks='Выбери хотя бы один вариант.';
  if(data.alcoholDrinks?.includes('other')&&(!data.alcoholOther?.trim()||!withinLimit('alcoholOther',data.alcoholOther)))
    issues.alcoholOther=data.alcoholOther?.trim()?'Не больше 80 символов.':'Напиши название напитка.';
  if(!Array.isArray(data.softDrinks)||!data.softDrinks.length)issues.softDrinks='Выбери хотя бы один вариант.';
  if(data.softDrinks?.includes('other')&&(!data.softOther?.trim()||!withinLimit('softOther',data.softOther)))
    issues.softOther=data.softOther?.trim()?'Не больше 80 символов.':'Напиши название напитка.';
  if(!['self','kupchino','pavlovsk'].includes(data.transfer))issues.transfer='Выбери вариант трансфера.';
  if(!validReturnTransfer(data.returnTransfer))issues.returnTransfer='Выбери вариант обратного трансфера.';
  if(!withinLimit('musicRequest',data.musicRequest))issues.musicRequest='Не больше 300 символов.';
  if((data.dressCodeConfirmed??data.dressCode)!==true)issues.dress='Подтверди согласие с дресс-кодом.';
  if(data.venueRulesAccepted!==true)issues.venueRules='Подтверди согласие с правилами площадки.';
  return issues;
}
