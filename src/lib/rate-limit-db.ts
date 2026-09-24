import "server-only";
import { prisma } from "@/lib/db";
import type { RateLimitStore } from "@/lib/rate-limit";

/** PostgreSQL-backed store: a single atomic upsert per hit. */
export const dbRateLimitStore: RateLimitStore = {
  async hit(key, windowMs, now) {
    const windowStartCutoff = new Date(now.getTime() - windowMs);
    const rows = await prisma.$queryRaw<Array<{ count: number; windowStart: Date }>>`
      INSERT INTO "RateLimitBucket" ("key", "count", "windowStart")
      VALUES (${key}, 1, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimitBucket"."windowStart" <= ${windowStartCutoff} THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
        "windowStart" = CASE WHEN "RateLimitBucket"."windowStart" <= ${windowStartCutoff} THEN ${now} ELSE "RateLimitBucket"."windowStart" END
      RETURNING "count", "windowStart"`;
    const row = rows[0];
    return { count: Number(row.count), windowStart: new Date(row.windowStart) };
  },
  async reset(key) {
    await prisma.rateLimitBucket.deleteMany({ where: { key } });
  },
};

/** Occasional clean-up of stale buckets; safe to call opportunistically. */
export async function pruneRateLimitBuckets(olderThanMs = 24 * 60 * 60_000) {
  await prisma.rateLimitBucket.deleteMany({ where: { windowStart: { lt: new Date(Date.now() - olderThanMs) } } });
}
