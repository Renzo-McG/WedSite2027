import { afterEach, describe, expect, it, vi } from "vitest";
import { canonicalPageUrl, normalizeBasePath, siteUrl } from "../src/config/site";
import { buildIcs, calendarProviders, googleCalendarUrl } from "../src/lib/calendar";

const sources = import.meta.glob<string>(["../src/**/*.{ts,astro}", "../astro.config.mjs"], {
  query: "?raw",
  import: "default",
  eager: true,
});

async function astroConfigWith(basePath: string | undefined) {
  vi.resetModules();
  vi.stubEnv("BASE_PATH", basePath);
  return (await import("../astro.config.mjs")).default;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("deployment base path", () => {
  it("builds at the domain root by default (Cloudflare Pages)", async () => {
    expect((await astroConfigWith(undefined)).base).toBe("/");
    expect((await astroConfigWith("")).base).toBe("/");
  });

  it("builds under /WedSite2027/ when GitHub Pages passes BASE_PATH", async () => {
    expect((await astroConfigWith("/WedSite2027")).base).toBe("/WedSite2027/");
  });

  it("normalises slashes so the base is never doubled or dropped", () => {
    for (const value of ["/WedSite2027", "WedSite2027", "/WedSite2027/", "//WedSite2027//"]) {
      expect(normalizeBasePath(value)).toBe("/WedSite2027/");
    }
    expect(normalizeBasePath("/")).toBe("/");
    expect(normalizeBasePath(normalizeBasePath("/WedSite2027"))).toBe("/WedSite2027/");
  });

  it("rejects a URL or malformed path rather than building broken links", () => {
    expect(() => normalizeBasePath("https://example.com/")).toThrow(/BASE_PATH/);
    expect(() => normalizeBasePath("/a//b")).toThrow(/BASE_PATH/);
  });

  it("keeps the hosting path out of source, so builds take it only from BASE_PATH", () => {
    for (const [file, source] of Object.entries(sources)) {
      if (file.endsWith("/src/config/site.ts")) continue;
      expect(source, file).not.toContain("WedSite2027");
      expect(source, file).not.toMatch(/(BASE_URL|base)\}\/(?!\/)/);
    }
  });
});

describe("public wedding URL", () => {
  it("uses the custom domain as the single public URL", () => {
    expect(siteUrl).toBe("https://emilyandlawrence.com/");
  });

  it("maps every default route to the matching final-domain canonical and og:url", () => {
    const expected = {
      "/": siteUrl,
      "/save-the-date/": `${siteUrl}save-the-date/`,
      "/welcome/": siteUrl,
      "/travel/": `${siteUrl}travel/`,
      "/stay/": `${siteUrl}stay/`,
      "/trip/": `${siteUrl}trip/`,
      "/wedding/": `${siteUrl}wedding/`,
    };
    for (const [path, canonical] of Object.entries(expected)) {
      expect(canonicalPageUrl(path, siteUrl, "/", false).href, path).toBe(canonical);
    }
  });

  it("maps the legacy root to Save the Date and excludes its hosting base from metadata", () => {
    const expected = {
      "/WedSite2027/": `${siteUrl}save-the-date/`,
      "/WedSite2027/save-the-date/": `${siteUrl}save-the-date/`,
      "/WedSite2027/welcome/": siteUrl,
      "/WedSite2027/travel/": `${siteUrl}travel/`,
      "/WedSite2027/stay/": `${siteUrl}stay/`,
      "/WedSite2027/trip/": `${siteUrl}trip/`,
      "/WedSite2027/wedding/": `${siteUrl}wedding/`,
    };
    for (const [path, canonical] of Object.entries(expected)) {
      const result = canonicalPageUrl(path, siteUrl, "/WedSite2027/", true).href;
      expect(result, path).toBe(canonical);
      expect(result, path).not.toContain("WedSite2027");
    }
    expect(canonicalPageUrl("/WedSite2027/", siteUrl, "/WedSite2027", true).href).toBe(
      `${siteUrl}save-the-date/`,
    );
  });

  it("points every calendar website reference at the site root from siteUrl", () => {
    const ics = buildIcs().replace(/\r\n /g, "");
    expect(ics).toContain(`URL:${siteUrl}\r\n`);
    expect(new URL(googleCalendarUrl()).searchParams.get("details")).toContain(siteUrl);
    expect(ics).not.toContain("https://renzo-mcg.github.io/WedSite2027/");
    expect(new URL(googleCalendarUrl()).searchParams.get("details")).not.toContain(
      "https://renzo-mcg.github.io/WedSite2027/",
    );
    expect(ics).not.toContain("save-the-date");
  });

  it("serves the calendar file from the base without doubling it", () => {
    expect(calendarProviders("/")[1]?.href).toBe("/emily-lawrence-wedding.ics");
    expect(calendarProviders("/WedSite2027/")[1]?.href).toBe(
      "/WedSite2027/emily-lawrence-wedding.ics",
    );
  });
});
