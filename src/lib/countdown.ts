export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
}

/** Returns null once the target has passed, so callers can show a resolved date. */
export function countdownParts(targetMs: number, nowMs: number): CountdownParts | null {
  const remaining = targetMs - nowMs;
  if (remaining <= 0) return null;
  const totalMinutes = Math.floor(remaining / 60_000);

  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function formatUnit(value: number, singular: string): string {
  return `${value} ${singular}${value === 1 ? "" : "s"}`;
}

/**
 * Full wording for wider viewports. Hours and minutes stay two-digit so
 * the line holds a stable width as the numbers change.
 */
export function countdownUnits(parts: CountdownParts): string[] {
  return [
    formatUnit(parts.days, "day"),
    `${pad(parts.hours)} hours`,
    `${pad(parts.minutes)} minutes`,
  ];
}

/** Compact wording for narrow viewports: `446 days · 04h · 12m`. */
export function countdownUnitsCompact(parts: CountdownParts): string[] {
  return [formatUnit(parts.days, "day"), `${pad(parts.hours)}h`, `${pad(parts.minutes)}m`];
}

/**
 * Coarse, stable description for assistive technology. It changes only once a
 * day, so the countdown is never announced second by second.
 */
export function countdownLabel(parts: CountdownParts | null, resolved: string): string {
  if (!parts) return resolved;
  return `${formatUnit(parts.days, "day")} until ${resolved}`;
}
