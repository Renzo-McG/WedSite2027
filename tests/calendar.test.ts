import { describe, expect, it } from "vitest";
import calendar from "../public/emily-lawrence-wedding.ics?raw";

describe("calendar enclosure export", () => {
  it("uses a standards-based all-day date boundary", () => {
    expect(calendar).toContain("DTSTART;VALUE=DATE:20271024");
    expect(calendar).toContain("DTEND;VALUE=DATE:20271025");
  });

  it("contains the approved title and location", () => {
    expect(calendar).toContain("SUMMARY:Emily & Lawrence — Wedding");
    expect(calendar).toContain("LOCATION:Shangri-La Mactan\\, Cebu\\, Philippines");
  });
});
