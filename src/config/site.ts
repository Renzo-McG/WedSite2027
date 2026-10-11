import { canonicalRouteFor, isLegacyGitHubPagesBuild } from "./routes";

/** The authoritative guest-facing URL, independent of the hosting base path. */
export const siteUrl = "https://emilyandlawrence.com/";

/**
 * Hosting prefix for a build, from the `BASE_PATH` build variable. The default
 * is the domain root (Cloudflare Pages); the GitHub Pages workflow passes
 * `/WedSite2027`. Always returns a leading and trailing slash.
 */
export function normalizeBasePath(value: string | undefined): string {
  const trimmed = (value ?? "").trim().replace(/^\/+|\/+$/g, "");
  if (!/^[\w.~-]*(\/[\w.~-]+)*$/.test(trimmed)) {
    throw new Error(`BASE_PATH must be a URL path such as "/WedSite2027", got "${value}"`);
  }
  return trimmed ? `/${trimmed}/` : "/";
}

/** Canonicals follow the experience at a route, not the host's physical path. */
export function canonicalPageUrl(
  pathname: string,
  publicUrl = siteUrl,
  basePath: string = import.meta.env.BASE_URL,
  legacyGitHubPages = isLegacyGitHubPagesBuild,
): URL {
  const base = `${basePath.replace(/\/$/, "")}/`;
  const route = pathname.startsWith(base)
    ? pathname.slice(base.length)
    : pathname.replace(/^\//, "");
  return new URL(canonicalRouteFor(route, legacyGitHubPages), publicUrl);
}
