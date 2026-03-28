import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "~": resolve(__dirname, "."),
      "#imports": resolve(__dirname, ".nuxt/imports.d.ts"),
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/integration/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["server/**/*.ts", "composables/**/*.ts"],
    },
  },
});
