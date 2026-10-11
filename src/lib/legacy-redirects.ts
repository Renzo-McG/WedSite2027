/**
 * GitHub Pages retired as a copy of the site: every guest address it used to
 * serve becomes a tiny page that sends the visitor to the same experience on
 * the custom domain. The legacy root was the Save the Date, so it goes to the
 * Save the Date, not to the Website. Written over the legacy build's output by
 * integrations/legacy-github-pages.mjs.
 */
import { canonicalRouteFor, routesFor } from "../config/routes";
import { siteUrl } from "../config/site";
import { saveTheDateSocialImage } from "../config/social";

const legacy = routesFor(true);

/** The guest pages GitHub Pages served, as routes under its base path. */
export const legacyRoutes = [
  "",
  legacy.saveTheDate,
  legacy.home,
  "travel/",
  "stay/",
  "trip/",
  "wedding/",
] as const;

/** Where a legacy route lives now: its experience on the custom domain. */
export const legacyRedirectTarget = (route: string): string =>
  new URL(canonicalRouteFor(route, true), siteUrl).href;

const attr = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * The script keeps any query string and fragment; the refresh and the link
 * still get there without JavaScript. Save the Date addresses keep their
 * share metadata, so an old link still unfurls as the invitation.
 */
export function redirectDocument(target: string): string {
  const saveTheDate = target === legacyRedirectTarget(legacy.saveTheDate);
  const title = saveTheDate ? "Emily & Lawrence | Save the Date" : "Emily & Lawrence";
  const share = saveTheDate
    ? [
        `<meta name="description" content="Tap to open">`,
        `<meta property="og:type" content="website">`,
        `<meta property="og:title" content="${attr(title)}">`,
        `<meta property="og:description" content="Tap to open">`,
        `<meta property="og:url" content="${attr(target)}">`,
        `<meta property="og:image" content="${attr(saveTheDateSocialImage.url)}">`,
        `<meta property="og:image:width" content="${saveTheDateSocialImage.width}">`,
        `<meta property="og:image:height" content="${saveTheDateSocialImage.height}">`,
        `<meta property="og:image:type" content="${saveTheDateSocialImage.type}">`,
        `<meta property="og:image:alt" content="${attr(saveTheDateSocialImage.alt)}">`,
        `<meta name="twitter:card" content="summary_large_image">`,
      ]
    : [];
  return [
    `<!doctype html>`,
    `<html lang="en-GB">`,
    `<head>`,
    `<meta charset="utf-8">`,
    `<title>${attr(title)}</title>`,
    `<meta name="robots" content="noindex, nofollow">`,
    `<link rel="canonical" href="${attr(target)}">`,
    ...share,
    `<script>location.replace(${JSON.stringify(target)} + location.search + location.hash)</script>`,
    `<meta http-equiv="refresh" content="0; url=${attr(target)}">`,
    `</head>`,
    `<body><a href="${attr(target)}">${attr(target)}</a></body>`,
    `</html>`,
    ``,
  ].join("\n");
}

/** Any other old address: the same path on the custom domain. */
export function notFoundDocument(basePath: string): string {
  const prefix = basePath.replace(/\/+$/, "").replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  const home = siteUrl;
  return [
    `<!doctype html>`,
    `<html lang="en-GB">`,
    `<head>`,
    `<meta charset="utf-8">`,
    `<title>Emily &amp; Lawrence</title>`,
    `<meta name="robots" content="noindex, nofollow">`,
    `<script>location.replace(${JSON.stringify(home.replace(/\/$/, ""))} + (location.pathname.replace(/^${prefix}(?=\\/|$)/, "") || "/") + location.search + location.hash)</script>`,
    `<meta http-equiv="refresh" content="0; url=${attr(home)}">`,
    `</head>`,
    `<body><a href="${attr(home)}">${attr(home)}</a></body>`,
    `</html>`,
    ``,
  ].join("\n");
}
