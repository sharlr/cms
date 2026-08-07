import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DB_FILE = path.join(ROOT, "test.db");

/** Recrée une base de test vierge et y applique les migrations. */
export default function setup() {
  for (const file of [DB_FILE, `${DB_FILE}-journal`]) {
    rmSync(file, { force: true });
  }

  execSync("npx prisma migrate deploy", {
    cwd: ROOT,
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
}
