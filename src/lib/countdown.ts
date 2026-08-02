export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Returns null once the target has passed, so callers can show a resolved date. */
export function countdownParts(targetMs: number, nowMs: number): CountdownParts | null {
  const totalSeconds = Math.floor((targetMs - nowMs) / 1000);
  if (totalSeconds <= 0) return null;

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function formatUnit(value: number, singular: string): string {
  return `${value} ${singular}${value === 1 ? "" : "s"}`;
}

/**
 * Full wording for wider viewports. Hours, minutes and seconds stay two-digit so
 * the line holds a stable width as the numbers change.
 */
export function countdownUnits(parts: CountdownParts): string[] {
  return [
    formatUnit(parts.days, "day"),
    `${pad(parts.hours)} hours`,
    `${pad(parts.minutes)} minutes`,
    `${pad(parts.seconds)} seconds`,
  ];
}

/** Compact wording for narrow viewports: `446 days · 04h · 12m · 09s`. */
export function countdownUnitsCompact(parts: CountdownParts): string[] {
  return [
    formatUnit(parts.days, "day"),
    `${pad(parts.hours)}h`,
    `${pad(parts.minutes)}m`,
    `${pad(parts.seconds)}s`,
  ];
}

/**
 * Coarse, stable description for assistive technology. It changes only once a
 * day, so the countdown is never announced second by second.
 */
export function countdownLabel(parts: CountdownParts | null, resolved: string): string {
  if (!parts) return resolved;
  return `${formatUnit(parts.days, "day")} until ${resolved}`;
}
