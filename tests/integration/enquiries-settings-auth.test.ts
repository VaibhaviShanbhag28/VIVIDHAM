import { beforeEach, describe, expect, it } from "vitest";
import { hasDb, productPayload, resetDb } from "./helpers";

describe.skipIf(!hasDb)("enquiries (database)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("records a website enquiry with a reference and product snapshot", async () => {
    const { prisma } = await import("@/lib/db");
    const { createProduct } = await import("@/lib/services/products");
    const { submitPublicEnquiry } = await import("@/lib/services/enquiries");
    const product = await createProduct(productPayload({ salePrice: "175000" }));
    if (!product.ok) throw new Error("setup failed");

    const res = await submitPublicEnquiry({
      customerName: "Asha",
      email: "asha@example.com",
      message: "Is this available in size 12?",
      productId: product.data.id,
      quantity: "2",
      consent: "on",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.reference).toMatch(/^VJ-\d{6}-[A-Z2-9]{5}$/);

    const e = await prisma.enquiry.findUniqueOrThrow({ where: { reference: res.data.reference } });
    expect(e.status).toBe("NEW");
    expect(e.channel).toBe("WEBSITE_FORM");
    expect(e.quantity).toBe(2);
    expect(e.consentGiven).toBe(true);
    expect(e.productSnapshot).toMatchObject({ sku: "TEST-RG-001", displayedPrice: "₹1,75,000" });
  });

  it("rejects invalid submissions without writing anything", async () => {
    const { prisma } = await import("@/lib/db");
    const { submitPublicEnquiry } = await import("@/lib/services/enquiries");
    const res = await submitPublicEnquiry({ customerName: "A", message: "hi", consent: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(Object.keys(res.errors)).toEqual(expect.arrayContaining(["customerName", "message", "consent"]));
    expect(await prisma.enquiry.count()).toBe(0);
  });

  it("does not attach unpublished products to public enquiries", async () => {
    const { prisma } = await import("@/lib/db");
    const { createProduct } = await import("@/lib/services/products");
    const { submitPublicEnquiry } = await import("@/lib/services/enquiries");
    const draft = await createProduct(productPayload({ status: "DRAFT" }));
    if (!draft.ok) throw new Error("setup failed");
    const res = await submitPublicEnquiry({ customerName: "Ravi", phone: "+91 98765 43210", message: "Tell me more", productId: draft.data.id, consent: "on" });
    if (!res.ok) throw new Error("should succeed");
    const e = await prisma.enquiry.findUniqueOrThrow({ where: { reference: res.data.reference } });
    expect(e.productId).toBeNull();
  });

  it("updates status and notes, and records manual enquiries", async () => {
    const { prisma } = await import("@/lib/db");
    const { createManualEnquiry, updateEnquiry, listEnquiries } = await import("@/lib/services/enquiries");
    const created = await createManualEnquiry({ channel: "WHATSAPP_MANUAL", customerName: "Meera", phone: "9876543210", message: "Asked about bangles" });
    if (!created.ok) throw new Error("setup failed");
    expect((await updateEnquiry({ id: created.data.id, status: "CONTACTED", adminNotes: "Sent photos" })).ok).toBe(true);
    const e = await prisma.enquiry.findUniqueOrThrow({ where: { id: created.data.id } });
    expect(e.status).toBe("CONTACTED");
    expect(e.adminNotes).toBe("Sent photos");

    expect((await listEnquiries({ q: "meera", page: 1 })).total).toBe(1);
    expect((await listEnquiries({ status: "NEW", page: 1 })).total).toBe(0);
    expect((await listEnquiries({ channel: "WHATSAPP_MANUAL", page: 1 })).total).toBe(1);
  });
});

