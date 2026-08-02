import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://renzo-mcg.github.io",
  base: "/WedSite2027",
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
    inlineStylesheets: "auto",
  },
});
