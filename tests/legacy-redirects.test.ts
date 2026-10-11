import { describe, expect, it } from "vitest";
import {
  legacyRedirectTarget,
  legacyRoutes,
  notFoundDocument,
  redirectDocument,
} from "../src/lib/legacy-redirects";

/** Runs a redirect page's inline script against a fake location. */
function redirectFrom(html: string, pathname: string, search = "", hash = "") {
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error("no redirect script");
  let replaced = "";
  const location = { pathname, search, hash, replace: (url: string) => (replaced = url) };
  new Function("location", script)(location);
  return replaced;
}

describe("legacy GitHub Pages redirects", () => {
  it("sends every old guest address to the same experience on the custom domain", () => {
    expect(Object.fromEntries(legacyRoutes.map((r) => [r, legacyRedirectTarget(r)]))).toEqual({
      // The legacy root was the Save the Date, so it stays the Save the Date.
      "": "https://emilyandlawrence.com/save-the-date/",
      "save-the-date/": "https://emilyandlawrence.com/save-the-date/",
      "welcome/": "https://emilyandlawrence.com/",
      "travel/": "https://emilyandlawrence.com/travel/",
      "stay/": "https://emilyandlawrence.com/stay/",
      "trip/": "https://emilyandlawrence.com/trip/",
      "wedding/": "https://emilyandlawrence.com/wedding/",
    });
  });

  it.each(legacyRoutes)("redirects /WedSite2027/%s with and without JavaScript", (route) => {
    const target = legacyRedirectTarget(route);
    const html = redirectDocument(target);
    expect(html).toContain(`<meta http-equiv="refresh" content="0; url=${target}">`);
    expect(html).toContain(`<link rel="canonical" href="${target}">`);
    expect(html).toContain(`<a href="${target}">`);
    expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(html).not.toMatch(
      /renzo-mcg\.github\.io|WedSite2027|<link rel="stylesheet"|<script src/,
    );
    expect(redirectFrom(html, `/WedSite2027/${route}`, "?from=guest", "#calendar")).toBe(
      `${target}?from=guest#calendar`,
    );
    expect(redirectFrom(html, `/WedSite2027/${route}`)).toBe(target);
  });

  it("keeps the Save the Date share preview on the old Save the Date addresses only", () => {
    const saveTheDate = redirectDocument(legacyRedirectTarget(""));
    expect(saveTheDate).toContain('<meta property="og:description" content="Tap to open">');
    expect(saveTheDate).toContain(
      '<meta property="og:image" content="https://emilyandlawrence.com/assets/social/save-the-date-share-v2.jpg">',
    );
    for (const route of ["welcome/", "travel/"]) {
      expect(redirectDocument(legacyRedirectTarget(route))).not.toMatch(/og:image|Tap to open/);
    }
  });

  it("sends any other old address to the same path on the custom domain", () => {
    const html = notFoundDocument("/WedSite2027/");
    expect(html).toContain(
      '<meta http-equiv="refresh" content="0; url=https://emilyandlawrence.com/">',
    );
    expect(redirectFrom(html, "/WedSite2027/emily-lawrence-wedding.ics")).toBe(
      "https://emilyandlawrence.com/emily-lawrence-wedding.ics",
    );
    expect(redirectFrom(html, "/WedSite2027/travel/nope/", "?a=1", "#x")).toBe(
      "https://emilyandlawrence.com/travel/nope/?a=1#x",
    );
    expect(redirectFrom(html, "/WedSite2027")).toBe("https://emilyandlawrence.com/");
    expect(redirectFrom(html, "/WedSite2027x/")).toBe("https://emilyandlawrence.com/WedSite2027x/");
  });
});
