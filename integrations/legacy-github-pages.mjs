import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  legacyRedirectTarget,
  legacyRoutes,
  notFoundDocument,
  redirectDocument,
} from "../src/lib/legacy-redirects.ts";

/** Published unchanged: a calendar file cannot redirect, and its event is the same. */
const kept = new Set(["emily-lawrence-wedding.ics"]);

/**
 * GitHub Pages only: once the legacy build finishes, replace its output with
 * redirect pages (src/lib/legacy-redirects.ts), so the old host no longer
 * serves a second copy of the site. Other builds are untouched.
 */
export default function legacyGitHubPages({ enabled, basePath }) {
  return {
    name: "legacy-github-pages",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        if (!enabled) return;
        const out = fileURLToPath(dir);
        for (const entry of await readdir(out)) {
          if (!kept.has(entry)) await rm(join(out, entry), { recursive: true, force: true });
        }
        for (const route of legacyRoutes) {
          await mkdir(join(out, route), { recursive: true });
          await writeFile(
            join(out, route, "index.html"),
            redirectDocument(legacyRedirectTarget(route)),
          );
        }
        await writeFile(join(out, "404.html"), notFoundDocument(basePath));
        logger.info(
          `replaced the build with ${legacyRoutes.length} redirect pages and a 404 redirect`,
        );
      },
    },
  };
}
