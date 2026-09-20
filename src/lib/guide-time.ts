/**
 * The time in Cebu, told relative to London.
 *
 * The gap is not a constant: London alternates between GMT and BST, and the
 * Philippines keeps UTC+8 all year, so the difference is 7 hours in UK summer
 * and 8 in UK winter. Both sides are read from their IANA zones at the moment
 * being asked about, so the figure stays right through every clock change
 * without anything to maintain.
 */

const LONDON = "Europe/London";
const CEBU = "Asia/Manila";

/** Wall-clock minutes past midnight in a zone, for a given moment. */
function minutesOfDay(zone: string, now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const at = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return at("hour") * 60 + at("minute");
}

/** Hours Cebu is ahead of London at a given moment: 7 in UK summer time, 8 in winter. */
export function cebuOffsetHours(now: Date): number {
  // Cebu is always ahead of London, so the difference modulo a day is exact.
  const gap = minutesOfDay(CEBU, now) - minutesOfDay(LONDON, now);
  return Math.round(((gap + 1440) % 1440) / 60);
}

/** "7 hrs ahead of London" — the gap in words, pluralised. */
export function cebuGapLabel(now: Date): string {
  const hours = cebuOffsetHours(now);
  return `${hours} ${hours === 1 ? "hr" : "hrs"} ahead of London`;
}
