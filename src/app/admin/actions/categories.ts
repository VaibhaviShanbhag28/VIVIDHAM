"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { deleteCategory, moveCategory, saveCategory, setCategoryActive } from "@/lib/services/site";
import { idSchema } from "@/lib/validation/common";

export type CategoryFormState = { ok?: boolean; errors?: Record<string, string>; message?: string };

function revalidate() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/categories");
}

export async function saveCategoryAction(_prev: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  await requireAdmin();
  const rawId = formData.get("id");
  const id = typeof rawId === "string" && rawId !== "" ? rawId : null;
  if (id && !idSchema.safeParse(id).success) return { errors: { _form: "Invalid category" } };
  const result = await saveCategory(id, {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    isActive: formData.get("isActive") === "on",
    showInNav: formData.get("showInNav") === "on",
  });
  if (!result.ok) return { errors: result.errors };
  revalidate();
  return { ok: true, message: id ? "Category updated." : "Category created." };
}

export async function moveCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  const dir = formData.get("direction");
  if (!id.success || (dir !== "up" && dir !== "down")) return;
  await moveCategory(id.data, dir);
  revalidate();
}

export async function toggleCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  await setCategoryActive(id.data, formData.get("active") === "true");
  revalidate();
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const result = await deleteCategory(id.data);
  revalidate();
  if (!result.ok) redirect(`/admin/categories?error=${encodeURIComponent(result.errors._form ?? "Could not delete")}`);
  redirect("/admin/categories?deleted=1");
}
