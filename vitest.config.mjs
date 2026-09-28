import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["plugins/base/tests/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["plugins/base/extensions/**/*.js"],
      all: true,
    },
  },
});
