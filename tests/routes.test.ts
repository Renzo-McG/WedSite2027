import { describe, expect, it } from "vitest";
import { isLegacyGitHubPagesBuild, routeHref, routes, routesFor } from "../src/config/routes";
import { destinations } from "../src/data/site";
import rootPage from "../src/pages/index.astro?raw";
import saveTheDatePage from "../src/pages/save-the-date/index.astro?raw";
import welcomePage from "../src/pages/welcome/index.astro?raw";
import weddingWebsiteHome from "../src/components/app/WeddingWebsiteHome.astro?raw";
import invitationSource from "../src/components/save-the-date/InvitationContent.astro?raw";
import shellSource from "../src/layouts/AppShell.astro?raw";
import notFoundSource from "../src/pages/404.astro?raw";
import redirects from "../public/_redirects?raw";
import functionsRoutes from "../public/_routes.json?raw";
import pagesWorkflow from "../.github/workflows/deploy-pages.yml?raw";

const guestSources = import.meta.glob<string>("../src/**/*.{astro,ts}", {
  query: "?raw",
  import: "default",
  eager: true,
});

describe("routes between the Save the Date and the Wedding website", () => {
  const cloudflareRoutes = routesFor(false);
  const legacyGitHubPagesRoutes = routesFor(true);

  it("joins any base and route with exactly one slash", () => {
    for (const base of ["/", "/WedSite2027/", "/WedSite2027"]) {
      for (const route of [
        ...Object.values(cloudflareRoutes),
        ...Object.values(legacyGitHubPagesRoutes),
        "/travel/",
      ]) {
        expect(routeHref(base, route)).not.toMatch(/\/\//);
        expect(routeHref(base, route).startsWith(base.replace(/\/?$/, "/"))).toBe(true);
      }
    }
  });

  it("uses the final routes for a default Cloudflare build", () => {
    expect(isLegacyGitHubPagesBuild).toBe(false);
    expect(routes).toEqual(cloudflareRoutes);
    expect(cloudflareRoutes).toEqual({ home: "", saveTheDate: "save-the-date/" });
    expect(routeHref("/", cloudflareRoutes.home)).toBe("/");
    expect(routeHref("/", cloudflareRoutes.saveTheDate)).toBe("/save-the-date/");
  });

  it("keeps the old home route only in the explicit GitHub Pages mode", () => {
    expect(legacyGitHubPagesRoutes).toEqual({
      home: "welcome/",
      saveTheDate: "save-the-date/",
    });
    expect(routeHref("/WedSite2027", legacyGitHubPagesRoutes.home)).toBe("/WedSite2027/welcome/");
    expect(routeHref("/WedSite2027/", legacyGitHubPagesRoutes.saveTheDate)).toBe(
      "/WedSite2027/save-the-date/",
    );
    expect(pagesWorkflow).toContain("BASE_PATH: /WedSite2027");
    expect(pagesWorkflow).toContain('LEGACY_GITHUB_PAGES: "true"');
  });

  it("keeps all guest-facing home links on the central route configuration", () => {
    expect(destinations.find((d) => d.id === "home")?.path).toBe(routes.home);
    expect(invitationSource).toContain("routes.home");
    expect(shellSource).toContain("routes.home");
    expect(shellSource).toContain("routes.saveTheDate");
    expect(`${invitationSource}${shellSource}`).not.toContain("welcome/");
    expect(routeHref("/", cloudflareRoutes.home)).toBe("/");
    expect(routeHref("/WedSite2027/", legacyGitHubPagesRoutes.home)).toBe("/WedSite2027/welcome/");
    for (const [file, source] of Object.entries(guestSources)) {
      if (file.endsWith("/src/config/routes.ts")) continue;
      expect(source, file).not.toMatch(/["'`]\/?welcome\//);
    }
  });

  it("selects the root experience by build mode without duplicating either page", () => {
    expect(rootPage).toContain("isLegacyGitHubPagesBuild");
    expect(rootPage).toContain('import("../components/save-the-date/SaveTheDatePage.astro")');
    expect(rootPage).toContain('import("../components/app/WeddingWebsiteHome.astro")');
    expect(rootPage).toContain("<RootPage />");
    expect(saveTheDatePage).toContain("<SaveTheDatePage />");
    expect(welcomePage).toContain("<WeddingWebsiteHome />");
    expect(weddingWebsiteHome).toContain('screen="home"');
  });

  it("redirects both welcome URL forms only at the Cloudflare edge", () => {
    expect(redirects.trim().split("\n")).toEqual(["/welcome / 301", "/welcome/ / 301"]);
    expect(functionsRoutes).not.toContain("welcome");
  });

  it("gives a 404 that links home without JavaScript or a redirect", () => {
    expect(notFoundSource).toContain("routes.home");
    expect(notFoundSource).toContain("routes.saveTheDate");
    expect(notFoundSource).toContain("canonical={false}");
    expect(notFoundSource).not.toMatch(/<script|http-equiv="refresh"/);
  });
});
