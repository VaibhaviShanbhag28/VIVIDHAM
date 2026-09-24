import type { Metadata } from "next";
import Link from "next/link";
import { CloseIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product/ProductCard";
import { CatalogueShell, FilterSidebar, SortSelect } from "@/components/shop/CatalogueControls";
import { Pagination } from "@/components/shop/Pagination";
import { EmptyState } from "@/components/ui/Notice";
import { filtersToSearchParams, parseCatalogueParams, SORT_OPTIONS, type CatalogueFilters } from "@/lib/catalogue/filters";
import { getCatalogueFacets, listProducts } from "@/lib/catalogue/queries";
import { formatINR } from "@/lib/money";
import { AVAILABILITY_LABELS } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const f = parseCatalogueParams(await searchParams);
  const title = f.q ? `Search results for “${f.q}”` : "Shop jewellery & gemstones";
  return {
    title,
    description: "Browse necklaces, earrings, rings, bangles, pendants and gemstones. Filter by category, gemstone, material and price.",
    alternates: { canonical: "/shop" },
    // Avoid indexing endless filter combinations.
    robots: f.q || f.page > 1 || f.types.length || f.gems.length || f.materials.length ? { index: false, follow: true } : undefined,
  };
}

function hrefWith(f: CatalogueFilters, overrides: Partial<CatalogueFilters>) {
  const sp = filtersToSearchParams(f, { page: 1, ...overrides });
  return `/shop${sp.size ? `?${sp}` : ""}`;
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseCatalogueParams(await searchParams);
  const [facets, result] = await Promise.all([getCatalogueFacets(), listProducts(filters)]);
  const categoryName = (slug: string) => facets.categories.find((c) => c.slug === slug)?.name ?? slug;

  const singleCategory = filters.categories.length === 1 ? facets.categories.find((c) => c.slug === filters.categories[0]) : null;
  const heading = filters.q ? `Results for “${filters.q}”` : singleCategory ? singleCategory.name : "All jewellery";

  const chips: { label: string; href: string }[] = [
    ...filters.categories.map((c) => ({ label: categoryName(c), href: hrefWith(filters, { categories: filters.categories.filter((x) => x !== c) }) })),
    ...filters.types.map((t) => ({ label: t, href: hrefWith(filters, { types: filters.types.filter((x) => x !== t) }) })),
    ...filters.gems.map((g) => ({ label: g, href: hrefWith(filters, { gems: filters.gems.filter((x) => x !== g) }) })),
    ...filters.materials.map((m) => ({ label: m, href: hrefWith(filters, { materials: filters.materials.filter((x) => x !== m) }) })),
    ...filters.availability.map((a) => ({ label: AVAILABILITY_LABELS[a], href: hrefWith(filters, { availability: filters.availability.filter((x) => x !== a) }) })),
    ...(filters.minPrice ? [{ label: `From ${formatINR(filters.minPrice)}`, href: hrefWith(filters, { minPrice: null }) }] : []),
    ...(filters.maxPrice ? [{ label: `Up to ${formatINR(filters.maxPrice)}`, href: hrefWith(filters, { maxPrice: null }) }] : []),
    ...(filters.q ? [{ label: `Search: ${filters.q}`, href: hrefWith(filters, { q: null }) }] : []),
  ];

  const stateKey = filtersToSearchParams(filters, { page: 1 }).toString();

  return (
    <div className="container-page py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-xs text-subtle">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-ink">Home</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-muted">Shop</li>
        </ol>
      </nav>
      <header className="mt-6 mb-10 border-b border-sand pb-8">
        <h1 className="text-5xl sm:text-6xl">{heading}</h1>
        {singleCategory && !filters.q && (
          <p className="mt-3 max-w-2xl text-muted">Explore our {singleCategory.name.toLowerCase()} — enquire on WhatsApp for availability and personalised assistance.</p>
        )}
      </header>

      <CatalogueShell
        sidebar={<FilterSidebar key={stateKey} facets={facets} current={filters} />}
        toolbar={
          <div className="mb-8 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted" role="status" aria-live="polite">
                {result.total === 1 ? "1 piece" : `${result.total} pieces`}
              </p>
              <SortSelect key={`sort-${filters.sort}`} value={filters.sort} options={SORT_OPTIONS} />
            </div>
            {chips.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Active filters">
                {chips.map((chip) => (
                  <li key={chip.label}>
                    <Link href={chip.href} scroll={false} className="inline-flex items-center gap-1.5 rounded-full border border-stone bg-white px-3 py-1.5 text-xs text-ink hover:border-emerald-800">
                      {chip.label}
                      <CloseIcon size={12} />
                      <span className="sr-only">Remove filter</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        }
      >
        {result.items.length > 0 ? (
          <>
            <ProductGrid products={result.items} priorityCount={4} />
            <Pagination page={Math.min(filters.page, result.pageCount)} pageCount={result.pageCount} hrefFor={(p) => hrefWith(filters, { page: p })} />
          </>
        ) : (
          <EmptyState
            title="No pieces found"
            action={
              <Link href="/shop" className="btn btn-outline">
                View all jewellery
              </Link>
            }
          >
            {chips.length
              ? "Try removing a filter or searching for something else. You can also ask us on WhatsApp — we may have what you are looking for."
              : "New pieces are being added. Please check back soon or contact us on WhatsApp."}
          </EmptyState>
        )}
      </CatalogueShell>
    </div>
  );
}
