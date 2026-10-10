/**
 * Where the two experiences live, relative to the deployment base. Every link
 * between them reads from here, so the custom-domain cutover is a swap of
 * these values rather than a hunt through templates.
 *
 * Today the Save the Date is the site root and the Wedding website starts at
 * welcome/. At cutover the Wedding website home becomes the root, the Save the
 * Date moves to save-the-date/ (already served there as well), and welcome/
 * redirects to the root.
 */
export const routes = {
  home: "welcome/",
  saveTheDate: "",
} as const;

/** Joins a base URL and a route without doubling or dropping the slash. */
export function routeHref(base: string, route: string): string {
  return `${base.replace(/\/?$/, "/")}${route.replace(/^\//, "")}`;
}
