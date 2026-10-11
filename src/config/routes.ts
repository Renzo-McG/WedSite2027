/**
 * GitHub Pages remains the legacy host until its old links can be retired.
 * All other builds use the final route architecture intended for Cloudflare.
 */
export const isLegacyGitHubPagesBuild = import.meta.env.LEGACY_GITHUB_PAGES === "true";

export function routesFor(legacyGitHubPages: boolean) {
  return {
    home: legacyGitHubPages ? "welcome/" : "",
    saveTheDate: "save-the-date/",
  } as const;
}

export const routes = routesFor(isLegacyGitHubPagesBuild);

/** Match each physical route to the experience's final public address. */
export function canonicalRouteFor(route: string, legacyGitHubPages: boolean): string {
  if (route === "welcome" || route === "welcome/") return "";
  if (route === "" && legacyGitHubPages) return "save-the-date/";
  return route;
}

/** Joins a base URL and a route without doubling or dropping the slash. */
export function routeHref(base: string, route: string): string {
  return `${base.replace(/\/?$/, "/")}${route.replace(/^\//, "")}`;
}
