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

/** Joins a base URL and a route without doubling or dropping the slash. */
export function routeHref(base: string, route: string): string {
  return `${base.replace(/\/?$/, "/")}${route.replace(/^\//, "")}`;
}
