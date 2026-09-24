import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildProductOrderBy, buildProductWhere, PAGE_SIZE, type CatalogueFilters } from "./filters";

// ───────────── DTOs (plain, serialisable — Decimals become strings) ─────────────

export interface ImageDTO {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  isPrimary: boolean;
}

export interface ProductCardDTO {
  id: string;
  slug: string;
  name: string;
  sku: string;
  price: string | null;
  salePrice: string | null;
  availability: "IN_STOCK" | "MADE_TO_ORDER" | "ON_REQUEST" | "SOLD_OUT";
  isNewArrival: boolean;
  isFeatured: boolean;
  isDemo: boolean;
  jewelleryType: string | null;
  primaryImage: ImageDTO | null;
  secondaryImage: ImageDTO | null;
}

export interface GemstoneDTO {
  id: string;
  type: string;
  colour: string | null;
  cut: string | null;
  shape: string | null;
  clarity: string | null;
  caratWeight: string | null;
  count: number | null;
  origin: string | null;
  treatment: string | null;
}

export interface CertificationDTO {
  id: string;
  issuer: string;
  certificateNumber: string | null;
  reportDate: string | null;
  verificationUrl: string | null;
  fileUrl: string | null;
  fileType: string | null;
  notes: string | null;
}

export interface ProductDetailDTO extends ProductCardDTO {
  shortDescription: string | null;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  stockQuantity: number | null;
  material: string | null;
  metalPurity: string | null;
  metalColour: string | null;
  hallmarkDetails: string | null;
  grossWeightGrams: string | null;
  netWeightGrams: string | null;
  dimensions: string | null;
  size: string | null;
  otherDetails: string | null;
  careInstructions: string | null;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  images: ImageDTO[];
  gemstones: GemstoneDTO[];
  certifications: CertificationDTO[];
  categories: { id: string; name: string; slug: string }[];
  updatedAt: string;
}

const cardInclude = {
  images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }], take: 2 },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

const dec = (v: Prisma.Decimal | null) => (v === null ? null : v.toFixed(v.decimalPlaces() > 2 ? 3 : 2));
const money = (v: Prisma.Decimal | null) => (v === null ? null : v.toFixed(2));

function toImage(i: CardRow["images"][number]): ImageDTO {
  return { id: i.id, url: i.url, alt: i.alt, width: i.width, height: i.height, isPrimary: i.isPrimary };
}

export function toCard(p: CardRow): ProductCardDTO {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    price: money(p.price),
    salePrice: money(p.salePrice),
    availability: p.availability,
    isNewArrival: p.isNewArrival,
    isFeatured: p.isFeatured,
    isDemo: p.isDemo,
    jewelleryType: p.jewelleryType,
    primaryImage: p.images[0] ? toImage(p.images[0]) : null,
    secondaryImage: p.images[1] ? toImage(p.images[1]) : null,
  };
}

// ───────────── Public queries ─────────────

export async function listProducts(filters: CatalogueFilters, pageSize = PAGE_SIZE) {
  const where = buildProductWhere(filters);
  const [total, rows] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: cardInclude,
      orderBy: buildProductOrderBy(filters.sort),
      skip: (filters.page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { total, pageCount: Math.max(1, Math.ceil(total / pageSize)), items: rows.map(toCard) };
}

export async function getCatalogueFacets() {
  const published = { status: "PUBLISHED" } as const;
  const [categories, types, materials, gems, priceAgg] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, _count: { select: { products: { where: { product: published } } } } },
    }),
    prisma.product.groupBy({ by: ["jewelleryType"], where: { ...published, jewelleryType: { not: null } }, _count: true, orderBy: { jewelleryType: "asc" } }),
    prisma.product.groupBy({ by: ["material"], where: { ...published, material: { not: null } }, _count: true, orderBy: { material: "asc" } }),
    prisma.productGemstone.groupBy({ by: ["type"], where: { product: published }, _count: true, orderBy: { type: "asc" } }),
    prisma.product.aggregate({ where: published, _min: { effectivePrice: true }, _max: { effectivePrice: true } }),
  ]);
  return {
    categories: categories.map((c) => ({ name: c.name, slug: c.slug, count: c._count.products })),
    types: types.map((t) => ({ value: t.jewelleryType as string, count: t._count })),
    materials: materials.map((m) => ({ value: m.material as string, count: m._count })),
    gems: gems.map((g) => ({ value: g.type, count: g._count })),
    priceRange: { min: money(priceAgg._min.effectivePrice), max: money(priceAgg._max.effectivePrice) },
  };
}

