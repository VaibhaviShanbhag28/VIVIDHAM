"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { SETTINGS_TAG } from "@/lib/settings";
import { saveContentPage, updateSiteSettings } from "@/lib/services/site";

export type SettingsResult = { ok: true } | { ok: false; errors: Record<string, string> };

export async function saveSettingsAction(values: unknown): Promise<SettingsResult> {
  await requireAdmin();
  const result = await updateSiteSettings(values);
  if (!result.ok) return result;
  revalidateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}

export type ContentState = { ok?: boolean; errors?: Record<string, string> };

export async function saveContentPageAction(_prev: ContentState, formData: FormData): Promise<ContentState> {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  const result = await saveContentPage({
    slug,
    title: formData.get("title"),
    summary: formData.get("summary"),
    body: formData.get("body"),
    isApproved: formData.get("isApproved") === "on",
  });
  if (!result.ok) return { errors: result.errors };
  revalidatePath(slug === "about" ? "/about" : `/policies/${slug}`);
  revalidatePath("/admin/content");
  return { ok: true };
}
