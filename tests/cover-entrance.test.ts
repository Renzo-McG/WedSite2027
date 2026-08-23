import { describe, expect, it } from "vitest";
import {
  DEFAULT_TIMING,
  REDUCED_TIMING,
  buildEntrance,
  checkpointPhase,
  coverHasCleared,
  entranceDuration,
  isVenueOnly,
  monogramVars,
  venueWindow,
  type EntranceTiming,
} from "../src/lib/entrance-machine";
import {
  CONTROLS,
  SETTINGS_VERSION,
  coerceSettings,
  controlIsVisible,
  defaultSettings,
} from "../src/lib/type-preview-settings";
import {
  LOOK_SCHEMA_VERSION,
  buildZip,
  completeLookPackage,
  parseLookFiles,
  productionPackage,
  readZip,
} from "../src/lib/production-package";

/* ------------------------------------------------------------- timeline */

describe("the entrance timeline", () => {
  it("runs the phases in the intended order", () => {
    const phases = buildEntrance(DEFAULT_TIMING).map((step) => step.phase);
    expect(phases).toEqual([
      "acknowledge",
      "opening",
      "venue",
      "material",
      "content",
      "functional",
      "still",
    ]);
  });

  it("never moves backwards in time", () => {
    const steps = buildEntrance(DEFAULT_TIMING);
    for (let i = 1; i < steps.length; i += 1) {
      expect(steps[i]!.at).toBeGreaterThanOrEqual(steps[i - 1]!.at);
    }
  });

  /* The headline creative requirement: the venue genuinely gets a beat with
     nothing of the invitation on top of it. */
  it("gives the venue a real moment of its own", () => {
    const window = venueWindow(DEFAULT_TIMING);
    expect(window.end - window.start).toBe(DEFAULT_TIMING.venueHold);
    expect(window.end - window.start).toBeGreaterThan(0);
  });

  it("lengthens the venue moment when asked, without disturbing what precedes it", () => {
    const longer: EntranceTiming = { ...DEFAULT_TIMING, venueHold: 4000 };
    const base = venueWindow(DEFAULT_TIMING);
    const held = venueWindow(longer);
    expect(held.start).toBe(base.start);
    expect(held.end - held.start).toBe(4000);
  });

  it("can remove the venue pause entirely", () => {
    const none = venueWindow({ ...DEFAULT_TIMING, venueHold: 0 });
    expect(none.end - none.start).toBe(0);
  });

  it("hides the invitation until after the venue moment", () => {
    for (const phase of ["closed", "acknowledge", "opening", "venue"] as const) {
      expect(isVenueOnly(phase)).toBe(true);
    }
    for (const phase of ["material", "content", "functional", "still"] as const) {
      expect(isVenueOnly(phase)).toBe(false);
    }
  });

  it("clears the cover before the venue moment begins", () => {
    expect(coverHasCleared("closed")).toBe(false);
    expect(coverHasCleared("acknowledge")).toBe(false);
    expect(coverHasCleared("opening")).toBe(false);
    expect(coverHasCleared("venue")).toBe(true);
    expect(coverHasCleared("still")).toBe(true);
  });

  it("brings the wording in after the frost in sequential mode", () => {
    const steps = buildEntrance({ ...DEFAULT_TIMING, arrivalMode: "sequential" });
    const material = steps.find((s) => s.phase === "material")!.at;
    const content = steps.find((s) => s.phase === "content")!.at;
    expect(content).toBe(material + DEFAULT_TIMING.frostArrival);
  });

  it("brings the wording in alongside the frost in together mode", () => {
    const steps = buildEntrance({ ...DEFAULT_TIMING, arrivalMode: "together" });
    const material = steps.find((s) => s.phase === "material")!.at;
    const content = steps.find((s) => s.phase === "content")!.at;
    expect(content).toBe(material);
  });

  it("staggers the countdown behind the wording, or not, as configured", () => {
    const staggered = buildEntrance({ ...DEFAULT_TIMING, functionalDelay: 600 });
    const content = staggered.find((s) => s.phase === "content")!.at;
    expect(staggered.find((s) => s.phase === "functional")!.at).toBe(content + 600);

    const together = buildEntrance({ ...DEFAULT_TIMING, functionalDelay: 0 });
    expect(together.find((s) => s.phase === "functional")!.at).toBe(
      together.find((s) => s.phase === "content")!.at,
    );
  });

  it("treats a negative duration as zero rather than running time backwards", () => {
    const steps = buildEntrance({ ...DEFAULT_TIMING, venueHold: -900 });
    const venue = steps.find((s) => s.phase === "venue")!.at;
    expect(steps.find((s) => s.phase === "material")!.at).toBe(venue);
  });

  it("is meaningfully shorter under reduced motion, but still a real sequence", () => {
    expect(entranceDuration(REDUCED_TIMING)).toBeLessThan(entranceDuration(DEFAULT_TIMING));
    // Not simply zeroed: the cover still clears and the venue still shows.
    expect(REDUCED_TIMING.coverOpen).toBeGreaterThan(0);
    expect(REDUCED_TIMING.venueHold).toBeGreaterThan(0);
    expect(venueWindow(REDUCED_TIMING).end).toBeGreaterThan(venueWindow(REDUCED_TIMING).start);
  });

  it("maps the studio's checkpoints onto real phases", () => {
    expect(checkpointPhase("closed")).toBe("closed");
    expect(checkpointPhase("venue")).toBe("venue");
    expect(checkpointPhase("finished")).toBe("still");
  });
});

