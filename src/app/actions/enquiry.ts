"use server";

import { revalidatePath } from "next/cache";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { dbRateLimitStore } from "@/lib/rate-limit-db";
import { clientFingerprint } from "@/lib/request";
import { submitPublicEnquiry } from "@/lib/services/enquiries";

export type EnquiryFormState =
  | { status: "idle" }
  | { status: "success"; reference: string | null }
  | { status: "error"; message: string; errors?: Record<string, string>; values?: Record<string, string> };

const MIN_FILL_MS = 3000;
const MAX_FILL_MS = 24 * 60 * 60 * 1000;

export async function submitEnquiryAction(_prev: EnquiryFormState, formData: FormData): Promise<EnquiryFormState> {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : "";
  };
  const values = {
    customerName: get("customerName"),
    email: get("email"),
    phone: get("phone"),
    message: get("message"),
    productId: get("productId"),
    quantity: get("quantity"),
  };

  // Honeypot: real visitors never see or fill this field. Pretend success so bots learn nothing.
  if (get("website").trim() !== "") return { status: "success", reference: null };

  const startedAt = Number(get("startedAt"));
  const elapsed = Date.now() - startedAt;
  if (!Number.isFinite(startedAt) || elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS) {
    return { status: "error", message: "Please take a moment to review your message and submit again.", values };
  }

  const limit = await rateLimit(dbRateLimitStore, `enquiry:${await clientFingerprint()}`, LIMITS.enquiryPerIp);
  if (!limit.allowed) {
    return { status: "error", message: `You have sent several enquiries recently. Please try again in about ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s), or contact us on WhatsApp.`, values };
  }

  try {
    const result = await submitPublicEnquiry({ ...values, consent: get("consent") });
    if (!result.ok) {
      return { status: "error", message: "Please check the highlighted fields.", errors: result.errors, values };
    }
    revalidatePath("/admin/enquiries");
    return { status: "success", reference: result.data.reference };
  } catch (e) {
    console.error("[enquiry] submission failed", e instanceof Error ? e.message : "unknown error");
    return { status: "error", message: "Sorry — we couldn't send your enquiry right now. Please try again or contact us on WhatsApp.", values };
  }
}
