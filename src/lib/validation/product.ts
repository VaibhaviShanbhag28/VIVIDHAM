import { z } from "zod";
import { compareMoney } from "@/lib/money";
import {
  idSchema,
  optionalDecimal3,
  optionalHttpsUrl,
  optionalInt,
  optionalMoney,
  optionalText,
  requiredText,
} from "./common";

export const PRODUCT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const AVAILABILITIES = ["IN_STOCK", "MADE_TO_ORDER", "ON_REQUEST", "SOLD_OUT"] as const;
export const STORAGE_PROVIDERS = ["STATIC", "LOCAL", "CLOUDINARY"] as const;

export const productImageInput = z.object({
  url: z.string().min(1).max(600),
  storageKey: optionalText(300),
  provider: z.enum(STORAGE_PROVIDERS),
  alt: optionalText(200, "Alt text"),
  width: z.number().int().positive().max(20000).nullable().optional(),
  height: z.number().int().positive().max(20000).nullable().optional(),
  isPrimary: z.boolean().default(false),
});

export const gemstoneInput = z.object({
  type: requiredText(2, 60, "Gemstone type"),
  colour: optionalText(60, "Colour"),
  cut: optionalText(60, "Cut"),
  shape: optionalText(60, "Shape"),
  clarity: optionalText(60, "Clarity"),
  caratWeight: optionalDecimal3("Carat weight"),
  count: optionalInt("Stone count", 1, 10000),
  origin: optionalText(80, "Origin"),
  treatment: optionalText(120, "Treatment"),
});

export const certificationInput = z.object({
  issuer: requiredText(2, 120, "Certificate issuer"),
  certificateNumber: optionalText(80, "Certificate number"),
  reportDate: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker (YYYY-MM-DD)").nullable(),
  ),
  verificationUrl: optionalHttpsUrl("Verification link"),
  fileUrl: optionalText(600),
  fileKey: optionalText(300),
  fileProvider: z.enum(STORAGE_PROVIDERS).nullable().optional(),
  fileType: optionalText(40),
  notes: optionalText(500, "Notes"),
});

export const productInput = z
  .object({
    name: requiredText(2, 160, "Product name"),
    slug: z.preprocess(
      (v) => (typeof v === "string" ? (v.trim() === "" ? null : v.trim().toLowerCase()) : null),
      z
        .string()
        .max(160)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may contain lowercase letters, numbers and hyphens only")
        .nullable(),
    ),
    sku: z.preprocess(
      (v) => (typeof v === "string" ? v.trim().toUpperCase() : v),
      z
        .string({ error: "SKU is required" })
        .min(2, "SKU is required")
        .max(64, "SKU must be 64 characters or fewer")
        .regex(/^[A-Z0-9][A-Z0-9\-_/.]*$/, "SKU may contain letters, numbers, - _ / and . only"),
    ),
    shortDescription: optionalText(300, "Short description"),
    description: requiredText(10, 10000, "Description"),
    status: z.enum(PRODUCT_STATUSES),
    availability: z.enum(AVAILABILITIES),
    stockQuantity: optionalInt("Stock quantity", 0, 100000),
    price: optionalMoney("Price"),
    salePrice: optionalMoney("Sale price"),
    jewelleryType: optionalText(80, "Jewellery type"),
    material: optionalText(80, "Material"),
    metalPurity: optionalText(40, "Metal purity"),
    metalColour: optionalText(40, "Metal colour"),
    hallmarkDetails: optionalText(200, "Hallmark details"),
    grossWeightGrams: optionalDecimal3("Gross weight"),
    netWeightGrams: optionalDecimal3("Net weight"),
    dimensions: optionalText(120, "Dimensions"),
    size: optionalText(80, "Size"),
    otherDetails: optionalText(4000, "Other details"),
    careInstructions: optionalText(4000, "Care instructions"),
    tags: z
      .array(z.string().trim().min(1).max(40))
      .max(30, "Up to 30 tags")
      .default([])
      .transform((tags) => Array.from(new Set(tags.map((t) => t.toLowerCase())))),
    isFeatured: z.boolean().default(false),
    isNewArrival: z.boolean().default(false),
    seoTitle: optionalText(70, "SEO title"),
    seoDescription: optionalText(160, "SEO description"),
    categoryIds: z.array(idSchema).max(20).default([]),
    images: z.array(productImageInput).max(20, "Up to 20 images per product").default([]),
    gemstones: z.array(gemstoneInput).max(20).default([]),
    certifications: z.array(certificationInput).max(10).default([]),
  })
  .superRefine((p, ctx) => {
    // Field-level issues (e.g. a malformed amount) may already exist; only compare well-formed values.
    const isMoney = (v: unknown): v is string => typeof v === "string" && /^\d+\.\d{2}$/.test(v);
    const price = isMoney(p.price) ? p.price : null;
    const sale = isMoney(p.salePrice) ? p.salePrice : null;
    if (price !== null && compareMoney(price, "0") <= 0) {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Price must be greater than zero, or leave it empty for “price on request”" });
    }
    if (sale !== null) {
      if (p.price === null) {
        ctx.addIssue({ code: "custom", path: ["salePrice"], message: "Set the regular price before adding a sale price" });
      } else if (price === null) {
        // regular price is invalid — its own error is already reported
      } else if (compareMoney(sale, price) >= 0) {
        ctx.addIssue({ code: "custom", path: ["salePrice"], message: "Sale price must be lower than the regular price" });
      } else if (compareMoney(sale, "0") <= 0) {
        ctx.addIssue({ code: "custom", path: ["salePrice"], message: "Sale price must be greater than zero" });
      }
    }
    if (Array.isArray(p.images) && p.images.filter((i) => i?.isPrimary).length > 1) {
      ctx.addIssue({ code: "custom", path: ["images"], message: "Only one image can be the primary image" });
    }
    if (p.availability === "SOLD_OUT" && p.stockQuantity !== null && p.stockQuantity > 0) {
      ctx.addIssue({ code: "custom", path: ["stockQuantity"], message: "A sold-out product cannot have stock remaining" });
    }
  });

export type ProductInput = z.infer<typeof productInput>;
export type ProductFormValues = z.input<typeof productInput>;

export const productStatusChange = z.object({
  id: idSchema,
  action: z.enum(["publish", "unpublish", "archive", "mark-sold-out", "mark-in-stock"]),
});
