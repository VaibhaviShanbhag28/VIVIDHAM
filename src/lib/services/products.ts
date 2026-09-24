import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { deleteStoredFile, isTrustedMediaUrl } from "@/lib/uploads/storage";
import { slugify } from "@/lib/utils";
import { productInput, type ProductInput } from "@/lib/validation/product";
import { fieldErrors } from "@/lib/validation/common";

export type ServiceResult<T = undefined> = { ok: true; data: T } | { ok: false; errors: Record<string, string> };

async function uniqueSlug(base: string, excludeId?: string) {
  const root = base || "product";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const existing = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

function checkReferences(input: ProductInput): Record<string, string> {
  const errors: Record<string, string> = {};
  input.images.forEach((img, i) => {
    if (!isTrustedMediaUrl(img.url)) errors[`images.${i}`] = "Image must be uploaded through the admin uploader";
  });
  input.certifications.forEach((c, i) => {
    if (c.fileUrl && !isTrustedMediaUrl(c.fileUrl)) errors[`certifications.${i}.fileUrl`] = "Certificate file must be uploaded through the admin uploader";
  });
  return errors;
}

function productData(input: ProductInput) {
  return {
    name: input.name,
    sku: input.sku,
    shortDescription: input.shortDescription,
    description: input.description,
    status: input.status,
    availability: input.availability,
    stockQuantity: input.availability === "SOLD_OUT" ? 0 : input.stockQuantity,
    price: input.price,
    salePrice: input.salePrice,
    effectivePrice: input.salePrice ?? input.price,
    jewelleryType: input.jewelleryType,
    material: input.material,
    metalPurity: input.metalPurity,
    metalColour: input.metalColour,
    hallmarkDetails: input.hallmarkDetails,
    grossWeightGrams: input.grossWeightGrams,
    netWeightGrams: input.netWeightGrams,
    dimensions: input.dimensions,
    size: input.size,
    otherDetails: input.otherDetails,
    careInstructions: input.careInstructions,
    tags: input.tags,
    isFeatured: input.isFeatured,
    isNewArrival: input.isNewArrival,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
  } satisfies Prisma.ProductUncheckedUpdateInput;
}

function imageRows(input: ProductInput) {
  const primaryIndex = Math.max(0, input.images.findIndex((i) => i.isPrimary));
  return input.images.map((img, position) => ({
    url: img.url,
    storageKey: img.storageKey,
    provider: img.provider,
    alt: img.alt ?? input.name,
    width: img.width ?? null,
    height: img.height ?? null,
    position,
    isPrimary: position === primaryIndex,
  }));
}

function gemstoneRows(input: ProductInput) {
  return input.gemstones.map((g, position) => ({ ...g, position }));
}

function certificationRows(input: ProductInput) {
  return input.certifications.map((c) => ({
    issuer: c.issuer,
    certificateNumber: c.certificateNumber,
    reportDate: c.reportDate ? new Date(`${c.reportDate}T00:00:00Z`) : null,
    verificationUrl: c.verificationUrl,
    fileUrl: c.fileUrl,
    fileKey: c.fileKey,
    fileProvider: c.fileUrl ? (c.fileProvider ?? null) : null,
    fileType: c.fileType,
    notes: c.notes,
  }));
}

function mapUniqueError(e: unknown): Record<string, string> | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    const target = String((e.meta as { target?: string[] | string } | undefined)?.target ?? "");
    if (target.includes("sku")) return { sku: "Another product already uses this SKU" };
    if (target.includes("slug")) return { slug: "Another product already uses this URL slug" };
    return { _form: "A product with these details already exists" };
  }
  return null;
}

async function validCategoryIds(ids: string[]) {
  if (!ids.length) return [];
  const found = await prisma.category.findMany({ where: { id: { in: ids } }, select: { id: true } });
  return found.map((c) => c.id);
}

