/** Minimal RFC 5545 (iCalendar) generator for a single event's "Add to Calendar" file. */

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

export type IcsEvent = {
  id:           string;
  title:        string;
  eventDate:    string; // ISO yyyy-mm-dd
  startTime?:   string | null; // "HH:MM", 24-hour
  venue?:       string | null;
  description?: string | null;
};

export function buildEventIcs(event: IcsEvent): string {
  const [year, month, day] = event.eventDate.split("-").map(Number);

  let dtStart: string;
  let dtEnd: string;

  const timeMatch = event.startTime?.match(/^(\d{2}):(\d{2})$/);
  if (timeMatch) {
    const hour   = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);
    const start  = new Date(year, month - 1, day, hour, minute);
    const end    = new Date(start.getTime() + 2 * 60 * 60 * 1000); // default 2h duration
    const fmtLocal = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    dtStart = `DTSTART:${fmtLocal(start)}`;
    dtEnd   = `DTEND:${fmtLocal(end)}`;
  } else {
    // All-day event — DTEND is exclusive per RFC 5545, so it's the next calendar day.
    const startDate = `${year}${pad(month)}${pad(day)}`;
    const next = new Date(year, month - 1, day + 1);
    const endDate = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
    dtStart = `DTSTART;VALUE=DATE:${startDate}`;
    dtEnd   = `DTEND;VALUE=DATE:${endDate}`;
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CP System//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@cp-system`,
    `DTSTAMP:${formatStamp(new Date())}`,
    dtStart,
    dtEnd,
    `SUMMARY:${escapeIcsText(event.title)}`,
    event.venue ? `LOCATION:${escapeIcsText(event.venue)}` : null,
    event.description ? `DESCRIPTION:${escapeIcsText(event.description)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);

  return lines.join("\r\n");
}
