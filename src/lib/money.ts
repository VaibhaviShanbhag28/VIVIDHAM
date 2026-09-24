/**
 * Decimal-safe money helpers. Values travel as strings ("125000.50") and are
 * never converted to floating-point numbers for arithmetic.
 */

export type MoneyInput = string | number | { toString(): string } | null | undefined;

const MONEY_RE = /^\d{1,10}(\.\d{1,2})?$/;

/** Normalises an admin-entered amount ("1,25,000.5" / "₹ 999") to a canonical "125000.50" string, or null. */
export function normaliseMoney(input: MoneyInput): string | null {
  if (input === null || input === undefined) return null;
  const raw = String(input).replace(/[₹,\s]/g, "").replace(/^INR/i, "");
  if (raw === "") return null;
  if (!MONEY_RE.test(raw)) return null;
  const [whole, frac = ""] = raw.split(".");
  return `${BigInt(whole).toString()}.${frac.padEnd(2, "0")}`;
}

/** Converts a canonical money string to integer paise (bigint) for exact comparisons. */
export function toPaise(input: MoneyInput): bigint | null {
  const n = normaliseMoney(input);
  if (n === null) return null;
  const [whole, frac] = n.split(".");
  return BigInt(whole) * 100n + BigInt(frac);
}

export function compareMoney(a: MoneyInput, b: MoneyInput): number {
  const pa = toPaise(a);
  const pb = toPaise(b);
  if (pa === null || pb === null) throw new Error("Cannot compare empty amounts");
  return pa === pb ? 0 : pa < pb ? -1 : 1;
}

/** Indian digit grouping: 1234567 → "12,34,567". */
function groupIndian(whole: string): string {
  if (whole.length <= 3) return whole;
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}`;
}

/** Formats an amount as INR, e.g. "₹1,25,000" or "₹999.50". Returns null when no price is set. */
export function formatINR(input: MoneyInput): string | null {
  const n = normaliseMoney(input);
  if (n === null) return null;
  const [whole, frac] = n.split(".");
  return `₹${groupIndian(whole)}${frac === "00" ? "" : `.${frac}`}`;
}

/** Whole-number discount percentage between a regular and sale price, computed in integer paise. */
export function discountPercent(regular: MoneyInput, sale: MoneyInput): number | null {
  const r = toPaise(regular);
  const s = toPaise(sale);
  if (r === null || s === null || r <= 0n || s >= r) return null;
  return Number(((r - s) * 100n) / r);
}
