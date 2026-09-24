import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Load .env (without overriding variables already set in the shell) so TEST_DATABASE_URL can live there.
for (const [key, value] of Object.entries(loadEnv("test", process.cwd(), ""))) {
  process.env[key] ??= value;
}

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` throws outside the Next.js server bundle; tests run in plain Node.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    globalSetup: ["tests/global-setup.ts"],
    // Integration tests share one database, so run files sequentially.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
