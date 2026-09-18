/** Hours Cebu is ahead of London at a given moment: 7 in UK summer time, 8 in winter. */
export function cebuOffsetHours(now: Date): number {
  const hour = (zone: string) =>
    Number(
      new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "numeric", hourCycle: "h23" })
        .formatToParts(now)
        .find((part) => part.type === "hour")?.value,
    );
  // Cebu is always ahead of London, so the difference modulo 24 is exact.
  return (hour("Asia/Manila") - hour("Europe/London") + 24) % 24;
}
