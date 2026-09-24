import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Temporary VIVIDHUM JEWELLERY wordmark. When a logo is uploaded in
 * Admin → Settings it is used automatically instead.
 */
export function Wordmark({
  logoUrl,
  businessName = "VIVIDHUM JEWELLERY",
  tone = "dark",
  className,
}: {
  logoUrl?: string | null;
  businessName?: string;
  tone?: "dark" | "light";
  className?: string;
}) {
  if (logoUrl) {
    return (
      <span className={cn("relative block h-11 w-40 sm:h-12 sm:w-48", className)}>
        <Image src={logoUrl} alt={businessName} fill sizes="192px" className="object-contain" priority />
      </span>
    );
  }
  const [first, ...rest] = businessName.split(" ");
  const secondary = rest.join(" ");
  return (
    <span className={cn("flex flex-col items-center leading-none select-none", className)} aria-label={businessName}>
      <span
        aria-hidden
        className={cn(
          "font-serif text-[1.55rem] font-medium tracking-[0.32em] sm:text-[1.85rem]",
          tone === "dark" ? "text-emerald-900" : "text-ivory",
        )}
        style={{ marginRight: "-0.32em" }}
      >
        {first}
      </span>
      {secondary && (
        <span aria-hidden className="mt-1 flex items-center gap-2">
          <span className={cn("h-px w-5", tone === "dark" ? "bg-gold-500" : "bg-gold-300")} />
          <span
            className={cn("text-[0.56rem] font-semibold tracking-[0.45em]", tone === "dark" ? "text-gold-700" : "text-gold-300")}
            style={{ marginRight: "-0.45em" }}
          >
            {secondary}
          </span>
          <span className={cn("h-px w-5", tone === "dark" ? "bg-gold-500" : "bg-gold-300")} />
        </span>
      )}
    </span>
  );
}
