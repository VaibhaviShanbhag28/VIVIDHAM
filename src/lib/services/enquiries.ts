import "server-only";
import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { fieldErrors } from "@/lib/validation/common";
import { enquiryUpdateInput, manualEnquiryInput, publicEnquiryInput } from "@/lib/validation/enquiry";
import type { ServiceResult } from "./products";

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

/** Human-friendly reference such as "VJ-260924-7KQ4M". */
export function generateEnquiryReference(now = new Date()) {
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
  let suffix = "";
  for (let i = 0; i < 5; i++) suffix += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  return `VJ-${ymd}-${suffix}`;
}

async function productSnapshot(productId: string | null, publishedOnly: boolean) {
  if (!productId) return { productId: null, snapshot: undefined };
  const p = await prisma.product.findFirst({
    where: { id: productId, ...(publishedOnly ? { status: "PUBLISHED" as const } : {}) },
    select: { id: true, name: true, sku: true, slug: true, price: true, salePrice: true },
  });
  if (!p) return { productId: null, snapshot: undefined };
  const displayed = p.salePrice ?? p.price;
  return {
    productId: p.id,
    snapshot: {
      name: p.name,
      sku: p.sku,
      slug: p.slug,
      displayedPrice: displayed ? formatINR(displayed.toFixed(2)) : "Price on request",
    } satisfies Prisma.InputJsonObject,
  };
}

async function createWithUniqueReference(data: Omit<Prisma.EnquiryUncheckedCreateInput, "reference">) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.enquiry.create({ data: { ...data, reference: generateEnquiryReference() }, select: { id: true, reference: true } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  throw new Error("Could not allocate an enquiry reference");
}

/** Public website enquiry (contact form / product enquiry form). Caller handles rate limiting & spam checks. */
export async function submitPublicEnquiry(raw: unknown): Promise<ServiceResult<{ reference: string }>> {
  const parsed = publicEnquiryInput.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const { productId, snapshot } = await productSnapshot(v.productId, true);
  const created = await createWithUniqueReference({
    channel: "WEBSITE_FORM",
    status: "NEW",
    productId,
    productSnapshot: snapshot,
    quantity: productId ? (v.quantity ?? 1) : null,
    customerName: v.customerName,
    email: v.email,
    phone: v.phone,
    message: v.message,
    consentGiven: true,
  });
  return { ok: true, data: { reference: created.reference } };
}

/** Admin records an enquiry that arrived outside the website (WhatsApp, phone, in store). */
export async function createManualEnquiry(raw: unknown): Promise<ServiceResult<{ id: string; reference: string }>> {
  const parsed = manualEnquiryInput.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const { productId, snapshot } = await productSnapshot(v.productId, false);
  const created = await createWithUniqueReference({
    channel: v.channel,
    status: "NEW",
    productId,
    productSnapshot: snapshot,
    quantity: v.quantity,
    customerName: v.customerName,
    email: v.email,
    phone: v.phone,
    message: v.message,
    adminNotes: v.adminNotes,
    consentGiven: false,
  });
  return { ok: true, data: created };
}

export async function updateEnquiry(raw: unknown): Promise<ServiceResult> {
  const parsed = enquiryUpdateInput.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { id, status, adminNotes } = parsed.data;
  const res = await prisma.enquiry.updateMany({ where: { id }, data: { status, adminNotes } });
  if (res.count === 0) return { ok: false, errors: { _form: "Enquiry not found" } };
  return { ok: true, data: undefined };
}

export async function deleteEnquiry(id: string) {
  const res = await prisma.enquiry.deleteMany({ where: { id } });
  return res.count > 0;
}

export async function listEnquiries(opts: { q?: string | null; status?: string | null; channel?: string | null; page: number; pageSize?: number }) {
  const pageSize = opts.pageSize ?? 25;
  const where: Prisma.EnquiryWhereInput = {};
  if (opts.status && ["NEW", "CONTACTED", "IN_DISCUSSION", "CLOSED"].includes(opts.status)) where.status = opts.status as "NEW";
  if (opts.channel && ["WEBSITE_FORM", "WHATSAPP_MANUAL", "PHONE_MANUAL", "IN_STORE_MANUAL", "OTHER_MANUAL"].includes(opts.channel)) {
    where.channel = opts.channel as "WEBSITE_FORM";
  }
  if (opts.q) {
    const contains = { contains: opts.q, mode: "insensitive" as const };
    where.OR = [
      { reference: contains },
      { customerName: contains },
      { email: contains },
      { phone: { contains: opts.q.replace(/[^\d+]/g, "") || opts.q } },
      { message: contains },
      { product: { OR: [{ name: contains }, { sku: contains }] } },
    ];
  }
  const [total, items] = await prisma.$transaction([
    prisma.enquiry.count({ where }),
    prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * pageSize,
      take: pageSize,
      include: { product: { select: { id: true, name: true, sku: true } } },
    }),
  ]);
  return { total, pageCount: Math.max(1, Math.ceil(total / pageSize)), items };
}