/* ------------------------------------------------------------- monogram */

describe("monogram idle motion", () => {
  const base = {
    rotate: true,
    rotationSeconds: 40,
    direction: "cw" as const,
    startAngle: 0,
    breathe: true,
    breathAmount: 1.5,
    breathSeconds: 6,
  };

  it("turns a full circle in the chosen direction", () => {
    expect(monogramVars(base)["--tp-mono-rotate-to"]).toBe("360deg");
    expect(monogramVars({ ...base, direction: "ccw" })["--tp-mono-rotate-to"]).toBe("-360deg");
  });

  it("rotates a full turn from wherever it starts", () => {
    const vars = monogramVars({ ...base, startAngle: 45 });
    const from = Number.parseFloat(vars["--tp-mono-rotate-from"]!);
    const to = Number.parseFloat(vars["--tp-mono-rotate-to"]!);
    expect(to - from).toBe(360);
  });

  it("pauses rather than removing the animation when switched off", () => {
    expect(monogramVars({ ...base, rotate: false })["--tp-mono-rotate-state"]).toBe("paused");
    expect(monogramVars({ ...base, breathe: false })["--tp-mono-breath-state"]).toBe("paused");
  });

  /* Breathing is scale-only and small; anything larger reads as a pulse. */
  it("keeps breathing to a restrained scale just above rest", () => {
    expect(monogramVars(base)["--tp-mono-breath-scale"]).toBe("1.015");
    const control = CONTROLS.find((c) => c.id === "breathAmount");
    expect(control?.kind).toBe("slider");
    if (control?.kind === "slider") expect(control.max).toBeLessThanOrEqual(4);
  });

  it("never produces a zero-length animation", () => {
    const vars = monogramVars({ ...base, rotationSeconds: 0, breathSeconds: 0 });
    expect(vars["--tp-mono-rotate-duration"]).toBe("1s");
    expect(vars["--tp-mono-breath-duration"]).toBe("1s");
  });
});

/* --------------------------------------------------------- studio state */

