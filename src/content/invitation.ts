import {wedding} from "./wedding.mjs";
export const invitation = {
  names: { bride: "Anya", groom: "Maxim" },
  date: wedding.date,
  dateISO: wedding.dateISO,
  time: wedding.time,
  hero: { bride: "АННА", groom: "МАКСИМ", src: "/images/couple.jpg", alt: "Временная фотография: жених и невеста целуются, сидя рядом" },
  opening: {
    sealedHint: "Посмотри, вдруг там что-то важное.",
    desktopMessage: "У вас одно новое сообщение",
    message: "На твой телефон пришло новое сообщение",
    letter: "Вам пришло приглашение на свадьбу",
    action: "Дальше больше",
    attention: "С этого момента повнимательнее",
    callout: "Жми быстрее",
    bottom: "Это письмо может поменять ваши планы",
  },
  calendar: { weekdays: ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"], selectedLabel: "17 июля, день нашей свадьбы" },
  story: "Бронируем тебя на этот день",
  venue: { name: "Место нашей встречи", address: "Скоро расскажем, где начинается эта история", mapUrl: null },
};
