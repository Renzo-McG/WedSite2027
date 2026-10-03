/** Guest-facing URL. Update this when the custom domain becomes canonical. */
export const siteUrl = "https://renzo-mcg.github.io/WedSite2027/";

/** Route and asset prefix for the current GitHub Pages deployment. */
export const deploymentBasePath = "/WedSite2027";

/** Canonical links follow the public URL, not the hosting base path. */
export function canonicalPageUrl(
  pathname: string,
  publicUrl = siteUrl,
  basePath = deploymentBasePath,
): URL {
  const base = `${basePath.replace(/\/$/, "")}/`;
  const route = pathname.startsWith(base)
    ? pathname.slice(base.length)
    : pathname.replace(/^\//, "");
  return new URL(route, publicUrl);
}
