import { describe, expect, it } from "vitest";
import layout from "../src/layouts/BaseLayout.astro?raw";
import appShell from "../src/layouts/AppShell.astro?raw";
import saveTheDate from "../src/components/save-the-date/SaveTheDatePage.astro?raw";
import notFound from "../src/pages/404.astro?raw";
import {
  legacyRedirectTarget,
  legacyRoutes,
  notFoundDocument,
  redirectDocument,
} from "../src/lib/legacy-redirects";

/**
 * A private wedding site: kept out of search results, but crawlers may follow
 * its links. Pages must stay fetchable for the noindex to be seen, so there is
 * no robots.txt Disallow.
 */
const websiteScreens = import.meta.glob<string>(
  "../src/pages/{travel,stay,trip,wedding}/index.astro",
  { query: "?raw", import: "default", eager: true },
);
const guestSources = import.meta.glob<string>(
  [
    "../src/pages/{index,404}.astro",
    "../src/pages/{save-the-date,welcome,travel,stay,trip,wedding}/**/*.astro",
    "../src/components/{app,save-the-date,travel,stay,trip}/**/*.astro",
    "../src/layouts/*.astro",
    "../src/lib/legacy-redirects.ts",
  ],
  { query: "?raw", import: "default", eager: true },
);

describe("robots policy", () => {
  it("emits noindex, follow from the shared layout", () => {
    expect(layout).toContain('{noindex && <meta name="robots" content="noindex, follow" />}');
  });

  it("applies it to the Save the Date, the Website shell and the 404", () => {
    for (const source of [saveTheDate, appShell, notFound]) {
      expect(source).toMatch(/<BaseLayout[\s\S]*?\bnoindex\b[\s\S]*?>/);
    }
    expect(Object.keys(websiteScreens)).toHaveLength(4);
    for (const [file, source] of Object.entries(websiteScreens)) {
      expect(source, file).toContain("<AppShell");
    }
  });

  it("keeps the legacy redirect pages out of search results too", () => {
    for (const html of [
      ...legacyRoutes.map((route) => redirectDocument(legacyRedirectTarget(route))),
      notFoundDocument("/WedSite2027/"),
    ]) {
      expect(html).toContain('<meta name="robots" content="noindex, follow">');
    }
  });

  it("has no guest page that asks to be indexed or blocks link following", () => {
    expect(Object.keys(guestSources).length).toBeGreaterThan(30);
    for (const [file, source] of Object.entries(guestSources)) {
      expect(source, file).not.toMatch(/content=["']\s*(index|all)\b|nofollow|X-Robots-Tag/i);
    }
  });
});
