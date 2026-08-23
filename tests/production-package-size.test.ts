import { describe, expect, it } from "vitest";
import {
  buildZip,
  completeLookPackage,
  LOOK_SCHEMA_VERSION,
  parseLookFiles,
  productionPackage,
  readZip,
} from "../src/lib/production-package";

/**
 * A real Canva export runs to hundreds of kilobytes of vector path data — one
 * enormous `<path d="...">` full of curve commands is typical, not a handful
 * of simple shapes. `buildZip` used to assemble its output with
 * `array.push(...bytes)` and `[...bytes]`, both of which pass every byte as an
 * individual function argument or array-literal element; past a few tens of
 * thousands of bytes that throws `RangeError: Maximum call stack size
 * exceeded`. The tiny placeholder SVGs used elsewhere in the test suite never
 * came close to that threshold, which is exactly why this shipped.
 *
 * These fixtures are deliberately shaped like the real thing — one long path
 * built from thousands of short curve segments, ASCII throughout so string
 * length and UTF-8 byte length match exactly, which makes the size targets
 * below precise.
 */
function realisticSvg(targetBytes: number): string {
  const segments: string[] = [];
  let bytes = 0;
  let x = 10;
  let y = 10;
  while (bytes < targetBytes) {
    x = (x + 3.7) % 520;
    y = (y + 2.3) % 736;
    const segment = `C ${x.toFixed(2)} ${y.toFixed(2)} ${(x + 1.1).toFixed(2)} ${(y + 0.7).toFixed(2)} ${(x + 2.2).toFixed(2)} ${(y + 1.4).toFixed(2)} `;
    segments.push(segment);
    bytes += segment.length;
  }
  const path = `<path d="M 10 10 ${segments.join("")}Z" fill="#171C18"/>`;
  return `<svg width="540" height="756" viewBox="0 0 540 756" xmlns="http://www.w3.org/2000/svg">${path}</svg>`;
}

const SIZES_KB = [100, 500, 1_000, 5_000] as const;

describe.each(SIZES_KB)("a realistic ~%i KB Canva SVG", (kb) => {
  const svg = realisticSvg(kb * 1024);
  const svgBytes = new TextEncoder().encode(svg).length;

  it("is actually in the size range it claims to be", () => {
    // Confirms the fixture itself is honest before trusting what it exercises.
    expect(svgBytes).toBeGreaterThanOrEqual(kb * 1024);
    expect(svgBytes).toBeLessThan(kb * 1024 * 1.05);
  });

  it("builds a complete-look zip without a RangeError", () => {
    const files = completeLookPackage(svg, {
      schemaVersion: LOOK_SCHEMA_VERSION,
      exportedAt: "2026-08-22T12:00:00.000Z",
      settings: { artworkMode: "svg", mobileFrostHeight: 57 },
    });
    expect(() => buildZip(files)).not.toThrow();
  });

  it("builds a production package zip without a RangeError", () => {
    const files = productionPackage({
      artworkSvg: svg,
      settingsJson: JSON.stringify({ artworkMode: "svg" }),
      artworkDimensions: "540 × 756 SVG",
      exportedAt: "2026-08-22T12:00:00.000Z",
    });
    expect(() => buildZip(files)).not.toThrow();
  });

  it("produces a zip that reads back with the SVG and JSON intact", async () => {
    const settings = { artworkMode: "svg", mobileFrostHeight: 57, artMobileScale: 68 };
    const zip = buildZip(
      completeLookPackage(svg, {
        schemaVersion: LOOK_SCHEMA_VERSION,
        exportedAt: "2026-08-22T12:00:00.000Z",
        settings,
      }),
    );

    const read = await readZip(
      zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer,
    );
    const parsed = parseLookFiles(read);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    // Byte-for-byte, not just "roughly the same length".
    expect(parsed.artworkSvg).toBe(svg);
    expect(parsed.settings).toEqual(settings);
  });
});

/**
 * The real shape of a finished look: a large invitation SVG plus both
 * monogram pieces, all in one archive. This is the case the ZIP writer has to
 * survive now that the cover carries its own artwork.
 */
describe("a complete look carrying three realistic SVGs", () => {
  const invitation = realisticSvg(1_500 * 1024);
  const outer = realisticSvg(700 * 1024);
  const inner = realisticSvg(600 * 1024);

  it("packages all three without a RangeError", () => {
    const files = completeLookPackage(
      { invitation, monogramOuter: outer, monogramInner: inner },
      {
        schemaVersion: LOOK_SCHEMA_VERSION,
        exportedAt: "2026-08-23T10:00:00.000Z",
        settings: { coverMode: "monogram", venueHoldSeconds: 2 },
      },
    );
    expect(() => buildZip(files)).not.toThrow();
  });

  it("extracts every piece byte-perfectly, with settings intact", async () => {
    const settings = { coverMode: "monogram", venueHoldSeconds: 2, mobileFrostHeight: 57 };
    const zip = buildZip(
      completeLookPackage(
        { invitation, monogramOuter: outer, monogramInner: inner },
        {
          schemaVersion: LOOK_SCHEMA_VERSION,
          exportedAt: "2026-08-23T10:00:00.000Z",
          settings,
        },
      ),
    );

    const read = await readZip(
      zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer,
    );
    const parsed = parseLookFiles(read);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.artworkSvg).toBe(invitation);
    expect(parsed.monogramOuter).toBe(outer);
    expect(parsed.monogramInner).toBe(inner);
    expect(parsed.settings).toEqual(settings);
  });

  it("packages the same three into a production handover", () => {
    const files = productionPackage({
      artworkSvg: invitation,
      monogramOuter: outer,
      monogramInner: inner,
      settingsJson: JSON.stringify({ coverMode: "monogram" }),
      artworkDimensions: "540 × 756 SVG",
      exportedAt: "2026-08-23T10:00:00.000Z",
    });
    expect(() => buildZip(files)).not.toThrow();
  });
});

describe("buildZip with multiple large entries", () => {
  it("handles a large SVG alongside settings and a readme in one archive", async () => {
    const svg = realisticSvg(1_000 * 1024);
    const files = productionPackage({
      artworkSvg: svg,
      settingsJson: JSON.stringify({ a: 1, b: "x".repeat(2000) }),
      artworkDimensions: "540 × 756 SVG",
      exportedAt: "2026-08-22T12:00:00.000Z",
    });

    const zip = buildZip(files);
    const read = await readZip(
      zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer,
    );
    expect(read).toHaveLength(3);

    const decoder = new TextDecoder();
    const svgEntry = read.find((f) => f.name.endsWith(".svg"));
    expect(svgEntry && decoder.decode(svgEntry.bytes)).toBe(svg);
  });
});
