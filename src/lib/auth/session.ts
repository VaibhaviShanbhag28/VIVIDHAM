import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-vj_admin" : "vj_admin";

function ttlMs() {
  const hours = Number(process.env.SESSION_TTL_HOURS ?? 12);
  return (Number.isFinite(hours) && hours > 0 ? hours : 12) * 60 * 60 * 1000;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export interface SessionAdmin {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "ADMIN";
  sessionId: string;
}

/** Creates a DB session and returns the raw token (only ever placed in the cookie). */
export async function createSession(adminUserId: string, userAgent: string | null) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlMs());
  await prisma.adminSession.create({
    data: { tokenHash: hashToken(token), adminUserId, userAgent, expiresAt },
  });
  return { token, expiresAt };
}

/** Validates a raw session token against the database. Pure of Next.js APIs so it can be tested directly. */
export async function validateSessionToken(token: string | undefined | null): Promise<SessionAdmin | null> {
  if (!token || token.length < 20 || token.length > 200) return null;
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { adminUser: { select: { id: true, email: true, name: true, role: true, isActive: true } } },
  });
  if (!session) return null;
  const now = Date.now();
  // Password changes/resets delete all of the user's sessions, so no extra check is needed here.
  if (session.expiresAt.getTime() <= now || !session.adminUser.isActive) {
    await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  // Touch at most every 5 minutes to limit writes.
  if (now - session.lastSeenAt.getTime() > 5 * 60_000) {
    await prisma.adminSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
  }
  const { id, email, name, role } = session.adminUser;
  return { id, email, name, role, sessionId: session.id };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Current admin for this request (memoised per request), or null. */
export const getCurrentAdmin = cache(async (): Promise<SessionAdmin | null> => {
  const jar = await cookies();
  return validateSessionToken(jar.get(SESSION_COOKIE)?.value);
});

export class UnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

/** For server components/pages: redirects to the login page when not authenticated. */
export async function requireAdminPage(): Promise<SessionAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** For server actions and route handlers: throws when not authenticated. */
export async function requireAdmin(): Promise<SessionAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new UnauthorizedError();
  return admin;
}

export async function destroySession(sessionId: string) {
  await prisma.adminSession.deleteMany({ where: { id: sessionId } });
}

export async function pruneExpiredSessions() {
  await prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
