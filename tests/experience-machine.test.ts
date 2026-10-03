import { describe, expect, it } from "vitest";
import {
  CALENDAR_CLOSE_SEQUENCE,
  OPEN_SEQUENCE,
  RESEAL_SEQUENCE,
  finalPhase,
  isStageVideoResetPoint,
} from "../src/lib/experience-machine";

describe("v1.2 experience state machine", () => {
  it("uses ordered, explicit opening states and starts media at seam release", () => {
    expect(OPEN_SEQUENCE.map((step) => step.phase)).toEqual([
      "engaging",
      "aligning",
      "unlocking",
      "seam-release",
      "aperture-opening",
      "venue-hold",
      "material-revealing",
      "material-settling",
      "content-revealing",
      "composed",
    ]);
    expect(OPEN_SEQUENCE.find((step) => step.phase === "seam-release")?.at).toBe(760);
    expect(OPEN_SEQUENCE.find((step) => step.phase === "material-revealing")?.at).toBe(5900);
    expect(OPEN_SEQUENCE.at(-1)?.at).toBe(9650);
  });

  it("does not permit a video reset until the reseal has fully resolved", () => {
    for (const step of RESEAL_SEQUENCE.slice(0, -1)) {
      expect(isStageVideoResetPoint(step.phase)).toBe(false);
    }
    expect(finalPhase(RESEAL_SEQUENCE)).toBe("sealed");
    expect(isStageVideoResetPoint(finalPhase(RESEAL_SEQUENCE))).toBe(true);
  });

  it("keeps the calendar mounted through reverse travel before restoring composed", () => {
    expect(CALENDAR_CLOSE_SEQUENCE).toEqual([
      { phase: "calendar-closing", at: 0 },
      { phase: "composed", at: 620 },
    ]);
  });
});
