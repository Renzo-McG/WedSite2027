import { defineConfig } from "astro/config";
import process from "node:process";
import { URL } from "node:url";
import { normalizeBasePath, siteUrl } from "./src/config/site.ts";
import legacyGitHubPages from "./integrations/legacy-github-pages.mjs";

const base = normalizeBasePath(process.env.BASE_PATH);

export default defineConfig({
  site: new URL(siteUrl).origin,
  // Root by default (Cloudflare Pages); the GitHub Pages workflow supplies BASE_PATH.
  base,
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
    inlineStylesheets: "auto",
  },
  // GitHub Pages now only redirects old links to the custom domain.
  integrations: [
    legacyGitHubPages({ enabled: process.env.LEGACY_GITHUB_PAGES === "true", basePath: base }),
  ],
});