describe("cover settings", () => {
  it("defaults to the Canva monogram cover", () => {
    expect(defaultSettings().coverMode).toBe("monogram");
  });

  /* The old mark, its disc and the word Open are replaced, not layered over. */
  it("hides the monogram controls when the built-in mark is chosen", () => {
    const monogram = { ...defaultSettings(), coverMode: "monogram" };
    const builtin = { ...defaultSettings(), coverMode: "builtin" };
    const scale = CONTROLS.find((c) => c.id === "monogramScale")!;
    expect(controlIsVisible(scale, monogram)).toBe(true);
    expect(controlIsVisible(scale, builtin)).toBe(false);
  });

  it("keeps entrance timing relevant in both cover modes", () => {
    const venue = CONTROLS.find((c) => c.id === "venueHoldSeconds")!;
    expect(controlIsVisible(venue, { ...defaultSettings(), coverMode: "builtin" })).toBe(true);
  });

  it("still gates the artwork controls on artwork mode", () => {
    const artScale = CONTROLS.find((c) => c.id === "artMobileScale")!;
    expect(controlIsVisible(artScale, { ...defaultSettings(), artworkMode: "svg" })).toBe(true);
    expect(controlIsVisible(artScale, { ...defaultSettings(), artworkMode: "native" })).toBe(false);
  });

  it("offers a venue hold that reaches the full requested range", () => {
    const control = CONTROLS.find((c) => c.id === "venueHoldSeconds")!;
    expect(control.kind).toBe("slider");
    if (control.kind === "slider") {
      expect(control.min).toBe(0);
      expect(control.max).toBeGreaterThanOrEqual(5);
    }
  });

  it("keeps rotation slow enough never to read as a spinner", () => {
    const control = CONTROLS.find((c) => c.id === "rotationSeconds")!;
    // Expressed as seconds per turn, so the *minimum* is the fastest allowed.
    if (control.kind === "slider") expect(control.min).toBeGreaterThanOrEqual(10);
  });

  it("keeps every new label free of CSS jargon", () => {
    for (const control of CONTROLS.filter((c) => c.group === "cover" || c.group === "entrance")) {
      expect(control.label).not.toMatch(/--|rotateZ|translate|scale\(|cqw|opacity|ms\b/i);
      expect(control.help.length).toBeGreaterThan(10);
    }
  });

  it("fills the new cover settings in from an older saved file", () => {
    const older = { sizeNames: 9.4, mobileFrostHeight: 61 };
    const coerced = coerceSettings(older);
    expect(coerced.mobileFrostHeight).toBe(61);
    expect(coerced.coverMode).toBe("monogram");
    expect(coerced.venueHoldSeconds).toBe(1.5);
  });

  it("refuses a cover mode that is not offered", () => {
    expect(coerceSettings({ coverMode: "sideways" }).coverMode).toBe("monogram");
  });

  it("has bumped the settings version for the new controls", () => {
    expect(SETTINGS_VERSION).toBeGreaterThanOrEqual(3);
  });
});

/* ------------------------------------------------------------ packaging */

const TINY_SVG = '<svg viewBox="0 0 540 540"><circle cx="270" cy="270" r="100"/></svg>';

describe("looks carrying the monogram pair", () => {
  const manifest = {
    schemaVersion: LOOK_SCHEMA_VERSION,
    exportedAt: "2026-08-23T10:00:00.000Z",
    settings: { coverMode: "monogram", venueHoldSeconds: 2.4 },
  };

  it("exports all three pieces of artwork", () => {
    const files = completeLookPackage(
      { invitation: TINY_SVG, monogramOuter: TINY_SVG, monogramInner: TINY_SVG },
      manifest,
    );
    expect(files.map((f) => f.name)).toEqual([
      "invitation-artwork.svg",
      "monogram-outer.svg",
      "monogram-inner.svg",
      "settings.json",
      "README.txt",
    ]);
  });

  it("says plainly which piece is missing rather than inventing one", () => {
    const files = completeLookPackage(
      { invitation: TINY_SVG, monogramOuter: null, monogramInner: null },
      manifest,
    );
    expect(files.map((f) => f.name)).not.toContain("monogram-outer.svg");
    const readme = files.find((f) => f.name === "README.txt")!.content;
    expect(readme).toContain("Not included:");
    expect(readme).toContain("Monogram — outer piece");
  });

  it("still accepts the older single-artwork call shape", () => {
    const files = completeLookPackage(TINY_SVG, manifest);
    expect(files.map((f) => f.name)).toContain("invitation-artwork.svg");
  });

  it("round-trips the pair through a real zip", async () => {
    const zip = buildZip(
      completeLookPackage(
        { invitation: TINY_SVG, monogramOuter: TINY_SVG, monogramInner: TINY_SVG },
        manifest,
      ),
    );
    const read = await readZip(
      zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer,
    );
    const parsed = parseLookFiles(read);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.artworkSvg).toBe(TINY_SVG);
    expect(parsed.monogramOuter).toBe(TINY_SVG);
    expect(parsed.monogramInner).toBe(TINY_SVG);
    expect(parsed.settings.venueHoldSeconds).toBe(2.4);
  });

  /* An older package must import what it has rather than being rejected. */
  it("imports a v1 look and reports no monogram", async () => {
    const v1 = buildZip([
      { name: "invitation-artwork.svg", content: TINY_SVG },
      {
        name: "settings.json",
        content: JSON.stringify({
          schemaVersion: 1,
          exportedAt: "2026-08-01T00:00:00.000Z",
          settings: { mobileFrostHeight: 61 },
        }),
      },
    ]);
    const read = await readZip(
      v1.buffer.slice(v1.byteOffset, v1.byteOffset + v1.byteLength) as ArrayBuffer,
    );
    const parsed = parseLookFiles(read);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.artworkSvg).toBe(TINY_SVG);
    expect(parsed.monogramOuter).toBeNull();
    expect(parsed.monogramInner).toBeNull();
  });

  it("does not mistake a monogram file for the invitation artwork", async () => {
    const zip = buildZip(
      completeLookPackage(
        { invitation: null, monogramOuter: TINY_SVG, monogramInner: TINY_SVG },
        manifest,
      ),
    );
    const read = await readZip(
      zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer,
    );
    const parsed = parseLookFiles(read);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.artworkSvg).toBeNull();
    expect(parsed.monogramOuter).toBe(TINY_SVG);
  });

  it("includes the approved pair in the production package", () => {
    const files = productionPackage({
      artworkSvg: TINY_SVG,
      monogramOuter: TINY_SVG,
      monogramInner: TINY_SVG,
      settingsJson: "{}",
      artworkDimensions: "540 × 756 SVG",
      exportedAt: "2026-08-23T10:00:00.000Z",
    });
    expect(files.map((f) => f.name)).toEqual([
      "save-the-date-approved/invitation-artwork.svg",
      "save-the-date-approved/monogram-outer.svg",
      "save-the-date-approved/monogram-inner.svg",
      "save-the-date-approved/settings.json",
      "save-the-date-approved/README.txt",
    ]);
    expect(files.at(-1)!.content).toContain("outer and centre pieces included");
  });

  it("notes in the production README when no monogram was supplied", () => {
    const files = productionPackage({
      artworkSvg: TINY_SVG,
      settingsJson: "{}",
      artworkDimensions: "540 × 756 SVG",
      exportedAt: "2026-08-23T10:00:00.000Z",
    });
    expect(files.at(-1)!.content).toContain("not supplied");
  });
});
