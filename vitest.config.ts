import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // tests/style-isolation.test.ts reads the stylesheets as text (?raw);
    // otherwise Vitest replaces every CSS module with an empty string.
    css: { include: [/\/src\/styles\/[^/]+\.css/] },
  },
});
