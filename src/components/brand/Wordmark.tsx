import Image from "next/image";
import { cn } from "@/lib/utils";

/** The VIVIDHAM Collection badge (public/brand). */
export const DEFAULT_LOGO = "/brand/vividham-logo.png";

const SIZES = {
  md: "h-14 w-14 sm:h-16 sm:w-16 lg:h-[4.75rem] lg:w-[4.75rem]",
  lg: "h-28 w-28",
} as const;

/**
 * Brand logo. Shows the logo uploaded in Admin → Settings when there is one,
 * otherwise the VIVIDHAM Collection badge. The badge is square, so it is sized by `size`.
 */
export function Wordmark({
  logoUrl,
  businessName = "VIVIDHAM Collection",
  size = "md",
  className,
}: {
  logoUrl?: string | null;
  businessName?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span className={cn("relative block shrink-0", SIZES[size], className)}>
      <Image src={logoUrl || DEFAULT_LOGO} alt={businessName} fill sizes="112px" className="object-contain" priority />
    </span>
  );
}
