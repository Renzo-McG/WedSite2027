import { describe, expect, it } from "vitest";
import { buildIcs, calendarProviders, googleCalendarUrl } from "../src/lib/calendar";
import { siteUrl } from "../src/config/site";
import { wedding } from "../src/config/wedding";

const description = [
  "We’d love for you to join us in Cebu as we celebrate our wedding at Shangri-La Mactan. 💚",
  "",
  "✈️ Planning your trip?",
  "We’ll share travel guidance, accommodation recommendations and the latest wedding details on our website.",
  "",
  "🌐 Wedding website",
  siteUrl,
  "",
  "🕊️ More details to follow",
  "The full schedule and further wedding information will be added closer to the date.",
  "",
  "Formal invitation to follow.",
].join("\n");

function unescapeIcsText(value: string): string {
  return value.replace(/\\(n|N|\\|;|,)/g, (_, escaped: string) =>
    escaped === "n" || escaped === "N" ? "\n" : escaped,
  );
}

describe("calendar enclosure export", () => {
  const ics = buildIcs();
  const unfolded = ics.replace(/\r\n[ \t]/g, "");

  it("uses the exact approved calendar copy", () => {
    expect(wedding.calendar.title).toBe("Emily & Lawrence | Wedding");
    expect(wedding.calendar.description).toBe(description);
    expect(wedding.calendar.title).not.toContain("—");
    expect(description).not.toContain("—");
    expect(description).not.toContain("24 October 2027");
  });

  it("uses a standards-based all-day date boundary", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20271024");
    expect(ics).toContain("DTEND;VALUE=DATE:20271025");
  });

  it("contains the approved title and location", () => {
    expect(unfolded).toContain("SUMMARY:Emily & Lawrence | Wedding");
    expect(ics).toContain("LOCATION:Shangri-La Mactan\\, Cebu\\, Philippines");
  });

  it("preserves the full Unicode description and clickable site URL for ICS clients", () => {
    const field = unfolded.split("\r\n").find((line) => line.startsWith("DESCRIPTION:"));
    expect(field).toBeDefined();
    expect(unescapeIcsText(field!.slice("DESCRIPTION:".length))).toBe(description);
    expect(unfolded).toContain(`URL:${siteUrl}\r\n`);
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

  it("folds physical lines at 75 UTF-8 octets without losing emoji", () => {
    expect(
      ics
        .split("\r\n")
        .filter(Boolean)
        .every((line) => new TextEncoder().encode(line).length <= 75),
    ).toBe(true);
    expect(unfolded).toContain("💚");
    expect(unfolded).toContain("✈️");
    expect(unfolded).toContain("🌐");
    expect(unfolded).toContain("🕊️");
  });

  it("builds a populated Google Calendar event url", () => {
    const url = new URL(googleCalendarUrl());
    expect(url.searchParams.get("dates")).toBe("20271024/20271025");
    expect(url.searchParams.get("text")).toBe("Emily & Lawrence | Wedding");
    expect(url.searchParams.get("location")).toBe("Shangri-La Mactan, Cebu, Philippines");
    expect(url.searchParams.get("details")).toBe(description);
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
