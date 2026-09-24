"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createManualEnquiry, deleteEnquiry, updateEnquiry } from "@/lib/services/enquiries";
import { idSchema } from "@/lib/validation/common";

export type EnquiryAdminState = { ok?: boolean; errors?: Record<string, string> };

export async function updateEnquiryAction(_prev: EnquiryAdminState, formData: FormData): Promise<EnquiryAdminState> {
  await requireAdmin();
  const result = await updateEnquiry({ id: formData.get("id"), status: formData.get("status"), adminNotes: formData.get("adminNotes") });
  if (!result.ok) return { errors: result.errors };
  revalidatePath("/admin/enquiries");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}

export async function createManualEnquiryAction(_prev: EnquiryAdminState, formData: FormData): Promise<EnquiryAdminState> {
  await requireAdmin();
  const result = await createManualEnquiry({
    channel: formData.get("channel"),
    customerName: formData.get("customerName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    adminNotes: formData.get("adminNotes"),
  });
  if (!result.ok) return { errors: result.errors };
  revalidatePath("/admin/enquiries");
  redirect(`/admin/enquiries/${result.data.id}?created=1`);
}

export async function deleteEnquiryAction(formData: FormData) {
  await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  await deleteEnquiry(id.data);
  revalidatePath("/admin/enquiries");
  redirect("/admin/enquiries?deleted=1");
}
