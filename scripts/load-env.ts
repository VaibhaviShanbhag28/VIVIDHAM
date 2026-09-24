import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Loads `.env` for CLI scripts (seed, create-admin, …). Variables already set in
 * the shell/platform take precedence. Import this before anything that reads env.
 */
const file = path.resolve(process.cwd(), ".env");
if (existsSync(file)) process.loadEnvFile(file);