export async function getHomeCollections() {
  const published = { status: "PUBLISHED" } as const;
  const [featured, newArrivals, gemstoneProducts] = await Promise.all([
    prisma.product.findMany({ where: { ...published, isFeatured: true }, include: cardInclude, orderBy: [{ publishedAt: "desc" }], take: 8 }),
    prisma.product.findMany({ where: { ...published, isNewArrival: true }, include: cardInclude, orderBy: [{ publishedAt: "desc" }], take: 8 }),
    prisma.product.findMany({
      where: { ...published, OR: [{ categories: { some: { category: { slug: "gemstones" } } } }, { jewelleryType: { equals: "Loose Gemstone", mode: "insensitive" } }] },
      include: cardInclude,
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      take: 4,
    }),
  ]);
  return { featured: featured.map(toCard), newArrivals: newArrivals.map(toCard), gemstones: gemstoneProducts.map(toCard) };
}

export async function getNavCategories() {
  return prisma.category.findMany({
    where: { isActive: true, showInNav: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, description: true, imageUrl: true },
  });
}

export async function getFeaturedCategories(limit = 8) {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    take: limit,
    select: { id: true, name: true, slug: true, description: true, imageUrl: true },
  });
}

const detailInclude = {
  images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }] },
  gemstones: { orderBy: { position: "asc" } },
  certifications: { orderBy: { createdAt: "asc" } },
  categories: { include: { category: { select: { id: true, name: true, slug: true, isActive: true } } } },
} satisfies Prisma.ProductInclude;

type DetailRow = Prisma.ProductGetPayload<{ include: typeof detailInclude }>;

function toDetail(p: DetailRow): ProductDetailDTO {
  return {
    ...toCard({ ...p, images: p.images.slice(0, 2) }),
    shortDescription: p.shortDescription,
    description: p.description,
    status: p.status,
    stockQuantity: p.stockQuantity,
    material: p.material,
    metalPurity: p.metalPurity,
    metalColour: p.metalColour,
    hallmarkDetails: p.hallmarkDetails,
    grossWeightGrams: dec(p.grossWeightGrams),
    netWeightGrams: dec(p.netWeightGrams),
    dimensions: p.dimensions,
    size: p.size,
    otherDetails: p.otherDetails,
    careInstructions: p.careInstructions,
    tags: p.tags,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    images: p.images.map(toImage),
    gemstones: p.gemstones.map((g) => ({
      id: g.id,
      type: g.type,
      colour: g.colour,
      cut: g.cut,
      shape: g.shape,
      clarity: g.clarity,
      caratWeight: dec(g.caratWeight),
      count: g.count,
      origin: g.origin,
      treatment: g.treatment,
    })),
    certifications: p.certifications.map((c) => ({
      id: c.id,
      issuer: c.issuer,
      certificateNumber: c.certificateNumber,
      reportDate: c.reportDate ? c.reportDate.toISOString().slice(0, 10) : null,
      verificationUrl: c.verificationUrl,
      fileUrl: c.fileUrl,
      fileType: c.fileType,
      notes: c.notes,
    })),
    categories: p.categories.filter((c) => c.category.isActive).map((c) => ({ id: c.category.id, name: c.category.name, slug: c.category.slug })),
    updatedAt: p.updatedAt.toISOString(),
  };
}

/** Published product by slug (public storefront). */
export async function getPublishedProduct(slug: string) {
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) return null;
  const p = await prisma.product.findFirst({ where: { slug, status: "PUBLISHED" }, include: detailInclude });
  return p ? toDetail(p) : null;
}

/** Any product by id regardless of status — admin preview only. */
export async function getProductForPreview(id: string) {
  const p = await prisma.product.findUnique({ where: { id }, include: detailInclude });
  return p ? toDetail(p) : null;
}

export async function getRelatedProducts(product: Pick<ProductDetailDTO, "id" | "categories" | "jewelleryType">, limit = 4) {
  const categoryIds = product.categories.map((c) => c.id);
  const rows = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: product.id },
      OR: [
        ...(categoryIds.length ? [{ categories: { some: { categoryId: { in: categoryIds } } } }] : []),
        ...(product.jewelleryType ? [{ jewelleryType: product.jewelleryType }] : []),
      ],
    },
    include: cardInclude,
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });
  if (rows.length >= limit || (categoryIds.length === 0 && !product.jewelleryType)) return rows.map(toCard);
  const extra = await prisma.product.findMany({
    where: { status: "PUBLISHED", id: { notIn: [product.id, ...rows.map((r) => r.id)] } },
    include: cardInclude,
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: limit - rows.length,
  });
  return [...rows, ...extra].map(toCard);
}

export async function getContentPage(slug: string) {
  return prisma.contentPage.findUnique({ where: { slug } });
}
