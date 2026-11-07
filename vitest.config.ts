import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts so the Cloudflare plugin does not run
// during tests - the tests are plain functions and do not need a Worker.
export default defineConfig({
  resolve: {
    alias: {
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
    },
  },
  test: {
    environment: "node",
  },
});
