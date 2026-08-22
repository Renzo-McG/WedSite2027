import { describe, expect, it } from "vitest";
import {
  CONTRAST_FLOOR,
  CONTROLS,
  CONTROL_GROUPS,
  coerceSettings,
  cssValue,
  defaultSettings,
  estimateContrast,
  exportPayload,
} from "../src/lib/type-preview-settings";

describe("type preview control manifest", () => {
  it("gives every control a unique id", () => {
    const ids = CONTROLS.map((control) => control.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("puts every control in a declared group", () => {
    const groups = new Set(CONTROL_GROUPS.map((group) => group.id));
    for (const control of CONTROLS) expect(groups.has(control.group)).toBe(true);
  });

  it("writes plain-English labels rather than CSS property names", () => {
    for (const control of CONTROLS) {
      expect(control.label).not.toMatch(/--|cqw|translate|opacity|px\b/i);
      expect(control.help.length).toBeGreaterThan(10);
    }
  });

  it("keeps every slider default inside its own range", () => {
    for (const control of CONTROLS) {
      if (control.kind !== "slider") continue;
      expect(control.value).toBeGreaterThanOrEqual(control.min);
      expect(control.value).toBeLessThanOrEqual(control.max);
    }
  });

  it("keeps every choice default among its own options", () => {
    for (const control of CONTROLS) {
      if (control.kind !== "choice") continue;
      expect(control.options.some((option) => option.value === control.value)).toBe(true);
    }
  });
});

describe("settings coercion", () => {
  it("falls back to the Canva baseline for junk input", () => {
    expect(coerceSettings(null)).toEqual(defaultSettings());
    expect(coerceSettings("nonsense")).toEqual(defaultSettings());
    expect(coerceSettings(42)).toEqual(defaultSettings());
  });

  it("clamps out-of-range numbers instead of rejecting the whole file", () => {
    const coerced = coerceSettings({ sizeNames: 9999, inset: -50 });
    expect(coerced.sizeNames).toBe(16);
    expect(coerced.inset).toBe(0);
  });

  it("drops unknown keys", () => {
    const coerced = coerceSettings({ somethingElse: 5, sizeNames: 9 });
    expect(coerced.somethingElse).toBeUndefined();
    expect(coerced.sizeNames).toBe(9);
  });

  it("refuses a font that is not one of the offered options", () => {
    const base = defaultSettings();
    expect(coerceSettings({ displayFont: "Comic Sans" }).displayFont).toBe(base.displayFont);
    expect(coerceSettings({ displayFont: '"Parisienne", cursive' }).displayFont).toBe(
      base.displayFont,
    );
  });

  it("reads a downloaded export back in, so a settings file round-trips", () => {
    const edited = { ...defaultSettings(), sizeNames: 9.4, textVeil: 0.42 };
    const reloaded = coerceSettings(exportPayload(edited));
    expect(reloaded.sizeNames).toBe(9.4);
    expect(reloaded.textVeil).toBe(0.42);
  });

  it("fills in anything a partial or older file leaves out", () => {
    const coerced = coerceSettings({ sizeNames: 9 });
    expect(Object.keys(coerced).sort()).toEqual(Object.keys(defaultSettings()).sort());
  });
});

describe("css values", () => {
  /* Asserts the shape rather than the baseline number: these defaults are
     expected to move as the composition is tuned. */
  it("appends the unit for sliders and leaves font stacks alone", () => {
    const settings = defaultSettings();
    const names = CONTROLS.find((control) => control.id === "sizeNames");
    const font = CONTROLS.find((control) => control.id === "displayFont");
    expect(names && cssValue(names, settings)).toBe(`${settings.sizeNames}cqw`);
    expect(font && cssValue(font, settings)).toBe('"Instrument Serif", Georgia, serif');
  });

  it("appends a unit for every slider so no property is written unitless", () => {
    const settings = defaultSettings();
    for (const control of CONTROLS) {
      if (control.kind !== "slider" || control.unit === "") continue;
      expect(cssValue(control, settings).endsWith(control.unit)).toBe(true);
    }
  });
});

describe("readability guide", () => {
  it("passes at the recommended baseline over a mid-tone film", () => {
    expect(estimateContrast(0.45, 0.76, 0.18)).toBeGreaterThan(CONTRAST_FLOOR);
  });

  /**
   * The dark ink is at risk over the film's dark moments, not its bright ones:
   * a near-transparent invitation over sunlit water still reads well, while the
   * same setting over the shaded planting does not. This is why the studio
   * samples the frame the user is actually looking at rather than assuming one.
   */
  it("warns once the invitation becomes very transparent over dark footage", () => {
    expect(estimateContrast(0.05, 0.05, 0)).toBeLessThan(CONTRAST_FLOOR);
  });

  it("stays comfortable over bright footage even when very transparent", () => {
    expect(estimateContrast(0.8, 0.05, 0)).toBeGreaterThan(CONTRAST_FLOOR);
  });

  it("recovers a failing dark frame as the text veil is raised", () => {
    const bare = estimateContrast(0.05, 0.2, 0);
    const veiled = estimateContrast(0.05, 0.2, 0.75);
    expect(bare).toBeLessThan(CONTRAST_FLOOR);
    expect(veiled).toBeGreaterThan(bare);
    expect(veiled).toBeGreaterThan(CONTRAST_FLOOR);
  });
});
