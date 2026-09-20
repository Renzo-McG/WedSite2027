import { describe, expect, it } from "vitest";
import { buildIcs, googleCalendarUrl } from "../src/lib/calendar";
import { WEDDING_WEBSITE_URL, wedding } from "../src/config/wedding";

describe("calendar enclosure export", () => {
  const ics = buildIcs();

  it("uses a standards-based all-day date boundary", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20271024");
    expect(ics).toContain("DTEND;VALUE=DATE:20271025");
  });

  it("contains the approved title and location", () => {
    expect(ics).toContain("SUMMARY:💒 Emily and Lawrence - Wedding");
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
    expect(url.searchParams.get("text")).toBe("💒 Emily and Lawrence - Wedding");
    expect(url.searchParams.get("location")).toBe("Shangri-La Mactan, Cebu, Philippines");
  });

  /* The description is the same text everywhere it is offered, so Google and
     the .ics can never drift apart. */
  it("gives every destination the same description", () => {
    const fromGoogle = new URL(googleCalendarUrl()).searchParams.get("details");
    expect(fromGoogle).toBe(wedding.calendar.description);
  });
});

describe("the calendar description", () => {
  const { description } = wedding.calendar;

  it("keeps each section apart with a blank line", () => {
    const sections = description.split("\n\n");
    expect(sections).toHaveLength(4);
    expect(sections.every((section) => section.trim().length > 0)).toBe(true);
  });

  it("opens each section with its own mark", () => {
    const sections = description.split("\n\n");
    expect(sections[0]!.startsWith("💍")).toBe(true);
    expect(sections[1]!.startsWith("🗓")).toBe(true);
    expect(sections[2]!.startsWith("✈️")).toBe(true);
    expect(sections[3]!.startsWith("🌴")).toBe(true);
  });

  it("prints the website as a plain readable address", () => {
    expect(description).toContain(WEDDING_WEBSITE_URL);
  });

  /* Blank lines survive only if they are escaped rather than folded away. */
  it("escapes the breaks into the .ics instead of collapsing them", () => {
    const line = buildIcs()
      .split("\r\n")
      .find((row) => row.startsWith("DESCRIPTION:"));
    expect(line).toBeDefined();
    expect(line).toContain("\\n\\n");
    expect(line).not.toContain("\n");
  });

  it("offers the website in its own field as well as in the words", () => {
    expect(buildIcs()).toContain(`URL;VALUE=URI:${WEDDING_WEBSITE_URL}`);
  });
});

/* The house style: hyphens, commas and line breaks, never an em dash. */
describe("guest-facing calendar copy", () => {
  it("uses no em dashes", () => {
    expect(wedding.calendar.title).not.toContain("—");
    expect(wedding.calendar.description).not.toContain("—");
  });
});
