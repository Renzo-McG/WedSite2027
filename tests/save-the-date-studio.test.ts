import { describe, expect, it } from "vitest";
import {
  CONTROLS,
  SETTINGS_VERSION,
  coerceSettings,
  defaultSettings,
  exportPayload,
  frostBand,
  functionalZoneEscapes,
} from "../src/lib/type-preview-settings";
import { ARTWORK_RATIO, inspectSvg } from "../src/lib/svg-artwork";
import { buildZip, crc32, productionPackage } from "../src/lib/production-package";

/* ------------------------------------------------------------- artwork */

const CANVA_EXPORT = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="540" height="756" viewBox="0 0 540 756" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M55 178 L243 178 L243 197 L55 197 Z" fill="#171C18"/>
  <path d="M56 252 L483 252 L483 283 L56 283 Z" fill="#171C18"/>
</svg>`;

describe("Canva SVG inspection", () => {
  it("accepts a clean transparent 540x756 export", () => {
    const result = inspectSvg(CANVA_EXPORT);
    expect(result.ok).toBe(true);
    expect(result.width).toBe(540);
    expect(result.height).toBe(756);
    expect(result.ratioMatches).toBe(true);
    expect(result.warnings).toHaveLength(0);
    expect(result.passed).toContain("Transparent background");
    expect(result.passed).toContain("Vector artwork");
  });

  it("treats the viewBox as the real coordinate system", () => {
    // Canva sometimes writes width/height in points while the viewBox is the
    // artboard, so the ratio has to come from the viewBox.
    const result = inspectSvg(
      '<svg width="405pt" height="567pt" viewBox="0 0 540 756"><path d="M0 0"/></svg>',
    );
    expect(result.width).toBe(540);
    expect(result.ratio).toBeCloseTo(ARTWORK_RATIO, 5);
    expect(result.ratioMatches).toBe(true);
  });

  it("warns when the artboard is not 5:7", () => {
    const result = inspectSvg('<svg viewBox="0 0 800 600"><path d="M0 0"/></svg>');
    expect(result.ok).toBe(true);
    expect(result.warnings.map((w) => w.code)).toContain("ratio");
  });

  it("warns about a solid background left on in the Canva export", () => {
    const result = inspectSvg(
      '<svg viewBox="0 0 540 756"><rect width="540" height="756" fill="#ffffff"/></svg>',
    );
    expect(result.warnings.map((w) => w.code)).toContain("background");
    expect(result.passed).not.toContain("Transparent background");
  });

  it("accepts a percentage-sized transparent rect without calling it a background", () => {
    const result = inspectSvg(
      '<svg viewBox="0 0 540 756"><rect width="100%" height="100%" fill="none"/></svg>',
    );
    expect(result.warnings.map((w) => w.code)).not.toContain("background");
  });

  it("warns about live text that depends on a font being installed", () => {
    const result = inspectSvg('<svg viewBox="0 0 540 756"><text x="0" y="0">EMILY</text></svg>');
    expect(result.warnings.map((w) => w.code)).toContain("text");
  });

  it("warns about embedded bitmaps", () => {
    const result = inspectSvg(
      '<svg viewBox="0 0 540 756"><image href="data:image/png;base64,AAA"/></svg>',
    );
    expect(result.warnings.map((w) => w.code)).toContain("raster");
  });

  it("refuses active content outright", () => {
    const scripted = inspectSvg('<svg viewBox="0 0 540 756"><script>alert(1)</script></svg>');
    expect(scripted.ok).toBe(false);
    expect(scripted.warnings.some((w) => w.blocking)).toBe(true);

    const inlineHandler = inspectSvg('<svg viewBox="0 0 540 756"><path onload="x()"/></svg>');
    expect(inlineHandler.ok).toBe(false);
  });

  it("ignores active-looking content inside comments", () => {
    const result = inspectSvg(
      '<svg viewBox="0 0 540 756"><!-- <script>no</script> --><path d="M0 0"/></svg>',
    );
    expect(result.ok).toBe(true);
  });

  it("rejects a file that is not an SVG at all", () => {
    const result = inspectSvg("just some text");
    expect(result.ok).toBe(false);
    expect(result.width).toBeNull();
  });
});

/* --------------------------------------------------------- frosted band */

describe("mobile frosted band", () => {
  it("fills the screen at full height", () => {
    const band = frostBand(100, 50);
    expect(band.topPct).toBe(0);
    expect(band.bottomPct).toBe(100);
    expect(band.revealTopPct).toBe(0);
    expect(band.revealBottomPct).toBe(0);
  });

  /* The headline behaviour of the whole upgrade. */
  it("reveals video above AND below simultaneously as it shortens", () => {
    const full = frostBand(100, 50);
    const medium = frostBand(80, 50);
    const short = frostBand(60, 50);

    expect(medium.revealTopPct).toBeGreaterThan(full.revealTopPct);
    expect(medium.revealBottomPct).toBeGreaterThan(full.revealBottomPct);
    expect(short.revealTopPct).toBeGreaterThan(medium.revealTopPct);
    expect(short.revealBottomPct).toBeGreaterThan(medium.revealBottomPct);
  });

  it("reveals equal amounts top and bottom while centred", () => {
    for (const height of [95, 80, 65, 50, 30]) {
      const band = frostBand(height, 50);
      expect(band.revealTopPct).toBeCloseTo(band.revealBottomPct, 10);
      expect(band.revealTopPct).toBeCloseTo((100 - height) / 2, 10);
    }
  });

  it("trades one end against the other when moved, without changing height", () => {
    const centred = frostBand(70, 50);
    const raised = frostBand(70, 40);
    expect(raised.bottomPct - raised.topPct).toBeCloseTo(centred.bottomPct - centred.topPct, 10);
    expect(raised.revealTopPct).toBeLessThan(centred.revealTopPct);
    expect(raised.revealBottomPct).toBeGreaterThan(centred.revealBottomPct);
  });

  /* A tall band pushed off one edge simply runs past it — the overflowing end
     reports no reveal rather than a negative one, while the other end still
     opens up honestly. */
  it("clamps the overflowing end without hiding the reveal at the other", () => {
    const band = frostBand(100, 30);
    expect(band.topPct).toBe(-20);
    expect(band.revealTopPct).toBe(0);
    expect(band.revealBottomPct).toBe(20);
  });

  it("notices when the functional zone leaves the band", () => {
    const band = frostBand(60, 50); // 20% → 80%
    expect(functionalZoneEscapes(band, 30, 70)).toBe(false);
    expect(functionalZoneEscapes(band, 30, 90)).toBe(true);
    expect(functionalZoneEscapes(band, 10, 70)).toBe(true);
  });
});

/* -------------------------------------------------------------- settings */

describe("studio settings v2", () => {
  it("ships the artwork and frost controls", () => {
    const ids = CONTROLS.map((control) => control.id);
    for (const id of [
      "artworkMode",
      "artDesktopScale",
      "artMobileScale",
      "artMobileY",
      "mobileFrostHeight",
      "mobileFrostY",
      "frostEdgeSoftness",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("defaults to a full-height, centred frosted area", () => {
    const base = defaultSettings();
    expect(base.mobileFrostHeight).toBe(100);
    expect(base.mobileFrostY).toBe(50);
  });

  it("starts on the built-in wording until artwork is uploaded", () => {
    expect(defaultSettings().artworkMode).toBe("native");
  });

  it("gates the per-word typography controls to the built-in wording", () => {
    const names = CONTROLS.find((control) => control.id === "sizeNames");
    const artScale = CONTROLS.find((control) => control.id === "artMobileScale");
    expect(names?.showWhen).toEqual({ artworkMode: "native" });
    expect(artScale?.showWhen).toEqual({ artworkMode: "svg" });
  });

  it("keeps every label free of CSS jargon, including the new controls", () => {
    for (const control of CONTROLS) {
      expect(control.label).not.toMatch(/--|cqw|translate|mask|opacity|px\b/i);
      expect(control.help.length).toBeGreaterThan(10);
    }
  });

  /* Replacing artwork must never quietly undo the placement work. */
  it("preserves every placement value across an artwork change", () => {
    const tuned = {
      ...defaultSettings(),
      artMobileScale: 74,
      artMobileY: -12,
      mobileFrostHeight: 62,
      frostEdgeSoftness: 24,
      countdownY: 3,
    };
    // Switching mode is the only thing an upload changes.
    const after = coerceSettings({ ...tuned, artworkMode: "svg" });
    expect(after.artMobileScale).toBe(74);
    expect(after.artMobileY).toBe(-12);
    expect(after.mobileFrostHeight).toBe(62);
    expect(after.frostEdgeSoftness).toBe(24);
    expect(after.countdownY).toBe(3);
    expect(after.artworkMode).toBe("svg");
  });

  it("round-trips an exported settings file at v2", () => {
    const tuned = { ...defaultSettings(), mobileFrostHeight: 58, artMobileScale: 70 };
    const payload = exportPayload(tuned);
    expect(payload.version).toBe(SETTINGS_VERSION);
    const reloaded = coerceSettings(payload);
    expect(reloaded.mobileFrostHeight).toBe(58);
    expect(reloaded.artMobileScale).toBe(70);
  });

  it("fills v2 fields in from a v1 settings file", () => {
    const older = { sizeNames: 9.4, textVeil: 0.4 };
    const coerced = coerceSettings(older);
    expect(coerced.sizeNames).toBe(9.4);
    expect(coerced.mobileFrostHeight).toBe(100);
    expect(coerced.artworkMode).toBe("native");
  });

  it("refuses an artwork mode that is not offered", () => {
    expect(coerceSettings({ artworkMode: "sideways" }).artworkMode).toBe("native");
  });
});

/* ---------------------------------------------------- production package */

describe("production package", () => {
  it("matches a known CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("carries the artwork, the settings and a readme", () => {
    const files = productionPackage({
      artworkSvg: CANVA_EXPORT,
      settingsJson: "{}",
      artworkDimensions: "540 × 756 SVG",
      exportedAt: "2026-08-22T12:00:00.000Z",
    });
    expect(files.map((file) => file.name)).toEqual([
      "save-the-date-approved/invitation-artwork.svg",
      "save-the-date-approved/settings.json",
      "save-the-date-approved/README.txt",
    ]);
    expect(files[2]?.content).toContain("2026-08-22");
  });

  it("omits the artwork entry when the built-in wording is approved", () => {
    const files = productionPackage({
      artworkSvg: null,
      settingsJson: "{}",
      artworkDimensions: "",
      exportedAt: "2026-08-22T12:00:00.000Z",
    });
    expect(files.map((file) => file.name)).not.toContain(
      "save-the-date-approved/invitation-artwork.svg",
    );
    expect(files[1]?.content).toContain("built-in wording");
  });

  it("writes a structurally valid zip", () => {
    const zip = buildZip([{ name: "a.txt", content: "hello" }]);
    // Local header, central directory and end-of-directory signatures.
    expect(Array.from(zip.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const text = new TextDecoder().decode(zip);
    expect(text).toContain("a.txt");
    expect(text).toContain("hello");
    expect(Array.from(zip.slice(-22, -18))).toEqual([0x50, 0x4b, 0x05, 0x06]);
  });

  it("records one directory entry per file", () => {
    const zip = buildZip([
      { name: "a.txt", content: "one" },
      { name: "b.txt", content: "two" },
    ]);
    const count = zip.slice(-22 + 8, -22 + 10);
    expect(count[0]).toBe(2);
  });
});
