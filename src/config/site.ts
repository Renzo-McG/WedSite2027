/** Guest-facing URL. Update this when the custom domain becomes canonical. */
export const siteUrl = "https://renzo-mcg.github.io/WedSite2027/";

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

/** Canonical links follow the public URL, not the hosting base path. */
export function canonicalPageUrl(
  pathname: string,
  publicUrl = siteUrl,
  basePath: string = import.meta.env.BASE_URL,
): URL {
  const base = `${basePath.replace(/\/$/, "")}/`;
  const route = pathname.startsWith(base)
    ? pathname.slice(base.length)
    : pathname.replace(/^\//, "");
  return new URL(route, publicUrl);
}
