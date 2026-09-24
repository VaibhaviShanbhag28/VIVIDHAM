import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Verifies that admin mutations and the upload endpoint refuse to run without
 * a valid session — before any service or database call is made.
 */

const { cookieStore, sessionLookup, services, siteServices, enquiryServices } = vi.hoisted(() => ({
  cookieStore: new Map<string, string>(),
  sessionLookup: vi.fn(async () => null),
  services: { createProduct: vi.fn(), updateProduct: vi.fn(), deleteProduct: vi.fn(), changeProductStatus: vi.fn() },
  siteServices: { updateSiteSettings: vi.fn(), saveContentPage: vi.fn(), saveCategory: vi.fn(), deleteCategory: vi.fn(), moveCategory: vi.fn(), setCategoryActive: vi.fn() },
  enquiryServices: { updateEnquiry: vi.fn(), createManualEnquiry: vi.fn(), deleteEnquiry: vi.fn(), submitPublicEnquiry: vi.fn() },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieStore.has(name) ? { name, value: cookieStore.get(name)! } : undefined),
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: async () => new Headers(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: new Proxy(
    {},
    {
      get: (_t, model) =>
        model === "adminSession"
          ? { findUnique: sessionLookup, delete: vi.fn(), update: vi.fn() }
          : new Proxy({}, { get: () => vi.fn(async () => { throw new Error(`DB should not be touched (${String(model)})`); }) }),
    },
  ),
}));

vi.mock("@/lib/services/products", () => services);
vi.mock("@/lib/services/site", () => siteServices);
vi.mock("@/lib/services/enquiries", () => enquiryServices);

beforeEach(() => {
  cookieStore.clear();
  vi.clearAllMocks();
});

describe("admin server actions without a session", () => {
  it("product actions throw UNAUTHORIZED and never call services", async () => {
    const { saveProductAction, deleteProductAction, productStatusAction } = await import("@/app/admin/actions/products");
    await expect(saveProductAction(null, { name: "x" })).rejects.toThrow("UNAUTHORIZED");
    const fd = new FormData();
    fd.set("id", "abc123");
    fd.set("action", "publish");
    await expect(productStatusAction(fd)).rejects.toThrow("UNAUTHORIZED");
    await expect(deleteProductAction(fd)).rejects.toThrow("UNAUTHORIZED");
    expect(services.createProduct).not.toHaveBeenCalled();
    expect(services.changeProductStatus).not.toHaveBeenCalled();
    expect(services.deleteProduct).not.toHaveBeenCalled();
  });

  it("settings, category and enquiry actions are protected", async () => {
    const { saveSettingsAction } = await import("@/app/admin/actions/settings");
    const { saveCategoryAction } = await import("@/app/admin/actions/categories");
    const { updateEnquiryAction } = await import("@/app/admin/actions/enquiries");
    await expect(saveSettingsAction({ businessName: "Hacked" })).rejects.toThrow("UNAUTHORIZED");
    await expect(saveCategoryAction({}, new FormData())).rejects.toThrow("UNAUTHORIZED");
    await expect(updateEnquiryAction({}, new FormData())).rejects.toThrow("UNAUTHORIZED");
    expect(siteServices.updateSiteSettings).not.toHaveBeenCalled();
    expect(siteServices.saveCategory).not.toHaveBeenCalled();
    expect(enquiryServices.updateEnquiry).not.toHaveBeenCalled();
  });

  it("rejects a forged session cookie", async () => {
    cookieStore.set("vj_admin", "forged-token-value-that-is-long-enough");
    const { saveProductAction } = await import("@/app/admin/actions/products");
    await expect(saveProductAction(null, {})).rejects.toThrow("UNAUTHORIZED");
    expect(sessionLookup).toHaveBeenCalledTimes(1);
    expect(services.createProduct).not.toHaveBeenCalled();
  });
});

describe("upload endpoint", () => {
  const upload = (headers: Record<string, string>) =>
    new Request("http://localhost:3000/api/admin/uploads", { method: "POST", headers, body: new FormData() });

  it("rejects cross-origin requests", async () => {
    const { POST } = await import("@/app/api/admin/uploads/route");
    const res = await POST(upload({ origin: "https://evil.example", host: "localhost:3000" }));
    expect(res.status).toBe(403);
  });

  it("rejects unauthenticated same-origin requests", async () => {
    const { POST } = await import("@/app/api/admin/uploads/route");
    const res = await POST(upload({ origin: "http://localhost:3000", host: "localhost:3000" }));
    expect(res.status).toBe(401);
  });
});
