import { event } from "@/content/calendar";

export const dynamic = "force-static";

export function GET() {
  const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Anya and Maxim//Wedding invitation//RU",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    "UID:" + event.uid, "DTSTAMP:20261007T000000Z", "DTSTART:" + event.startsAt,
    "SUMMARY:" + escape(event.title), "DESCRIPTION:" + escape(event.description),
    "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-P" + event.reminderDays + "D",
    "DESCRIPTION:" + escape(event.title), "END:VALARM", "END:VEVENT", "END:VCALENDAR",
  ];
  // RFC 5545 folding counts UTF-8 octets, not JavaScript characters.
  const folded = lines.flatMap(line => {
    const result: string[] = [];
    let part = "";
    let bytes = 0;
    for (const char of line) {
      const size = new TextEncoder().encode(char).length;
      if (bytes + size > 75) { result.push(part); part = " "; bytes = 1; }
      part += char; bytes += size;
    }
    result.push(part);
    return result;
  });
  return new Response(folded.join("\r\n") + "\r\n", { headers: {
    "Content-Type": "text/calendar; charset=utf-8",
    "Content-Disposition": 'inline; filename="anya-maxim-wedding.ics"',
  }});
}