export async function createProduct(raw: unknown): Promise<ServiceResult<{ id: string; slug: string }>> {
  const parsed = productInput.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const input = parsed.data;
  const refErrors = checkReferences(input);
  if (Object.keys(refErrors).length) return { ok: false, errors: refErrors };

  const slug = await uniqueSlug(input.slug ?? slugify(input.name));
  const categoryIds = await validCategoryIds(input.categoryIds);
  try {
    const product = await prisma.product.create({
      data: {
        ...productData(input),
        slug,
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
        images: { create: imageRows(input) },
        gemstones: { create: gemstoneRows(input) },
        certifications: { create: certificationRows(input) },
        categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
      },
      select: { id: true, slug: true },
    });
    return { ok: true, data: product };
  } catch (e) {
    const mapped = mapUniqueError(e);
    if (mapped) return { ok: false, errors: mapped };
    throw e;
  }
}

export async function updateProduct(id: string, raw: unknown): Promise<ServiceResult<{ id: string; slug: string }>> {
  const parsed = productInput.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const input = parsed.data;
  const refErrors = checkReferences(input);
  if (Object.keys(refErrors).length) return { ok: false, errors: refErrors };

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { images: true, certifications: true },
  });
  if (!existing) return { ok: false, errors: { _form: "Product not found" } };

  const slug = input.slug && input.slug !== existing.slug ? await uniqueSlug(input.slug, id) : existing.slug;
  const categoryIds = await validCategoryIds(input.categoryIds);
  const newImages = imageRows(input);
  const newCerts = certificationRows(input);

  try {
    const product = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productGemstone.deleteMany({ where: { productId: id } });
      await tx.productCertification.deleteMany({ where: { productId: id } });
      await tx.productCategory.deleteMany({ where: { productId: id } });
      return tx.product.update({
        where: { id },
        data: {
          ...productData(input),
          slug,
          publishedAt: input.status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
          images: { create: newImages },
          gemstones: { create: gemstoneRows(input) },
          certifications: { create: newCerts },
          categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
        },
        select: { id: true, slug: true },
      });
    });

    // Remove files that are no longer referenced (best effort, after commit).
    const keptImageKeys = new Set(newImages.map((i) => i.storageKey).filter(Boolean));
    const keptCertKeys = new Set(newCerts.map((c) => c.fileKey).filter(Boolean));
    await Promise.all([
      ...existing.images.filter((i) => i.storageKey && !keptImageKeys.has(i.storageKey)).map((i) => deleteStoredFile(i.provider, i.storageKey)),
      ...existing.certifications.filter((c) => c.fileKey && !keptCertKeys.has(c.fileKey)).map((c) => deleteStoredFile(c.fileProvider, c.fileKey)),
    ]);
    return { ok: true, data: product };
  } catch (e) {
    const mapped = mapUniqueError(e);
    if (mapped) return { ok: false, errors: mapped };
    throw e;
  }
}

export async function deleteProduct(id: string) {
  const existing = await prisma.product.findUnique({ where: { id }, include: { images: true, certifications: true } });
  if (!existing) return false;
  await prisma.product.delete({ where: { id } });
  await Promise.all([
    ...existing.images.map((i) => deleteStoredFile(i.provider, i.storageKey)),
    ...existing.certifications.map((c) => deleteStoredFile(c.fileProvider, c.fileKey)),
  ]);
  return true;
}

export type StatusAction = "publish" | "unpublish" | "archive" | "mark-sold-out" | "mark-in-stock";

export async function changeProductStatus(id: string, action: StatusAction) {
  const existing = await prisma.product.findUnique({ where: { id }, select: { publishedAt: true } });
  if (!existing) return false;
  const data: Prisma.ProductUpdateInput =
    action === "publish"
      ? { status: "PUBLISHED", publishedAt: existing.publishedAt ?? new Date() }
      : action === "unpublish"
        ? { status: "DRAFT" }
        : action === "archive"
          ? { status: "ARCHIVED" }
          : action === "mark-sold-out"
            ? { availability: "SOLD_OUT", stockQuantity: 0 }
            : { availability: "IN_STOCK" };
  await prisma.product.update({ where: { id }, data });
  return true;
}