describe.skipIf(!hasDb)("site settings (database)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("saves validated settings and rejects invalid ones", async () => {
    const { prisma } = await import("@/lib/db");
    const { updateSiteSettings } = await import("@/lib/services/site");
    const ok = await updateSiteSettings({
      businessName: "VIVIDHUM JEWELLERY",
      whatsappNumber: "+91 98765 43210",
      instagramUrl: "https://instagram.com/vividhum",
      announcementEnabled: false,
      currencyCode: "INR",
      trustHighlights: [{ title: "Personal assistance", description: "" }],
    });
    expect(ok.ok).toBe(true);
    const s = await prisma.siteSettings.findUniqueOrThrow({ where: { id: "default" } });
    expect(s.whatsappNumber).toBe("919876543210");
    expect(s.announcementEnabled).toBe(false);
    expect(s.trustHighlights).toEqual([{ title: "Personal assistance", description: null }]);

    const bad = await updateSiteSettings({ businessName: "", whatsappNumber: "123", announcementEnabled: true, currencyCode: "USD", trustHighlights: [] });
    expect(bad.ok).toBe(false);
    const after = await prisma.siteSettings.findUniqueOrThrow({ where: { id: "default" } });
    expect(after.businessName).toBe("VIVIDHUM JEWELLERY");
  });
});

describe.skipIf(!hasDb)("admin authentication (database)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("authenticates valid credentials, creates sessions, and validates tokens", async () => {
    const { prisma } = await import("@/lib/db");
    const { hashPassword } = await import("@/lib/auth/password");
    const { authenticateAdmin } = await import("@/lib/auth/login");
    const { createSession, validateSessionToken } = await import("@/lib/auth/session");
    const { MemoryRateLimitStore } = await import("@/lib/rate-limit");
    const user = await prisma.adminUser.create({ data: { email: "owner@example.com", name: "Owner", passwordHash: await hashPassword("Emerald-Ring-2026") } });
    const store = new MemoryRateLimitStore();

    expect(await authenticateAdmin("owner@example.com", "wrong-password", { fingerprint: "t", store })).toEqual({ ok: false, reason: "invalid" });
    expect(await authenticateAdmin("nobody@example.com", "whatever", { fingerprint: "t", store })).toEqual({ ok: false, reason: "invalid" });
    const good = await authenticateAdmin("owner@example.com", "Emerald-Ring-2026", { fingerprint: "t", store });
    expect(good).toEqual({ ok: true, adminUserId: user.id });

    const { token } = await createSession(user.id, "vitest");
    const stored = await prisma.adminSession.findFirstOrThrow();
    expect(stored.tokenHash).not.toBe(token); // only the hash is stored
    expect((await validateSessionToken(token))?.email).toBe("owner@example.com");
    expect(await validateSessionToken("x".repeat(43))).toBeNull();

    await prisma.adminSession.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await validateSessionToken(token)).toBeNull();
  });

  it("rate-limits repeated failed logins per email", async () => {
    const { prisma } = await import("@/lib/db");
    const { hashPassword } = await import("@/lib/auth/password");
    const { authenticateAdmin } = await import("@/lib/auth/login");
    const { MemoryRateLimitStore } = await import("@/lib/rate-limit");
    await prisma.adminUser.create({ data: { email: "owner@example.com", name: "Owner", passwordHash: await hashPassword("Emerald-Ring-2026") } });
    const store = new MemoryRateLimitStore();
    for (let i = 0; i < 5; i++) await authenticateAdmin("owner@example.com", `bad-${i}`, { fingerprint: `ip-${i}`, store });
    const res = await authenticateAdmin("owner@example.com", "Emerald-Ring-2026", { fingerprint: "ip-new", store });
    expect(res).toMatchObject({ ok: false, reason: "rate_limited" });
  });

  it("stores DB rate-limit buckets atomically", async () => {
    const { dbRateLimitStore } = await import("@/lib/rate-limit-db");
    const { rateLimit } = await import("@/lib/rate-limit");
    const results = await Promise.all(Array.from({ length: 6 }, () => rateLimit(dbRateLimitStore, "enquiry:test", { limit: 5, windowMs: 60_000 })));
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
  });
});
