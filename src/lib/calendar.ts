import { wedding } from "../config/wedding";

const CRLF = "\r\n";

/** RFC 5545 §3.3.11 text escaping. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function compact(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

/** All-day events use an exclusive DTEND, so this is the morning after. */
function dayAfter(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export const eventStart = compact(wedding.date.iso);
export const eventEnd = compact(dayAfter(wedding.date.iso));

export const eventLocation = `${wedding.venue}, ${wedding.location}`;

export function buildIcs(): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Emily and Lawrence//Wedding 2027//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${wedding.calendar.uid}`,
    `DTSTAMP:${wedding.calendar.stamp}`,
    `DTSTART;VALUE=DATE:${eventStart}`,
    `DTEND;VALUE=DATE:${eventEnd}`,
    `SUMMARY:${escapeText(wedding.calendar.title)}`,
    `LOCATION:${escapeText(eventLocation)}`,
    `DESCRIPTION:${escapeText(wedding.calendar.description)}`,
    "STATUS:CONFIRMED",
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.join(CRLF)}${CRLF}`;
}

export function googleCalendarUrl(): string {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", wedding.calendar.title);
  url.searchParams.set("dates", `${eventStart}/${eventEnd}`);
  url.searchParams.set("location", eventLocation);
  url.searchParams.set("details", wedding.calendar.description);
  return url.toString();
}
