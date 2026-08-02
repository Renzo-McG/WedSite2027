import { describe, expect, it } from "vitest";
import { countdownParts, countdownUnits, formatUnit } from "../src/lib/countdown";

const target = new Date("2027-10-24T00:00:00+08:00").getTime();

describe("countdown", () => {
  it("splits the remaining time into days, hours and minutes", () => {
    const now = target - ((2 * 1440 + 3 * 60 + 4) * 60000 + 30000);
    expect(countdownParts(target, now)).toEqual({ days: 2, hours: 3, minutes: 4 });
  });

  it("returns null once the target has passed", () => {
    expect(countdownParts(target, target)).toBeNull();
    expect(countdownParts(target, target + 60000)).toBeNull();
  });

  it("pluralises units without romantic wording", () => {
    expect(formatUnit(1, "day")).toBe("1 day");
    expect(formatUnit(0, "hour")).toBe("0 hours");
    expect(countdownUnits({ days: 446, hours: 1, minutes: 30 })).toEqual([
      "446 days",
      "1 hour",
      "30 minutes",
    ]);
  });
});
