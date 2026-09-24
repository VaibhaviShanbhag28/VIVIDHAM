/**
 * Fixed-window rate limiting with a pluggable store. The default store keeps
 * buckets in PostgreSQL so limits hold across multiple server instances.
 */

export interface RateLimitStore {
  /** Atomically increments the bucket (resetting it if the window expired) and returns the new count and window start. */
  hit(key: string, windowMs: number, now: Date): Promise<{ count: number; windowStart: Date }>;
  reset(key: string): Promise<void>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export async function rateLimit(
  store: RateLimitStore,
  key: string,
  opts: { limit: number; windowMs: number; now?: Date },
): Promise<RateLimitResult> {
  const now = opts.now ?? new Date();
  const { count, windowStart } = await store.hit(key, opts.windowMs, now);
  const resetAt = windowStart.getTime() + opts.windowMs;
  const allowed = count <= opts.limit;
  return {
    allowed,
    remaining: Math.max(0, opts.limit - count),
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((resetAt - now.getTime()) / 1000)),
  };
}

export class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, { count: number; windowStart: Date }>();

  async hit(key: string, windowMs: number, now: Date) {
    const b = this.buckets.get(key);
    if (!b || now.getTime() - b.windowStart.getTime() >= windowMs) {
      const fresh = { count: 1, windowStart: now };
      this.buckets.set(key, fresh);
      return { ...fresh };
    }
    b.count += 1;
    return { ...b };
  }

  async reset(key: string) {
    this.buckets.delete(key);
  }
}

export const LIMITS = {
  loginPerIp: { limit: 10, windowMs: 15 * 60_000 },
  loginPerEmail: { limit: 5, windowMs: 15 * 60_000 },
  enquiryPerIp: { limit: 5, windowMs: 10 * 60_000 },
  uploadPerAdmin: { limit: 120, windowMs: 10 * 60_000 },
} as const;
