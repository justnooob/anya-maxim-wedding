// Synthetic fixtures only; the exact production renderer is used.
import fs from 'node:fs/promises';
import {renderTicket} from '../src/server/pdf/ticket.mjs';
export const sampleGuest=(name,index=0)=>({guest_name:name,attendance:'yes',who:'Тестовый гость',hot_appetizer_choice:index%2?'hot_fish':'hot_meat',main_course_choice:index%2?'main_meat':'main_fish',transfer:index%2?'pavlovsk':'kupchino',return_transfer:index%2?'not_needed':'needed',alcohol_drinks:index%2?['none']:['red_wine'],soft_drinks:index%2?['apple_juice']:['still_water'],alcohol_other:'',soft_other:'',food:index%2?'Без орехов':'',congratulation_choice:index%2?'private':'public',dress_code:true});
export const longSample=Array.from({length:5},(_,i)=>({...sampleGuest(['Александра-Мария Константиновна Петрова-Смирнова','Константин Александрович Иванов-Петров','Екатерина Владиславовна Соколова','Алексей Максимилианович Петров','Мария Александровна Иванова'][i],i),food:'Аллергия на орехи и кунжут. Просьба исключить следы арахиса, сообщить состав соусов и заправок. '+ 'ОченьДлинноеСловоБезПробелов'.repeat(4),alcohol_drinks:['red_wine','white_wine','cognac','whisky','gin','other'],alcohol_other:'Без сладких добавок, по возможности сухой сидр',soft_drinks:['cola','tonic','apple_juice','orange_juice','tomato_juice','still_water','other'],soft_other:'Травяной чай без сахара и цитрусовых',congratulation_choice:'public_with_someone',congratulation_companion:'Вместе с Александром Константиновичем и Марией Александровной'}));
export const sampleFamily=[sampleGuest('Иван Петров'),sampleGuest('Мария Петрова',1),{guest_name:'Алексей Петров',attendance:'no'},sampleGuest('Екатерина Петрова',2),sampleGuest('Александр Петров',3)];
if(process.argv[1]?.endsWith('pdf-examples.mjs')){
  await fs.mkdir('qa/pdf-examples',{recursive:true});
  const layouts={};
  for(const [name,count] of [['one-guest',1],['two-guests',2],['three-guests',3],['four-guests',4],['five-guests',5]]){await fs.writeFile(`qa/pdf-examples/wedding-ticket-${name}.pdf`,await renderTicket(sampleFamily.slice(0,count),{onLayout:layout=>{layouts[name]=layout;}}));console.log(`Created synthetic ${count}-guest PDF`);}
  await fs.writeFile('qa/pdf-examples/wedding-ticket-long-answers.pdf',await renderTicket(longSample,{onLayout:layout=>{layouts['long-answers']=layout;}}));
  await fs.writeFile('qa/pdf-examples/pagination-layout.json',JSON.stringify(layouts,null,2));
}
