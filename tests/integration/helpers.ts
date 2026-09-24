export const hasDb = !!process.env.TEST_DATABASE_URL;

export async function resetDb() {
  const { prisma } = await import("@/lib/db");
  await prisma.$transaction([
    prisma.enquiry.deleteMany(),
    prisma.productCategory.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productGemstone.deleteMany(),
    prisma.productCertification.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.adminSession.deleteMany(),
    prisma.adminUser.deleteMany(),
    prisma.rateLimitBucket.deleteMany(),
    prisma.siteSettings.deleteMany(),
    prisma.contentPage.deleteMany(),
  ]);
  return prisma;
}

export const productPayload = (overrides: Record<string, unknown> = {}) => ({
  name: "Emerald Halo Ring",
  sku: "TEST-RG-001",
  description: "A step-cut emerald framed by a halo of diamonds.",
  status: "PUBLISHED",
  availability: "IN_STOCK",
  price: "185000",
  salePrice: "",
  tags: ["emerald"],
  images: [{ url: "/media/product/a.webp", storageKey: "product/a.webp", provider: "LOCAL", alt: "", isPrimary: false }],
  gemstones: [{ type: "Emerald", colour: "Green", caratWeight: "1.25" }],
  certifications: [],
  categoryIds: [],
  ...overrides,
});
