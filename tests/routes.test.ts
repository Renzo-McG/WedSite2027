import { describe, expect, it } from "vitest";
import { routeHref, routes } from "../src/config/routes";
import { destinations } from "../src/data/site";
import rootPage from "../src/pages/index.astro?raw";
import saveTheDatePage from "../src/pages/save-the-date/index.astro?raw";
import invitationSource from "../src/components/save-the-date/InvitationContent.astro?raw";
import shellSource from "../src/layouts/AppShell.astro?raw";
import notFoundSource from "../src/pages/404.astro?raw";

describe("routes between the Save the Date and the Wedding website", () => {
  it("joins any base and route with exactly one slash", () => {
    for (const base of ["/", "/WedSite2027/", "/WedSite2027"]) {
      for (const route of [routes.home, routes.saveTheDate, "/travel/"]) {
        expect(routeHref(base, route)).not.toMatch(/\/\//);
        expect(routeHref(base, route).startsWith(base.replace(/\/?$/, "/"))).toBe(true);
      }
    }
    expect(routeHref("/", routes.home)).toBe("/welcome/");
    expect(routeHref("/WedSite2027/", routes.saveTheDate)).toBe("/WedSite2027/");
  });

  it("keeps the Wedding website home in one place", () => {
    expect(destinations.find((d) => d.id === "home")?.path).toBe(routes.home);
    expect(invitationSource).toContain("routes.home");
    expect(shellSource).toContain("routes.home");
    expect(shellSource).toContain("routes.saveTheDate");
    expect(`${invitationSource}${shellSource}`).not.toContain("welcome/");
  });

  it("serves the same Save the Date at the root and at its permanent save-the-date/ address", () => {
    for (const page of [rootPage, saveTheDatePage]) {
      expect(page).toContain("<SaveTheDatePage />");
    }
  });

  it("gives a 404 that links home without JavaScript or a redirect", () => {
    expect(notFoundSource).toContain("routes.home");
    expect(notFoundSource).toContain("routes.saveTheDate");
    expect(notFoundSource).toContain("canonical={false}");
    expect(notFoundSource).not.toMatch(/<script|http-equiv="refresh"/);
  });
});
