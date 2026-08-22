import { describe, expect, it } from "vitest";
import { defaultSettings, coerceSettings } from "../src/lib/type-preview-settings";
import {
  SHARE_PARAM,
  decodeLook,
  encodeLook,
  shareLinkCarriesArtwork,
  shareUrl,
  statusLabel,
} from "../src/lib/studio-share";
import {
  LOOK_SCHEMA_VERSION,
  buildZip,
  completeLookPackage,
  parseLookFiles,
  readZip,
  type ReadFile,
} from "../src/lib/production-package";

const encoder = new TextEncoder();

function asReadFiles(files: { name: string; content: string }[]): ReadFile[] {
  return files.map((file) => ({ name: file.name, bytes: encoder.encode(file.content) }));
}

/* --------------------------------------------------------- share links */

describe("share links", () => {
  /* The key acceptance test: a non-default look must survive a round trip
     through a URL exactly. */
  it("reproduces a tuned look exactly", () => {
    const base = defaultSettings();
    const tuned = {
      ...base,
      mobileFrostHeight: 54,
      mobileFrostY: 42,
      frostEdgeSoftness: 27,
      artMobileScale: 68,
      artMobileY: -17,
      zoneY: 31,
      invitationStrength: 0.4,
      artworkMode: "svg",
    };

    const decoded = decodeLook(encodeLook(tuned, base), base);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;

    for (const key of Object.keys(tuned)) {
      expect(decoded.settings[key]).toBe(tuned[key as keyof typeof tuned]);
    }
  });

  it("produces a URL-safe token with no padding", () => {
    const encoded = encodeLook({ ...defaultSettings(), artMobileScale: 61 }, defaultSettings());
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  /* Only differences travel, so a link stays short enough to paste. */
  it("encodes only what differs from the baseline", () => {
    const base = defaultSettings();
    const oneChange = encodeLook({ ...base, artMobileScale: 61 }, base);
    const manyChanges = encodeLook(
      { ...base, artMobileScale: 61, mobileFrostHeight: 50, zoneY: 20, textVeil: 0.5 },
      base,
    );
    expect(oneChange.length).toBeLessThan(manyChanges.length);
    expect(oneChange.length).toBeLessThan(120);
  });

  it("round-trips an unchanged look", () => {
    const base = defaultSettings();
    const decoded = decodeLook(encodeLook(base, base), base);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.settings).toEqual(base);
  });

  /* A link carries settings only. The word "svg" does appear, as the artwork
     mode's own value — what must never appear is any actual markup. */
  it("never carries the artwork itself", () => {
    const encoded = encodeLook({ ...defaultSettings(), artworkMode: "svg" }, defaultSettings());
    const decodedText = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
    expect(decodedText).toBe('{"v":2,"s":{"artworkMode":"svg"}}');
    expect(decodedText).not.toContain("<");
    expect(decodedText).not.toContain("path");
    expect(decodedText).not.toContain("viewBox");
    expect(encoded.length).toBeLessThan(120);
  });

  it("falls back rather than throwing on a damaged link", () => {
    const base = defaultSettings();
    for (const bad of ["", "!!!!", "bm90LWpzb24", btoa("{}"), btoa('{"v":1}')]) {
      const outcome = decodeLook(bad, base);
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.reason).toBe("malformed");
    }
  });

  it("refuses a link from a newer studio rather than half-applying it", () => {
    const encoded = btoa(JSON.stringify({ v: 99, s: { artMobileScale: 50 } }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const outcome = decodeLook(encoded, defaultSettings());
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("version");
  });

  it("clamps hostile values through the normal coercion", () => {
    const encoded = btoa(JSON.stringify({ v: 2, s: { artMobileScale: 99999, sizeNames: -5 } }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const outcome = decodeLook(encoded, defaultSettings());
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.settings.artMobileScale).toBe(160);
      expect(outcome.settings.sizeNames).toBe(4);
    }
  });

  it("builds a share URL on the studio route", () => {
    const url = shareUrl("https://renzo-mcg.github.io", "/WedSite2027/studio/", "abc");
    expect(url).toBe(`https://renzo-mcg.github.io/WedSite2027/studio/?${SHARE_PARAM}=abc`);
  });
});

/* -------------------------------------------------------------- status */

describe("studio status", () => {
  it("says what is being edited", () => {
    expect(statusLabel({ artwork: "starting", fromSharedLink: false })).toBe("Starting design");
    expect(statusLabel({ artwork: "local", fromSharedLink: false })).toBe("Your Canva artwork");
    expect(statusLabel({ artwork: "imported", fromSharedLink: false })).toBe("Imported look");
    expect(statusLabel({ artwork: "starting", fromSharedLink: true })).toBe(
      "Starting design · shared settings",
    );
  });

  /* The recipient sees the same picture only for the bundled design. */
  it("knows when a share link cannot carry the artwork", () => {
    expect(shareLinkCarriesArtwork("starting")).toBe(true);
    expect(shareLinkCarriesArtwork("none")).toBe(true);
    expect(shareLinkCarriesArtwork("local")).toBe(false);
    expect(shareLinkCarriesArtwork("imported")).toBe(false);
  });
});

/* ------------------------------------------------------- complete look */

const SAFE_SVG =
  '<svg viewBox="0 0 540 756" xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>';

describe("complete look package", () => {
  it("holds the artwork, versioned settings and a readme", () => {
    const files = completeLookPackage(SAFE_SVG, {
      schemaVersion: LOOK_SCHEMA_VERSION,
      exportedAt: "2026-08-22T12:00:00.000Z",
      settings: defaultSettings(),
    });
    expect(files.map((f) => f.name)).toEqual([
      "invitation-artwork.svg",
      "settings.json",
      "README.txt",
    ]);
    expect(files[2]?.content).toContain("Import complete look");
  });

  /* The whole point of the format: what goes out must come back. */
  it("survives a real zip round trip", async () => {
    const tuned = { ...defaultSettings(), mobileFrostHeight: 47, artMobileScale: 66, zoneY: 18 };
    const zip = buildZip(
      completeLookPackage(SAFE_SVG, {
        schemaVersion: LOOK_SCHEMA_VERSION,
        exportedAt: "2026-08-22T12:00:00.000Z",
        settings: tuned,
      }),
    );

    const read = await readZip(
      zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer,
    );
    const parsed = parseLookFiles(read);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.artworkSvg).toBe(SAFE_SVG);
    const restored = coerceSettings(parsed.settings);
    expect(restored.mobileFrostHeight).toBe(47);
    expect(restored.artMobileScale).toBe(66);
    expect(restored.zoneY).toBe(18);
  });

  it("reads back file names and contents intact", async () => {
    const zip = buildZip([
      { name: "a/one.txt", content: "first" },
      { name: "b/two.txt", content: "second" },
    ]);
    const read = await readZip(
      zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer,
    );
    expect(read.map((f) => f.name)).toEqual(["a/one.txt", "b/two.txt"]);
    expect(new TextDecoder().decode(read[1]?.bytes)).toBe("second");
  });

  it("rejects something that is not a zip at all", async () => {
    await expect(readZip(encoder.encode("hello there").buffer as ArrayBuffer)).rejects.toThrow();
  });
});

/* ------------------------------------------------------ import guarding */

describe("importing a look", () => {
  it("accepts a well-formed look", () => {
    const result = parseLookFiles(
      asReadFiles(
        completeLookPackage(SAFE_SVG, {
          schemaVersion: LOOK_SCHEMA_VERSION,
          exportedAt: "x",
          settings: defaultSettings(),
        }),
      ),
    );
    expect(result.ok).toBe(true);
  });

  it("explains a missing settings file in plain language", () => {
    const result = parseLookFiles(
      asReadFiles([{ name: "invitation-artwork.svg", content: SAFE_SVG }]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("no settings");
      expect(result.reason).not.toMatch(/JSON|schema|undefined|null/);
    }
  });

  it("explains damaged settings rather than throwing", () => {
    const result = parseLookFiles(asReadFiles([{ name: "settings.json", content: "{not json" }]));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("damaged");
  });

  it("refuses a look with no version", () => {
    const result = parseLookFiles(
      asReadFiles([{ name: "settings.json", content: JSON.stringify({ settings: {} }) }]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("version");
  });

  it("refuses a look from a newer studio", () => {
    const result = parseLookFiles(
      asReadFiles([
        { name: "settings.json", content: JSON.stringify({ schemaVersion: 99, settings: {} }) },
      ]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("newer version");
  });

  it("allows a settings-only look, leaving the artwork alone", () => {
    const result = parseLookFiles(
      asReadFiles([
        {
          name: "settings.json",
          content: JSON.stringify({ schemaVersion: 1, settings: { artMobileScale: 55 } }),
        },
      ]),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.artworkSvg).toBeNull();
  });
});
