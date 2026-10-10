import { defineConfig } from "astro/config";
import process from "node:process";
import { URL } from "node:url";
import { normalizeBasePath, siteUrl } from "./src/config/site.ts";

export default defineConfig({
  site: new URL(siteUrl).origin,
  // Root by default (Cloudflare Pages); the GitHub Pages workflow supplies BASE_PATH.
  base: normalizeBasePath(process.env.BASE_PATH),
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
    inlineStylesheets: "auto",
  },
});
