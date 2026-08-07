import { execSync } from "node:child_process";
import path from "node:path";
import { Client } from "pg";

const ROOT = path.resolve(import.meta.dirname, "..");
const TEST_URL =
  process.env.DATABASE_URL ?? "postgresql://cms:cms@localhost:5432/cms_test";

/** Recrée une base de test vierge et y applique les migrations. */
export default async function setup() {
  const client = new Client({ connectionString: TEST_URL });
  await client.connect();
  await client.query("DROP SCHEMA IF EXISTS public CASCADE");
  await client.query("CREATE SCHEMA public");
  await client.query("GRANT ALL ON SCHEMA public TO public");
  await client.end();

  execSync("npx prisma migrate deploy", {
    cwd: ROOT,
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: TEST_URL },
  });
}
