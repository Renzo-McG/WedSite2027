import { describe, expect, it } from "vitest";
import { DEFAULT_DISPLAY_FONT, displayFontFromSearch } from "../src/lib/display-font";

describe("display-font audition query", () => {
  it.each(["sirivennela", "montecarlo", "corinthia", "parisienne"])("accepts %s", (candidate) => {
    expect(displayFontFromSearch(`?type=${candidate}`)).toBe(candidate);
  });

  it("falls back to the provisional default for absent or invalid values", () => {
    expect(displayFontFromSearch("")).toBe(DEFAULT_DISPLAY_FONT);
    expect(displayFontFromSearch("?type=instrument-serif")).toBe(DEFAULT_DISPLAY_FONT);
  });
});
