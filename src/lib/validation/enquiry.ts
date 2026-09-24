import { z } from "zod";
import { idSchema, optionalEmail, optionalInt, optionalPhone, optionalText, requiredText } from "./common";

export const ENQUIRY_STATUSES = ["NEW", "CONTACTED", "IN_DISCUSSION", "CLOSED"] as const;
export const MANUAL_CHANNELS = ["WHATSAPP_MANUAL", "PHONE_MANUAL", "IN_STORE_MANUAL", "OTHER_MANUAL"] as const;

/** Public enquiry / contact form submitted from the website. */
export const publicEnquiryInput = z
  .object({
    customerName: requiredText(2, 80, "Your name"),
    email: optionalEmail,
    phone: optionalPhone(),
    message: requiredText(5, 2000, "Message"),
    productId: z.preprocess((v) => (v === "" || v === undefined ? null : v), idSchema.nullable()),
    quantity: optionalInt("Quantity", 1, 99),
    consent: z.preprocess(
      (v) => v === true || v === "on" || v === "true",
      z.literal(true, { error: "Please agree so we can use your details to reply" }),
    ),
  })
  .refine((v) => !!(v.email || v.phone), {
    path: ["email"],
    message: "Please provide an email address or a phone number",
    // Run even when other fields (e.g. consent) are invalid, so every problem is reported at once.
    when: (payload) => {
      const val = payload.value as { email?: unknown; phone?: unknown } | undefined;
      return !!val && typeof val === "object";
    },
  });

export type PublicEnquiryInput = z.infer<typeof publicEnquiryInput>;

/** Enquiry recorded manually by an admin (e.g. one that arrived over WhatsApp). */
export const manualEnquiryInput = z.object({
  channel: z.enum(MANUAL_CHANNELS),
  customerName: optionalText(120, "Customer name"),
  email: optionalEmail,
  phone: optionalPhone(),
  message: optionalText(4000, "Message"),
  productId: z.preprocess((v) => (v === "" || v === undefined ? null : v), idSchema.nullable()),
  quantity: optionalInt("Quantity", 1, 999),
  adminNotes: optionalText(4000, "Notes"),
});

export const enquiryUpdateInput = z.object({
  id: idSchema,
  status: z.enum(ENQUIRY_STATUSES),
  adminNotes: optionalText(4000, "Notes"),
});
