import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { MemoryRateLimitStore, rateLimit } from "@/lib/rate-limit";
import { renderInline } from "@/components/content/RichText";

describe("password hashing", () => {
  it("uses Argon2id with a unique salt and verifies correctly", async () => {
    const a = await hashPassword("Emerald-Ring-2026");
    const b = await hashPassword("Emerald-Ring-2026");
    expect(a).toMatch(/^\$argon2id\$/);
    expect(a).not.toBe(b);
    expect(await verifyPassword(a, "Emerald-Ring-2026")).toBe(true);
    expect(await verifyPassword(a, "emerald-ring-2026")).toBe(false);
    expect(await verifyPassword("not-a-hash", "x")).toBe(false);
  });
});

describe("rateLimit", () => {
  it("allows up to the limit within a window, then blocks, then resets", async () => {
    const store = new MemoryRateLimitStore();
    const t0 = new Date("2026-01-01T00:00:00Z");
    const opts = { limit: 3, windowMs: 60_000 };
    for (let i = 0; i < 3; i++) expect((await rateLimit(store, "k", { ...opts, now: t0 })).allowed).toBe(true);
    const blocked = await rateLimit(store, "k", { ...opts, now: new Date(t0.getTime() + 10_000) });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(50);
    expect((await rateLimit(store, "other", { ...opts, now: t0 })).allowed).toBe(true);
    expect((await rateLimit(store, "k", { ...opts, now: new Date(t0.getTime() + 61_000) })).allowed).toBe(true);
  });
});

describe("RichText inline rendering", () => {
  it("drops unsafe link protocols", () => {
    const nodes = renderInline("[click](javascript:alert(1)) and [ok](/contact)");
    expect(nodes[0]).toBe("click");
    const link = nodes.find((n) => typeof n === "object") as { props: { href: string } };
    expect(link.props.href).toBe("/contact");
  });
});
