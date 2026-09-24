export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}

/** Removes control characters and trims. React escapes output, so HTML entities need no special handling. */
export function sanitizeText(input: string): string {
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

export function absoluteUrl(path: string, base: string) {
  return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
}

export function formatDate(date: Date | string, withTime = false) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export const AVAILABILITY_LABELS = {
  IN_STOCK: "In stock",
  MADE_TO_ORDER: "Made to order",
  ON_REQUEST: "Available on request",
  SOLD_OUT: "Sold out",
} as const;

export const ENQUIRY_STATUS_LABELS = {
  NEW: "New",
  CONTACTED: "Contacted",
  IN_DISCUSSION: "In discussion",
  CLOSED: "Closed",
} as const;

export const ENQUIRY_CHANNEL_LABELS = {
  WEBSITE_FORM: "Website form",
  WHATSAPP_MANUAL: "WhatsApp (recorded manually)",
  PHONE_MANUAL: "Phone (recorded manually)",
  IN_STORE_MANUAL: "In store (recorded manually)",
  OTHER_MANUAL: "Other (recorded manually)",
} as const;
