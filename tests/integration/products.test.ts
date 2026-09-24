import { beforeEach, describe, expect, it } from "vitest";
import { hasDb, productPayload, resetDb } from "./helpers";

describe.skipIf(!hasDb)("product management & public catalogue (database)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a product with images, gemstones and categories", async () => {
    const { prisma } = await import("@/lib/db");
    const { createProduct } = await import("@/lib/services/products");
    const cat = await prisma.category.create({ data: { name: "Rings", slug: "rings" } });

    const res = await createProduct(productPayload({ categoryIds: [cat.id], salePrice: "175000" }));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.slug).toBe("emerald-halo-ring");

    const p = await prisma.product.findUniqueOrThrow({ where: { id: res.data.id }, include: { images: true, gemstones: true, categories: true } });
    expect(p.price?.toFixed(2)).toBe("185000.00");
    expect(p.effectivePrice?.toFixed(2)).toBe("175000.00");
    expect(p.publishedAt).not.toBeNull();
    expect(p.images[0].isPrimary).toBe(true);
    expect(p.images[0].alt).toBe("Emerald Halo Ring");
    expect(p.gemstones[0].caratWeight?.toFixed(3)).toBe("1.250");
    expect(p.categories).toHaveLength(1);
  });

  it("rejects duplicate SKUs and untrusted image URLs", async () => {
    const { createProduct } = await import("@/lib/services/products");
    expect((await createProduct(productPayload())).ok).toBe(true);
    const dup = await createProduct(productPayload({ name: "Another" }));
    expect(dup).toEqual({ ok: false, errors: { sku: "Another product already uses this SKU" } });

    const bad = await createProduct(productPayload({ sku: "TEST-2", images: [{ url: "https://evil.example/x.jpg", provider: "LOCAL", isPrimary: true }] }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors["images.0"]).toMatch(/uploaded/);
  });

  it("edits a product, keeps its slug unique and replaces related rows", async () => {
    const { prisma } = await import("@/lib/db");
    const { createProduct, updateProduct } = await import("@/lib/services/products");
    const a = await createProduct(productPayload());
    const b = await createProduct(productPayload({ sku: "TEST-RG-002", name: "Ruby Ring" }));
    if (!a.ok || !b.ok) throw new Error("setup failed");

    const res = await updateProduct(b.data.id, productPayload({ sku: "TEST-RG-002", name: "Ruby Ring", slug: "emerald-halo-ring", price: "", gemstones: [] }));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.slug).toBe("emerald-halo-ring-2");
    const p = await prisma.product.findUniqueOrThrow({ where: { id: b.data.id }, include: { gemstones: true } });
    expect(p.price).toBeNull();
    expect(p.effectivePrice).toBeNull();
    expect(p.gemstones).toHaveLength(0);
  });

  it("changes status and availability", async () => {
    const { prisma } = await import("@/lib/db");
    const { createProduct, changeProductStatus } = await import("@/lib/services/products");
    const res = await createProduct(productPayload({ status: "DRAFT" }));
    if (!res.ok) throw new Error("setup failed");
    await changeProductStatus(res.data.id, "publish");
    await changeProductStatus(res.data.id, "mark-sold-out");
    const p = await prisma.product.findUniqueOrThrow({ where: { id: res.data.id } });
    expect(p.status).toBe("PUBLISHED");
    expect(p.availability).toBe("SOLD_OUT");
    expect(p.stockQuantity).toBe(0);
  });

  it("lists only published products and supports search, filters, sorting and pagination", async () => {
    const { prisma } = await import("@/lib/db");
    const { createProduct } = await import("@/lib/services/products");
    const { listProducts, getPublishedProduct } = await import("@/lib/catalogue/queries");
    const { parseCatalogueParams } = await import("@/lib/catalogue/filters");
    const rings = await prisma.category.create({ data: { name: "Rings", slug: "rings" } });
    const gems = await prisma.category.create({ data: { name: "Gemstones", slug: "gemstones" } });

    await createProduct(productPayload({ sku: "A-1", name: "Emerald Ring", price: "50000", categoryIds: [rings.id], material: "Yellow Gold" }));
    await createProduct(productPayload({ sku: "A-2", name: "Ruby Ring", price: "20000", categoryIds: [rings.id], gemstones: [{ type: "Ruby" }], material: "White Gold" }));
    await createProduct(productPayload({ sku: "A-3", name: "Loose Sapphire", price: "", categoryIds: [gems.id], gemstones: [{ type: "Blue Sapphire" }] }));
    await createProduct(productPayload({ sku: "A-4", name: "Hidden Draft Ring", status: "DRAFT", categoryIds: [rings.id] }));

    const all = await listProducts(parseCatalogueParams({}));
    expect(all.total).toBe(3);
    expect(all.items.map((i) => i.sku)).not.toContain("A-4");
    expect(await getPublishedProduct("hidden-draft-ring")).toBeNull();

    const bySearch = await listProducts(parseCatalogueParams({ q: "ruby" }));
    expect(bySearch.items.map((i) => i.sku)).toEqual(["A-2"]);
    const bySku = await listProducts(parseCatalogueParams({ q: "a-3" }));
    expect(bySku.items.map((i) => i.sku)).toEqual(["A-3"]);
    const byCategoryName = await listProducts(parseCatalogueParams({ q: "gemstones" }));
    expect(byCategoryName.items.map((i) => i.sku)).toEqual(["A-3"]);

    const byCategory = await listProducts(parseCatalogueParams({ category: "rings", sort: "price-asc" }));
    expect(byCategory.items.map((i) => i.sku)).toEqual(["A-2", "A-1"]);

    const byGem = await listProducts(parseCatalogueParams({ gem: "blue sapphire" }));
    expect(byGem.items.map((i) => i.sku)).toEqual(["A-3"]);

    const byMaterial = await listProducts(parseCatalogueParams({ material: "white gold" }));
    expect(byMaterial.items.map((i) => i.sku)).toEqual(["A-2"]);

    const byPrice = await listProducts(parseCatalogueParams({ min: "30000", max: "60000" }));
    expect(byPrice.items.map((i) => i.sku)).toEqual(["A-1"]);

    const desc = await listProducts(parseCatalogueParams({ sort: "price-desc" }));
    expect(desc.items.map((i) => i.sku)).toEqual(["A-1", "A-2", "A-3"]); // price-on-request last

    const page2 = await listProducts(parseCatalogueParams({ sort: "price-asc", page: "2" }), 2);
    expect(page2.pageCount).toBe(2);
    expect(page2.items.map((i) => i.sku)).toEqual(["A-3"]);
  });
});
