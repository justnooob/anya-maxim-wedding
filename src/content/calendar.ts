import { invitation } from "./invitation";

export const event = {
  title: "Свадьба Ани и Максима",
  startsAt: new Date(`${invitation.dateISO}T${invitation.time}:00+03:00`).toISOString().replace(/[-:]/g, "").replace(".000", ""),
  description: `${invitation.date}. Начало в ${invitation.time} (московское время).`,
  uid: "anya-maxim-20270717@wedding-invitation.local",
  reminderDays: 7,
  reminderLabel: "Добавить напоминание",
};
