export type MockGuest = { id: string; group: "family" | "friends"; name: string; description: string; image: string; portraitPosition?: string; realPortrait?: boolean };
const family = [
 [
  "Ольга",
  "Мама жениха"
 ],
 [
  "Владислав",
  "Папа жениха"
 ],
 [
  "Дарья",
  "Мама невесты"
 ],
 [
  "Вячеслав",
  "Папа невесты"
 ],
 [
  "Лидия Васильевна",
  "Бабушка жениха"
 ],
 [
  "Сергей Иванович",
  "Дедушка жениха"
 ],
 [
  "Галина Николаевна",
  "Бабушка жениха"
 ],
 [
  "Галина Ивановна",
  "Бабушка невесты"
 ],
 [
  "Надежда Константиновна",
  "Бабушка невесты"
 ],
 [
  "Анатолий",
  "Отчим невесты"
 ],
 [
  "Ангелина",
  "Сестра невесты"
 ],
 [
  "Олег",
  "Дядя жениха"
 ],
 [
  "Наталья",
  "Тетя жениха"
 ],
 [
  "Екатерина",
  "Двоюродная сестра жениха"
 ],
 [
  "Мария",
  "Тетя невесты"
 ]
];
const friends = [
 [
  "Виктория",
  "Свидетельница"
 ],
 [
  "Сергей",
  "Свидетель"
 ],
 [
  "Карина",
  "Подруга"
 ],
 [
  "Денис",
  "Друг"
 ],
 [
  "Илья",
  "Друг"
 ],
 [
  "Александра",
  "Подруга"
 ],
 [
  "Андрей",
  "Друг"
 ],
 [
  "Асель",
  "Подруга"
 ],
 [
  "Даниил",
  "Друг"
 ],
 [
  "Ирина",
  "Подруга"
 ],
 [
  "Анастасия",
  "Подруга"
 ]
];
const friendPortraits = ["viktoria","sergey","karina","denis","ilya","alexandra","andrey","asel","daniil","irina","anastasia"];
// Placement only: preserve each friend's stable ID and assigned portrait.
const friendOrder = [0,1,2,3,5,4,6,7,9,8,10];
// Approved portraits, keyed by stable guest ID; unprovided portraits stay unchanged.
const approvedPortraits: Record<string, string> = {
 "family-13":"ekaterina",
 "family-3":"vyacheslav", "family-2":"darya", "family-7":"galina-ivanovna", "family-10":"angelina",
 "family-0":"olga", "family-1":"vladislav", "family-6":"galina-nikolaevna",
 "family-5":"sergey-ivanovich", "family-12":"natalya", "family-4":"lidia-vasilyevna",
 "family-11":"oleg", "family-14":"maria", "family-8":"nadezhda-konstantinovna", "family-9":"anatoly",
};
export const mockGuests: MockGuest[] = [...family.map((g, i) => {
 const id="family-"+i, portrait=approvedPortraits[id];
 return {id,group:"family" as const,name:g[0],description:g[1],
  image:`/images/guests/${portrait}.webp`,
  realPortrait:!!portrait,portraitPosition:portrait?"50% 50%":undefined};
}), ...friendOrder.map(i => ({ id: "friends-" + i, group: "friends" as const, name: friends[i][0], description: friends[i][1], image: `/images/guests/friends/${friendPortraits[i]}.webp`,realPortrait:true,portraitPosition:"50% 50%" }))];
