import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isTrustedMediaUrl } from "@/lib/uploads/storage";
import { slugify } from "@/lib/utils";
import { fieldErrors } from "@/lib/validation/common";
import { categoryInput, contentPageInput, siteSettingsInput } from "@/lib/validation/settings";
import type { ServiceResult } from "./products";

// ───────────── Site settings ─────────────

export async function updateSiteSettings(raw: unknown): Promise<ServiceResult> {
  const parsed = siteSettingsInput.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const v = parsed.data;
  const errors: Record<string, string> = {};
  for (const key of ["logoUrl", "heroImageUrl"] as const) {
    const url = v[key];
    if (url && url.startsWith("/") && !isTrustedMediaUrl(url)) errors[key] = "Please upload the image using the uploader";
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  const data = { ...v, trustHighlights: v.trustHighlights as Prisma.InputJsonArray };
  await prisma.siteSettings.upsert({ where: { id: "default" }, create: { id: "default", ...data }, update: data });
  return { ok: true, data: undefined };
}

// ───────────── Content pages (policies, about) ─────────────

export async function saveContentPage(raw: unknown): Promise<ServiceResult> {
  const parsed = contentPageInput.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { slug, ...rest } = parsed.data;
  await prisma.contentPage.upsert({ where: { slug }, create: { slug, ...rest }, update: rest });
  return { ok: true, data: undefined };
}

// ───────────── Categories ─────────────

async function uniqueCategorySlug(base: string, excludeId?: string) {
  const root = base || "category";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const existing = await prisma.category.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function saveCategory(id: string | null, raw: unknown): Promise<ServiceResult<{ id: string }>> {
  const parsed = categoryInput.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const v = parsed.data;
  if (v.imageUrl && v.imageUrl.startsWith("/") && !isTrustedMediaUrl(v.imageUrl)) {
    return { ok: false, errors: { imageUrl: "Please upload the image using the uploader" } };
  }
  if (id) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return { ok: false, errors: { _form: "Category not found" } };
    const slug = v.slug && v.slug !== existing.slug ? await uniqueCategorySlug(v.slug, id) : existing.slug;
    await prisma.category.update({ where: { id }, data: { ...v, slug } });
    return { ok: true, data: { id } };
  }
  const slug = await uniqueCategorySlug(v.slug ?? slugify(v.name));
  const max = await prisma.category.aggregate({ _max: { position: true } });
  const created = await prisma.category.create({ data: { ...v, slug, position: (max._max.position ?? 0) + 1 }, select: { id: true } });
  return { ok: true, data: created };
}

export async function moveCategory(id: string, direction: "up" | "down") {
  const all = await prisma.category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true } });
  const index = all.findIndex((c) => c.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= all.length) return false;
  const reordered = [...all];
  [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
  await prisma.$transaction(reordered.map((c, position) => prisma.category.update({ where: { id: c.id }, data: { position } })));
  return true;
}

export async function setCategoryActive(id: string, isActive: boolean) {
  const res = await prisma.category.updateMany({ where: { id }, data: { isActive } });
  return res.count > 0;
}

/** Deletes a category only when no products use it; otherwise it should be deactivated instead. */
export async function deleteCategory(id: string): Promise<ServiceResult> {
  const count = await prisma.productCategory.count({ where: { categoryId: id } });
  if (count > 0) return { ok: false, errors: { _form: `This category is used by ${count} product(s). Deactivate it instead, or remove it from those products first.` } };
  await prisma.category.deleteMany({ where: { id } });
  return { ok: true, data: undefined };
}
