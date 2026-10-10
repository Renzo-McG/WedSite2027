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
  it("stays on the GitHub Pages address until the custom-domain cutover", () => {
    expect(siteUrl).toBe("https://renzo-mcg.github.io/WedSite2027/");
  });

  it("gives the same canonical links from a root build and a GitHub Pages build", () => {
    expect(canonicalPageUrl("/", siteUrl, "/").href).toBe(siteUrl);
    expect(canonicalPageUrl("/wedding/", siteUrl, "/").href).toBe(`${siteUrl}wedding/`);
    expect(canonicalPageUrl("/WedSite2027/", siteUrl, "/WedSite2027/").href).toBe(siteUrl);
    expect(canonicalPageUrl("/WedSite2027/wedding/", siteUrl, "/WedSite2027/").href).toBe(
      `${siteUrl}wedding/`,
    );
  });

  it("keeps the public URL independent from the hosting base for domain migration", () => {
    const domain = "https://emilyandlawrence.com/";
    expect(canonicalPageUrl("/wedding/", domain, "/").href).toBe(`${domain}wedding/`);
    expect(canonicalPageUrl("/WedSite2027/wedding/", domain, "/WedSite2027/").href).toBe(
      `${domain}wedding/`,
    );
    expect(canonicalPageUrl("/WedSite2027/", domain, "/WedSite2027").href).toBe(domain);
  });

  it("points every calendar website reference at the site root from siteUrl", () => {
    const ics = buildIcs().replace(/\r\n /g, "");
    expect(ics).toContain(`URL:${siteUrl}\r\n`);
    expect(new URL(googleCalendarUrl()).searchParams.get("details")).toContain(siteUrl);
    expect(ics).not.toContain("save-the-date");
  });

  it("serves the calendar file from the base without doubling it", () => {
    expect(calendarProviders("/")[1]?.href).toBe("/emily-lawrence-wedding.ics");
    expect(calendarProviders("/WedSite2027/")[1]?.href).toBe(
      "/WedSite2027/emily-lawrence-wedding.ics",
    );
  });
});
