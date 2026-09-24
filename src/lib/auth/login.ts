import "server-only";
import { prisma } from "@/lib/db";
import { LIMITS, rateLimit, type RateLimitStore } from "@/lib/rate-limit";
import { burnPasswordCheck, verifyPassword } from "./password";

const LOCK_AFTER_FAILURES = 10;
const LOCK_MINUTES = 15;

export type LoginResult =
  | { ok: true; adminUserId: string }
  | { ok: false; reason: "invalid" | "rate_limited" | "locked"; retryAfterSeconds?: number };

/**
 * Verifies admin credentials with per-IP and per-email rate limits plus an
 * account lockout. Error responses are deliberately generic.
 */
export async function authenticateAdmin(
  email: string,
  password: string,
  ctx: { fingerprint: string; store: RateLimitStore; now?: Date },
): Promise<LoginResult> {
  const now = ctx.now ?? new Date();
  const ipLimit = await rateLimit(ctx.store, `login:ip:${ctx.fingerprint}`, { ...LIMITS.loginPerIp, now });
  const emailLimit = await rateLimit(ctx.store, `login:email:${email}`, { ...LIMITS.loginPerEmail, now });
  if (!ipLimit.allowed || !emailLimit.allowed) {
    return { ok: false, reason: "rate_limited", retryAfterSeconds: Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds) };
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    await burnPasswordCheck(password);
    return { ok: false, reason: "invalid" };
  }
  if (user.lockedUntil && user.lockedUntil > now) {
    await burnPasswordCheck(password);
    return { ok: false, reason: "locked", retryAfterSeconds: Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 1000) };
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    const failures = user.failedLoginCount + 1;
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        failedLoginCount: failures >= LOCK_AFTER_FAILURES ? 0 : failures,
        lockedUntil: failures >= LOCK_AFTER_FAILURES ? new Date(now.getTime() + LOCK_MINUTES * 60_000) : user.lockedUntil,
      },
    });
    return { ok: false, reason: "invalid" };
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: now },
  });
  await ctx.store.reset(`login:email:${email}`);
  return { ok: true, adminUserId: user.id };
}
