import "server-only";
import { headers } from "next/headers";
import { createHash } from "node:crypto";

/**
 * Best-effort client identifier for rate limiting. Forwarded headers are only
 * trusted when TRUST_PROXY=true (i.e. behind a proxy that overwrites them).
 * The IP is hashed so raw addresses are never stored.
 */
export async function clientFingerprint(): Promise<string> {
  const h = await headers();
  let ip = "unknown";
  if (process.env.TRUST_PROXY === "true" || process.env.TRUST_PROXY === "1") {
    ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  }
  return createHash("sha256").update(`vj:${ip}`).digest("hex").slice(0, 32);
}

export async function userAgent(): Promise<string | null> {
  const h = await headers();
  return h.get("user-agent")?.slice(0, 300) ?? null;
}

/** Same-origin check for route handlers that accept mutations (defence-in-depth alongside SameSite cookies). */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