/** Full product (Decimals as strings) for the admin edit form. */
export async function getProductForEdit(id: string) {
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      gemstones: { orderBy: { position: "asc" } },
      certifications: { orderBy: { createdAt: "asc" } },
      categories: { select: { categoryId: true } },
    },
  });
  if (!p) return null;
  // "12.500" → "12.5", "10.000" → "10"
  const s = (d: Prisma.Decimal | null, places: number) => (d === null ? "" : d.toFixed(places).replace(/\.?0+$/, ""));
  return {
    id: p.id,
    slug: p.slug,
    isDemo: p.isDemo,
    values: {
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      shortDescription: p.shortDescription ?? "",
      description: p.description,
      status: p.status,
      availability: p.availability,
      stockQuantity: p.stockQuantity === null ? "" : String(p.stockQuantity),
      price: p.price === null ? "" : p.price.toFixed(2).replace(/\.00$/, ""),
      salePrice: p.salePrice === null ? "" : p.salePrice.toFixed(2).replace(/\.00$/, ""),
      jewelleryType: p.jewelleryType ?? "",
      material: p.material ?? "",
      metalPurity: p.metalPurity ?? "",
      metalColour: p.metalColour ?? "",
      hallmarkDetails: p.hallmarkDetails ?? "",
      grossWeightGrams: s(p.grossWeightGrams, 3),
      netWeightGrams: s(p.netWeightGrams, 3),
      dimensions: p.dimensions ?? "",
      size: p.size ?? "",
      otherDetails: p.otherDetails ?? "",
      careInstructions: p.careInstructions ?? "",
      tags: p.tags,
      isFeatured: p.isFeatured,
      isNewArrival: p.isNewArrival,
      seoTitle: p.seoTitle ?? "",
      seoDescription: p.seoDescription ?? "",
      categoryIds: p.categories.map((c) => c.categoryId),
      images: p.images.map((i) => ({
        url: i.url,
        storageKey: i.storageKey,
        provider: i.provider,
        alt: i.alt ?? "",
        width: i.width,
        height: i.height,
        isPrimary: i.isPrimary,
      })),
      gemstones: p.gemstones.map((g) => ({
        type: g.type,
        colour: g.colour ?? "",
        cut: g.cut ?? "",
        shape: g.shape ?? "",
        clarity: g.clarity ?? "",
        caratWeight: s(g.caratWeight, 3),
        count: g.count === null ? "" : String(g.count),
        origin: g.origin ?? "",
        treatment: g.treatment ?? "",
      })),
      certifications: p.certifications.map((c) => ({
        issuer: c.issuer,
        certificateNumber: c.certificateNumber ?? "",
        reportDate: c.reportDate ? c.reportDate.toISOString().slice(0, 10) : "",
        verificationUrl: c.verificationUrl ?? "",
        fileUrl: c.fileUrl,
        fileKey: c.fileKey,
        fileProvider: c.fileProvider,
        fileType: c.fileType,
        notes: c.notes ?? "",
      })),
    },
  };
}

export type ProductEditData = NonNullable<Awaited<ReturnType<typeof getProductForEdit>>>;

export async function listAdminProducts(opts: { q?: string | null; status?: string | null; page: number; pageSize?: number }) {
  const pageSize = opts.pageSize ?? 20;
  const where: Prisma.ProductWhereInput = {};
  if (opts.status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(opts.status)) where.status = opts.status as "DRAFT";
  if (opts.status === "SOLD_OUT") where.availability = "SOLD_OUT";
  if (opts.q) {
    where.OR = [
      { name: { contains: opts.q, mode: "insensitive" } },
      { sku: { contains: opts.q, mode: "insensitive" } },
    ];
  }
  const [total, rows] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (opts.page - 1) * pageSize,
      take: pageSize,
      include: { images: { where: { isPrimary: true }, take: 1 }, _count: { select: { enquiries: true } } },
    }),
  ]);
  return {
    total,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    items: rows.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      slug: p.slug,
      status: p.status,
      availability: p.availability,
      price: p.price?.toFixed(2) ?? null,
      salePrice: p.salePrice?.toFixed(2) ?? null,
      isFeatured: p.isFeatured,
      isNewArrival: p.isNewArrival,
      isDemo: p.isDemo,
      image: p.images[0]?.url ?? null,
      enquiries: p._count.enquiries,
      updatedAt: p.updatedAt.toISOString(),
    })),
  };
}
