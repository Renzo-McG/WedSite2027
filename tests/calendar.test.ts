import { describe, expect, it } from "vitest";
import { buildIcs, calendarProviders, googleCalendarUrl } from "../src/lib/calendar";

describe("calendar enclosure export", () => {
  const ics = buildIcs();

  it("uses a standards-based all-day date boundary", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20271024");
    expect(ics).toContain("DTEND;VALUE=DATE:20271025");
  });

  it("contains the approved title and location", () => {
    expect(ics).toContain("SUMMARY:Emily & Lawrence — Wedding");
    expect(ics).toContain("LOCATION:Shangri-La Mactan\\, Cebu\\, Philippines");
  });

  it("carries a stable identity and required properties", () => {
    expect(ics).toContain("UID:20271024-wedding@emilyandlawrence.com");
    expect(ics).toContain("PRODID:-//Emily and Lawrence//Wedding 2027//EN");
    expect(ics).toContain("DTSTAMP:20260802T120000Z");
  });

  it("uses CRLF line endings throughout", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.split("\n").every((line) => line === "" || line.endsWith("\r"))).toBe(true);
  });

  it("builds a populated Google Calendar event url", () => {
    const url = new URL(googleCalendarUrl());
    expect(url.searchParams.get("dates")).toBe("20271024/20271025");
    expect(url.searchParams.get("text")).toBe("Emily & Lawrence — Wedding");
    expect(url.searchParams.get("location")).toBe("Shangri-La Mactan, Cebu, Philippines");
  });

  it("shares the same three provider destinations across both experiences", () => {
    const providers = calendarProviders("/WedSite2027/");
    expect(providers.map((provider) => provider.name)).toEqual([
      "Google Calendar",
      "Apple Calendar",
      "Microsoft Outlook",
    ]);
    expect(providers[0]?.href).toBe(googleCalendarUrl());
    expect(providers[1]?.href).toBe("/WedSite2027/emily-lawrence-wedding.ics");
    expect(providers[2]?.href).toBe(providers[1]?.href);
  });
});
