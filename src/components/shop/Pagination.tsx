import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { cn } from "@/lib/utils";

function pageWindow(page: number, pageCount: number): (number | "…")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export function Pagination({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (page: number) => string }) {
  if (pageCount <= 1) return null;
  const itemCls = "inline-flex h-11 min-w-11 items-center justify-center rounded-sm px-3 text-sm";
  return (
    <nav aria-label="Pagination" className="mt-14 flex justify-center">
      <ul className="flex items-center gap-1">
        <li>
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} className={cn(itemCls, "hover:bg-cream")} rel="prev">
              <ChevronLeft size={18} /> <span className="sr-only">Previous page</span>
            </Link>
          ) : (
            <span className={cn(itemCls, "text-stone")} aria-hidden><ChevronLeft size={18} /></span>
          )}
        </li>
        {pageWindow(page, pageCount).map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-subtle">…</li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(itemCls, p === page ? "bg-emerald-900 text-ivory" : "hover:bg-cream")}
              >
                <span className="sr-only">Page </span>
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < pageCount ? (
            <Link href={hrefFor(page + 1)} className={cn(itemCls, "hover:bg-cream")} rel="next">
              <ChevronRight size={18} /> <span className="sr-only">Next page</span>
            </Link>
          ) : (
            <span className={cn(itemCls, "text-stone")} aria-hidden><ChevronRight size={18} /></span>
          )}
        </li>
      </ul>
    </nav>
  );
}
