/**
 * WhatsApp click-to-chat helpers. These only *prepare* a message — the customer
 * always reviews and sends it themselves inside WhatsApp. Opening WhatsApp does
 * not confirm an order, payment, or reservation.
 */

/** Strips everything except digits. Returns null unless the result looks like an international number (8–15 digits, no leading 0). */
export function normaliseWhatsAppNumber(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "").replace(/^00/, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return digits;
}

export interface ProductEnquiryDetails {
  businessName: string;
  productName: string;
  sku: string;
  /** Already formatted for display, e.g. "₹1,25,000" or "Price on request". */
  displayPrice: string;
  quantity: number;
  productUrl: string;
  customerName?: string | null;
  customerMessage?: string | null;
}

const clean = (s: string, max: number) =>
  s
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);

export function buildProductEnquiryMessage(d: ProductEnquiryDetails): string {
  const qty = Number.isInteger(d.quantity) && d.quantity > 0 ? Math.min(d.quantity, 99) : 1;
  const lines = [
    `Hello ${clean(d.businessName, 120)},`,
    "",
    "I would like to enquire about purchasing this product.",
    "",
    `Product: ${clean(d.productName, 160)}`,
    `SKU: ${clean(d.sku, 64)}`,
    `Price: ${clean(d.displayPrice, 40)}`,
    `Quantity: ${qty}`,
    `Product link: ${d.productUrl}`,
  ];
  const name = d.customerName ? clean(d.customerName, 80) : "";
  const note = d.customerMessage ? clean(d.customerMessage, 500) : "";
  if (name) lines.push(`My name: ${name}`);
  if (note) lines.push("", `Note: ${note}`);
  lines.push(
    "",
    "Please share the availability, final price, shipping details, and payment procedure.",
    "",
    "Thank you.",
  );
  return lines.join("\n");
}

export function buildGeneralEnquiryMessage(businessName: string): string {
  return `Hello ${clean(businessName, 120)},\n\nI would like to know more about your jewellery collection.\n\nThank you.`;
}

/**
 * Builds a click-to-chat URL: https://wa.me/<number>?text=<url-encoded message>.
 * Returns null when the business number is missing or invalid, so callers can
 * show a "WhatsApp not configured" notice instead of a broken link.
 */
export function buildWhatsAppUrl(phone: string | null | undefined, message?: string): string | null {
  const number = normaliseWhatsAppNumber(phone);
  if (!number) return null;
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
