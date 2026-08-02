export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
}

/** Returns null once the target has passed, so callers can show a resolved date. */
export function countdownParts(targetMs: number, nowMs: number): CountdownParts | null {
  const totalMinutes = Math.floor((targetMs - nowMs) / 60000);
  if (totalMinutes <= 0) return null;

  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}

export function formatUnit(value: number, singular: string): string {
  return `${value} ${singular}${value === 1 ? "" : "s"}`;
}

export function countdownUnits(parts: CountdownParts): string[] {
  return [
    formatUnit(parts.days, "day"),
    formatUnit(parts.hours, "hour"),
    formatUnit(parts.minutes, "minute"),
  ];
}
