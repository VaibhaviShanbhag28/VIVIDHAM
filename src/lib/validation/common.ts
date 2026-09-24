import { z } from "zod";
import { normaliseMoney } from "@/lib/money";

/** Trimmed optional text: empty strings become null. */
export const optionalText = (max: number, label = "This field") =>
  z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : (v ?? null)),
    z.string().max(max, `${label} must be ${max} characters or fewer`).nullable(),
  );

export const requiredText = (min: number, max: number, label: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z
      .string({ error: `${label} is required` })
      .min(min, min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
      .max(max, `${label} must be ${max} characters or fewer`),
  );

/** Optional INR amount, normalised to a canonical "12345.00" string. */
export const optionalMoney = (label: string) =>
  z.preprocess(
    (v) => {
      if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) return null;
      return normaliseMoney(v as string) ?? "__invalid__";
    },
    z
      .string()
      .regex(/^\d+\.\d{2}$/, `${label} must be a valid amount, e.g. 125000 or 1,25,000.50`)
      .nullable(),
  );

/** Optional positive decimal with up to 3 decimal places (weights in grams / carats). */
export const optionalDecimal3 = (label: string) =>
  z.preprocess(
    (v) => {
      if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) return null;
      return String(v).trim();
    },
    z
      .string()
      .regex(/^\d{1,6}(\.\d{1,3})?$/, `${label} must be a number with up to 3 decimal places`)
      .nullable(),
  );

export const optionalInt = (label: string, min = 0, max = 1_000_000) =>
  z.preprocess(
    (v) => {
      if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) return null;
      return Number(v);
    },
    z
      .number({ error: `${label} must be a whole number` })
      .int(`${label} must be a whole number`)
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be at most ${max}`)
      .nullable(),
  );

/** Optional absolute https URL. */
export const optionalHttpsUrl = (label: string, allowedHosts?: string[]) =>
  z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : (v ?? null)),
    z
      .string()
      .max(500)
      .refine((s) => {
        try {
          const u = new URL(s);
          if (u.protocol !== "https:") return false;
          if (allowedHosts && !allowedHosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))) return false;
          return true;
        } catch {
          return false;
        }
      }, allowedHosts ? `${label} must be an https:// link on ${allowedHosts.join(" or ")}` : `${label} must be a valid https:// link`)
      .nullable(),
  );

/** Internal path ("/shop?category=rings") or https URL. */
export const optionalLink = (label: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : (v ?? null)),
    z
      .string()
      .max(300)
      .refine((s) => {
        if (s.startsWith("/") && !s.startsWith("//")) return true;
        try {
          return new URL(s).protocol === "https:";
        } catch {
          return false;
        }
      }, `${label} must start with / or https://`)
      .nullable(),
  );

export const optionalEmail = z.preprocess(
  (v) => (typeof v === "string" ? (v.trim() === "" ? null : v.trim().toLowerCase()) : (v ?? null)),
  z.email("Enter a valid email address").max(200).nullable(),
);

/** Phone numbers: allows +, spaces, dashes and brackets; stores digits with an optional leading +. */
export const optionalPhone = (label = "Phone number") =>
  z.preprocess(
    (v) => {
      if (typeof v !== "string" || v.trim() === "") return null;
      const t = v.trim();
      if (!/^\+?[\d\s\-()]+$/.test(t)) return "__invalid__";
      return (t.startsWith("+") ? "+" : "") + t.replace(/\D/g, "");
    },
    z
      .string()
      .regex(/^\+?\d{7,15}$/, `${label} must contain 7–15 digits`)
      .nullable(),
  );

/** Flattens Zod issues into a { "field.path": "message" } map for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export const idSchema = z.string().min(1).max(40).regex(/^[a-z0-9]+$/i, "Invalid id");
