import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/globalSetup.ts"],
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://cms:cms@localhost:5432/cms_test",
      AUTH_SECRET: "test-secret-0123456789abcdef0123456789abcdef",
    },
    fileParallelism: false,
  },
});
