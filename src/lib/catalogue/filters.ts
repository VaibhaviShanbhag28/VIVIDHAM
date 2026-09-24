import type { Prisma } from "@prisma/client";
import { compareMoney, normaliseMoney } from "@/lib/money";

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const AVAILABILITY_VALUES = ["IN_STOCK", "MADE_TO_ORDER", "ON_REQUEST", "SOLD_OUT"] as const;
type AvailabilityValue = (typeof AVAILABILITY_VALUES)[number];

export interface CatalogueFilters {
  q: string | null;
  categories: string[];
  types: string[];
  gems: string[];
  materials: string[];
  availability: AvailabilityValue[];
  minPrice: string | null;
  maxPrice: string | null;
  sort: SortValue;
  page: number;
}

export const PAGE_SIZE = 12;

type RawParams = Record<string, string | string[] | undefined>;

function toArray(v: string | string[] | undefined, max = 20): string[] {
  const arr = Array.isArray(v) ? v : v ? [v] : [];
  return Array.from(
    new Set(
      arr
        .flatMap((s) => s.split(","))
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length <= 80),
    ),
  ).slice(0, max);
}

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/** Parses untrusted query-string parameters into a bounded, normalised filter object. */
export function parseCatalogueParams(params: RawParams): CatalogueFilters {
  const qRaw = first(params.q)?.replace(/[\u0000-\u001F\u007F]/g, "").trim() ?? "";
  const sortRaw = first(params.sort);
  const pageRaw = Number.parseInt(first(params.page) ?? "1", 10);
  let minPrice = normaliseMoney(first(params.min) ?? null);
  let maxPrice = normaliseMoney(first(params.max) ?? null);
  if (minPrice && maxPrice && compareMoney(minPrice, maxPrice) > 0) [minPrice, maxPrice] = [maxPrice, minPrice];

  return {
    q: qRaw ? qRaw.slice(0, 100) : null,
    categories: toArray(params.category).map((s) => s.toLowerCase()).filter((s) => /^[a-z0-9-]+$/.test(s)),
    types: toArray(params.type),
    gems: toArray(params.gem),
    materials: toArray(params.material),
    availability: toArray(params.availability).filter((a): a is AvailabilityValue => (AVAILABILITY_VALUES as readonly string[]).includes(a)),
    minPrice: minPrice && minPrice !== "0.00" ? minPrice : null,
    maxPrice,
    sort: SORT_OPTIONS.some((o) => o.value === sortRaw) ? (sortRaw as SortValue) : "featured",
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.min(pageRaw, 1000) : 1,
  };
}

/** Builds the Prisma `where` clause for public (published-only) catalogue queries. */
export function buildProductWhere(f: CatalogueFilters): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ status: "PUBLISHED" }];

  if (f.q) {
    const terms = f.q.split(/\s+/).filter(Boolean).slice(0, 6);
    for (const term of terms) {
      const contains = { contains: term, mode: "insensitive" as const };
      and.push({
        OR: [
          { name: contains },
          { sku: contains },
          { jewelleryType: contains },
          { material: contains },
          { shortDescription: contains },
          { tags: { has: term.toLowerCase() } },
          { categories: { some: { category: { name: contains, isActive: true } } } },
          { gemstones: { some: { type: contains } } },
        ],
      });
    }
  }
  if (f.categories.length) {
    and.push({ categories: { some: { category: { slug: { in: f.categories }, isActive: true } } } });
  }
  if (f.types.length) and.push({ jewelleryType: { in: f.types, mode: "insensitive" } });
  if (f.materials.length) and.push({ material: { in: f.materials, mode: "insensitive" } });
  if (f.gems.length) and.push({ gemstones: { some: { type: { in: f.gems, mode: "insensitive" } } } });
  if (f.availability.length) and.push({ availability: { in: f.availability } });
  if (f.minPrice || f.maxPrice) {
    and.push({
      effectivePrice: {
        ...(f.minPrice ? { gte: f.minPrice } : {}),
        ...(f.maxPrice ? { lte: f.maxPrice } : {}),
      },
    });
  }
  return { AND: and };
}

export function buildProductOrderBy(sort: SortValue): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
    case "price-asc":
      return [{ effectivePrice: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }];
    case "price-desc":
      return [{ effectivePrice: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
    default:
      return [{ isFeatured: "desc" }, { publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
  }
}

/** Serialises filters back into a query string (used for pagination links and removable chips). */
export function filtersToSearchParams(f: CatalogueFilters, overrides: Partial<CatalogueFilters> = {}): URLSearchParams {
  const m = { ...f, ...overrides };
  const sp = new URLSearchParams();
  if (m.q) sp.set("q", m.q);
  m.categories.forEach((c) => sp.append("category", c));
  m.types.forEach((c) => sp.append("type", c));
  m.gems.forEach((c) => sp.append("gem", c));
  m.materials.forEach((c) => sp.append("material", c));
  m.availability.forEach((c) => sp.append("availability", c));
  if (m.minPrice) sp.set("min", m.minPrice.replace(/\.00$/, ""));
  if (m.maxPrice) sp.set("max", m.maxPrice.replace(/\.00$/, ""));
  if (m.sort !== "featured") sp.set("sort", m.sort);
  if (m.page > 1) sp.set("page", String(m.page));
  return sp;
}

export function activeFilterCount(f: CatalogueFilters) {
  return (
    f.categories.length + f.types.length + f.gems.length + f.materials.length + f.availability.length + (f.minPrice ? 1 : 0) + (f.maxPrice ? 1 : 0)
  );
}
