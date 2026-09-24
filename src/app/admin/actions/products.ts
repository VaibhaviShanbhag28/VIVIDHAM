"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { changeProductStatus, createProduct, deleteProduct, updateProduct } from "@/lib/services/products";
import { idSchema } from "@/lib/validation/common";
import { productStatusChange } from "@/lib/validation/product";

export type SaveProductResult = { ok: true; id: string; slug: string } | { ok: false; errors: Record<string, string> };

function revalidateCatalogue(slug?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
  if (slug) revalidatePath(`/product/${slug}`);
}

export async function saveProductAction(id: string | null, values: unknown): Promise<SaveProductResult> {
  await requireAdmin();
  if (id !== null && !idSchema.safeParse(id).success) return { ok: false, errors: { _form: "Invalid product id" } };
  const result = id ? await updateProduct(id, values) : await createProduct(values);
  if (!result.ok) return result;
  revalidateCatalogue(result.data.slug);
  return { ok: true, ...result.data };
}

export async function productStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = productStatusChange.safeParse({ id: formData.get("id"), action: formData.get("action") });
  if (!parsed.success) return;
  await changeProductStatus(parsed.data.id, parsed.data.action);
  revalidateCatalogue();
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  await deleteProduct(id.data);
  revalidateCatalogue();
  redirect("/admin/products?deleted=1");
}
