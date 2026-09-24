import { describe, expect, it } from "vitest";
import { activeFilterCount, buildProductOrderBy, buildProductWhere, filtersToSearchParams, parseCatalogueParams } from "@/lib/catalogue/filters";

describe("parseCatalogueParams", () => {
  it("parses repeated and comma-separated parameters", () => {
    const f = parseCatalogueParams({ category: ["rings", "Earrings,bad slug!"], gem: "Emerald", sort: "price-asc", page: "2" });
    expect(f.categories).toEqual(["rings", "earrings"]);
    expect(f.gems).toEqual(["Emerald"]);
    expect(f.sort).toBe("price-asc");
    expect(f.page).toBe(2);
  });

  it("falls back to safe defaults for invalid input", () => {
    const f = parseCatalogueParams({ sort: "drop table", page: "-4", availability: ["IN_STOCK", "HACKED"], min: "abc" });
    expect(f.sort).toBe("featured");
    expect(f.page).toBe(1);
    expect(f.availability).toEqual(["IN_STOCK"]);
    expect(f.minPrice).toBeNull();
  });

  it("normalises and orders the price range", () => {
    const f = parseCatalogueParams({ min: "1,00,000", max: "50000" });
    expect(f.minPrice).toBe("50000.00");
    expect(f.maxPrice).toBe("100000.00");
  });

  it("trims and bounds the search query", () => {
    expect(parseCatalogueParams({ q: "  emerald ring \u0000 " }).q).toBe("emerald ring");
    expect(parseCatalogueParams({ q: "x".repeat(500) }).q).toHaveLength(100);
    expect(parseCatalogueParams({ q: "   " }).q).toBeNull();
  });
});

describe("buildProductWhere", () => {
  it("always restricts to published products", () => {
    const where = buildProductWhere(parseCatalogueParams({}));
    expect(where).toEqual({ AND: [{ status: "PUBLISHED" }] });
  });

  it("searches name, SKU, category and gemstone for every search term", () => {
    const where = buildProductWhere(parseCatalogueParams({ q: "emerald VJ-RG" }));
    const and = where.AND as Array<Record<string, unknown>>;
    expect(and).toHaveLength(3);
    const ors = (and[1] as { OR: Array<Record<string, unknown>> }).OR;
    expect(ors).toContainEqual({ name: { contains: "emerald", mode: "insensitive" } });
    expect(ors).toContainEqual({ sku: { contains: "emerald", mode: "insensitive" } });
    expect(ors).toContainEqual({ gemstones: { some: { type: { contains: "emerald", mode: "insensitive" } } } });
    expect(ors).toContainEqual({ tags: { has: "emerald" } });
    expect(JSON.stringify(and[2])).toContain("VJ-RG");
  });

  it("combines category, gemstone, material, availability and price filters", () => {
    const where = buildProductWhere(
      parseCatalogueParams({ category: "rings", gem: "Ruby", material: "Yellow Gold", availability: "IN_STOCK", min: "1000", max: "5000", type: "Fine Jewellery" }),
    );
    const json = JSON.stringify(where);
    expect(json).toContain('"slug":{"in":["rings"]}');
    expect(json).toContain('"type":{"in":["Ruby"],"mode":"insensitive"}');
    expect(json).toContain('"material":{"in":["Yellow Gold"],"mode":"insensitive"}');
    expect(json).toContain('"jewelleryType":{"in":["Fine Jewellery"],"mode":"insensitive"}');
    expect(json).toContain('"availability":{"in":["IN_STOCK"]}');
    expect(json).toContain('"effectivePrice":{"gte":"1000.00","lte":"5000.00"}');
  });
});

describe("sorting & serialisation", () => {
  it("maps sort options to decimal-safe price ordering", () => {
    expect(buildProductOrderBy("price-asc")[0]).toEqual({ effectivePrice: { sort: "asc", nulls: "last" } });
    expect(buildProductOrderBy("price-desc")[0]).toEqual({ effectivePrice: { sort: "desc", nulls: "last" } });
    expect(buildProductOrderBy("newest")[0]).toEqual({ publishedAt: { sort: "desc", nulls: "last" } });
  });

  it("round-trips filters through query strings", () => {
    const f = parseCatalogueParams({ q: "ring", category: ["rings", "gemstones"], min: "1000", sort: "newest", page: "3" });
    const sp = filtersToSearchParams(f);
    expect(sp.toString()).toBe("q=ring&category=rings&category=gemstones&min=1000&sort=newest&page=3");
    const again = parseCatalogueParams(Object.fromEntries([...new Set(sp.keys())].map((k) => [k, sp.getAll(k)])));
    expect(again).toEqual(f);
    expect(activeFilterCount(f)).toBe(3);
  });
});
