import { describe, expect, it } from "vitest";

/**
 * Guest-facing copy: page titles, visible text, labels and calendar copy. The
 * Studio and Design Lab are internal tools and are deliberately not included.
 */
const sources = import.meta.glob<string>(
  [
    "../src/pages/{index,404}.astro",
    "../src/pages/{save-the-date,welcome,travel,stay,trip,wedding}/**/*.astro",
    "../src/components/{app,save-the-date,travel,stay,trip}/**/*.astro",
    "../src/layouts/*.astro",
    "../src/data/*.ts",
    "../src/config/*.ts",
    "../src/lib/calendar.ts",
  ],
  { query: "?raw", import: "default", eager: true },
);

/** Code comments are not copy. */
const withoutComments = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("guest-facing copy", () => {
  it("is read from every guest page and its data", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(30);
  });

  it("uses no em dashes (page titles use a pipe instead)", () => {
    for (const [file, source] of Object.entries(sources)) {
      expect(withoutComments(source), file).not.toContain("—");
    }
  });

  it("writes Save the Date with a lower-case 'the'", () => {
    for (const [file, source] of Object.entries(sources)) {
      expect(withoutComments(source), file).not.toContain("Save The Date");
    }
  });
});
