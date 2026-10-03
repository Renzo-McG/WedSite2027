import { describe, expect, it } from "vitest";
import { canonicalPageUrl, deploymentBasePath, siteUrl } from "../src/config/site";

describe("public wedding URL", () => {
  it("keeps canonical page links under the current GitHub Pages URL", () => {
    expect(deploymentBasePath).toBe("/WedSite2027");
    expect(canonicalPageUrl("/WedSite2027/").href).toBe(siteUrl);
    expect(canonicalPageUrl("/WedSite2027/wedding/").href).toBe(`${siteUrl}wedding/`);
  });

  it("keeps the public URL independent from the hosting base for domain migration", () => {
    expect(
      canonicalPageUrl("/WedSite2027/wedding/", "https://example.com/", "/WedSite2027").href,
    ).toBe("https://example.com/wedding/");
  });
});
