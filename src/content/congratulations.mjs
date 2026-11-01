export const congratulations = {
 title:'Поздравление',companionDetailLabel:'С кем',
 options:[{id:'public',label:'Поздравлю публично',detail:'Публично'},{id:'private',label:'Поздравлю лично',detail:'Лично'},{id:'public_with_someone',label:'Поздравлю публично с кем-то',detail:'Публично с кем-то'}],
 companionLabel:'С кем будете поздравлять?',companionPlaceholder:'Например, с Сергеем',companionError:'Напишите, с кем будете поздравлять.',
};
export const companionLimit=120;
export const validCongratulation=value=>congratulations.options.some(option=>option.id===value);
export function congratulationReady(choice,companion){const value=typeof companion==='string'?companion.trim().normalize('NFC'):null;return validCongratulation(choice)&&(choice!=='public_with_someone'||(value!==null&&value.length>0&&[...value].length<=companionLimit&&!/[\u0000-\u001f\u007f]/.test(value)));}
export function congratulationFields(choice,companion){return {congratulationChoice:choice,...(choice==='public_with_someone'?{congratulationCompanion:typeof companion==='string'?companion.trim().normalize('NFC'):companion}:{})};}
