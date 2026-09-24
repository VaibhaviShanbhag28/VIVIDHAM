/**
 * Create the first admin account (or reset an admin password) from the command line.
 *
 *   npm run admin:create                 # interactive prompts (password input is hidden)
 *   npm run admin:reset-password         # reset an existing admin's password
 *
 * Non-interactive use (e.g. a one-off deployment console) — values are read from the
 * environment of that single command and are never written to disk:
 *   ADMIN_EMAIL=… ADMIN_NAME=… ADMIN_PASSWORD=… npm run admin:create
 *
 * There is intentionally no public registration page.
 */
import "./load-env";
import { PrismaClient } from "@prisma/client";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { hashPassword } from "../src/lib/auth/password";
import { newPasswordSchema } from "../src/lib/validation/auth";

const prisma = new PrismaClient();
const reset = process.argv.includes("--reset");

function ask(question: string, hidden = false): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
    muted = hidden;
  });
}

async function main() {
  const interactive = !process.env.ADMIN_PASSWORD;
  const email = (process.env.ADMIN_EMAIL ?? (await ask("Admin email: "))).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email address.");

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (reset && !existing) throw new Error(`No admin account exists for ${email}.`);
  if (!reset && existing) throw new Error(`An admin account for ${email} already exists. Use "npm run admin:reset-password" to change its password.`);

  const name = reset ? existing!.name : (process.env.ADMIN_NAME ?? (await ask("Full name: "))) || "Administrator";

  const password = process.env.ADMIN_PASSWORD ?? (await ask("Password (input hidden): ", true));
  const check = newPasswordSchema.safeParse(password);
  if (!check.success) throw new Error(`Password rejected: ${check.error.issues.map((i) => i.message).join("; ")}`);
  if (interactive) {
    const confirm = await ask("Confirm password: ", true);
    if (confirm !== password) throw new Error("Passwords do not match.");
  }

  const passwordHash = await hashPassword(password);
  if (reset) {
    await prisma.$transaction([
      prisma.adminUser.update({ where: { id: existing!.id }, data: { passwordHash, passwordChangedAt: new Date(), failedLoginCount: 0, lockedUntil: null, isActive: true } }),
      prisma.adminSession.deleteMany({ where: { adminUserId: existing!.id } }),
    ]);
    console.log(`✔ Password reset for ${email}. All existing sessions were signed out.`);
  } else {
    const isFirst = (await prisma.adminUser.count()) === 0;
    await prisma.adminUser.create({ data: { email, name, passwordHash, role: isFirst ? "OWNER" : "ADMIN" } });
    console.log(`✔ Admin account created for ${email}${isFirst ? " (owner)" : ""}. Sign in at /admin/login.`);
  }
}

main()
  .catch((e) => {
    console.error(`✖ ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
