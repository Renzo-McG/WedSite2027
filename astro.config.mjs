import { defineConfig } from "astro/config";
import { URL } from "node:url";
import { deploymentBasePath, siteUrl } from "./src/config/site.ts";

export default defineConfig({
  site: new URL(siteUrl).origin,
  base: deploymentBasePath,
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
    inlineStylesheets: "auto",
  },
});
