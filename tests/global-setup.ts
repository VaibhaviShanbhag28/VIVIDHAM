import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * When TEST_DATABASE_URL is set, (re)creates the schema in that database before
 * the integration suite. Refuses to run against the main DATABASE_URL.
 */
export default function setup() {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    console.log("\n[tests] TEST_DATABASE_URL not set — database integration tests will be skipped.\n");
    return;
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL === testUrl) {
    throw new Error("TEST_DATABASE_URL must point to a separate database from DATABASE_URL.");
  }
  const prismaCli = path.resolve(process.cwd(), "node_modules", "prisma", "build", "index.js");
  execFileSync(process.execPath, [prismaCli, "db", "push", "--force-reset", "--skip-generate"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testUrl },
  });
}
