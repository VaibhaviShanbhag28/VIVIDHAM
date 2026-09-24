import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  hrefLabel,
  align = "center",
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  align?: "center" | "left";
  id?: string;
}) {
  return (
    <div className={cn("mb-10 flex flex-col gap-4 sm:mb-12", align === "center" ? "items-center text-center" : "items-start sm:flex-row sm:items-end sm:justify-between")}>
      <div className={cn(align === "center" && "max-w-2xl")}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id} className="mt-3 text-4xl leading-tight sm:text-5xl">
          {title}
        </h2>
        {description && <p className="mt-4 text-base leading-relaxed text-muted">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-2 text-xs font-semibold tracking-[0.18em] text-emerald-900 uppercase">
          <span className="link-underline">{hrefLabel ?? "View all"}</span>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
