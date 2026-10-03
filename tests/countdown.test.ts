import { describe, expect, it } from "vitest";
import {
  countdownLabel,
  countdownParts,
  countdownUnits,
  countdownUnitsCompact,
  formatUnit,
} from "../src/lib/countdown";

const target = new Date("2027-10-24T00:00:00+08:00").getTime();

function before(days: number, hours: number, minutes: number, seconds: number): number {
  return target - ((days * 86400 + hours * 3600 + minutes * 60 + seconds) * 1000 + 500);
}

describe("countdown", () => {
  it("splits the remaining time into calm minute-resolution units", () => {
    expect(countdownParts(target, before(2, 3, 4, 5))).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
    });
  });

  it("returns null once the target has passed", () => {
    expect(countdownParts(target, target)).toBeNull();
    expect(countdownParts(target, target + 1000)).toBeNull();
  });

  it("pads hours and minutes so the line keeps a stable width", () => {
    expect(countdownUnits({ days: 446, hours: 4, minutes: 12 })).toEqual([
      "446 days",
      "04 hours",
      "12 minutes",
    ]);
  });

  it("offers a compact form for narrow viewports", () => {
    expect(countdownUnitsCompact({ days: 446, hours: 4, minutes: 12 })).toEqual([
      "446 days",
      "04h",
      "12m",
    ]);
  });

  it("pluralises the day count without romantic wording", () => {
    expect(formatUnit(1, "day")).toBe("1 day");
    expect(formatUnit(0, "day")).toBe("0 days");
  });

  it("keeps the accessible label coarse so seconds are never announced", () => {
    const parts = { days: 446, hours: 4, minutes: 12 };
    const label = countdownLabel(parts, "24 October 2027");
    expect(label).toBe("446 days until 24 October 2027");
    expect(label).not.toContain("second");
    expect(countdownLabel(null, "24 October 2027")).toBe("24 October 2027");
  });
});
