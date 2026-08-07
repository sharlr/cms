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
    // Base de test dédiée, distincte de dev.db. Les suites qui touchent la base
    // partagent un fichier unique : elles s'exécutent en série pour éviter les
    // verrous SQLite concurrents.
    env: {
      DATABASE_URL: "file:./test.db",
      AUTH_SECRET: "test-secret-0123456789abcdef0123456789abcdef",
    },
    fileParallelism: false,
  },
});
