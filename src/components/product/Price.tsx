import { discountPercent, formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({
  price,
  salePrice,
  size = "md",
  className,
}: {
  price: string | null;
  salePrice: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const regular = formatINR(price);
  const sale = formatINR(salePrice);
  const pct = discountPercent(price, salePrice);
  const main = size === "lg" ? "text-3xl" : size === "md" ? "text-lg" : "text-base";

  if (!regular) {
    return <p className={cn("font-serif italic text-muted", main, className)}>Price on request</p>;
  }
  if (sale) {
    return (
      <p className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}>
        <span className={cn("font-medium text-emerald-900", main)}>
          <span className="sr-only">Sale price </span>
          {sale}
        </span>
        <s className="text-sm text-subtle">
          <span className="sr-only">Original price </span>
          {regular}
        </s>
        {pct !== null && pct > 0 && <span className="text-xs font-semibold tracking-wide text-ruby-700">{pct}% off</span>}
      </p>
    );
  }
  return <p className={cn("font-medium text-ink", main, className)}>{regular}</p>;
}
