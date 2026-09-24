import Image from "next/image";
import Link from "next/link";
import { productStatusAction } from "@/app/admin/actions/products";
import { AdminPageHeader, Badge, STATUS_TONE } from "@/components/admin/AdminUI";
import { GemIcon } from "@/components/icons";
import { Pagination } from "@/components/shop/Pagination";
import { Notice } from "@/components/ui/Notice";
import { requireAdminPage } from "@/lib/auth/session";
import { formatINR } from "@/lib/money";
import { listAdminProducts } from "@/lib/services/products";
import { AVAILABILITY_LABELS, formatDate } from "@/lib/utils";

export const metadata = { title: "Products" };

type SP = Promise<Record<string, string | undefined>>;

const FILTERS = [
  { value: "", label: "All" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "SOLD_OUT", label: "Sold out" },
];

export default async function AdminProductsPage({ searchParams }: { searchParams: SP }) {
  await requireAdminPage();
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 100) || null;
  const status = sp.status ?? "";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { items, total, pageCount } = await listAdminProducts({ q, status, page });

  const href = (overrides: Record<string, string | number | null>) => {
    const params = new URLSearchParams();
    const merged = { q, status, page: 1, ...overrides };
    if (merged.q) params.set("q", String(merged.q));
    if (merged.status) params.set("status", String(merged.status));
    if (Number(merged.page) > 1) params.set("page", String(merged.page));
    return `/admin/products${params.size ? `?${params}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader
        title="Products"
        description={`${total} product${total === 1 ? "" : "s"}`}
        actions={<Link href="/admin/products/new" className="btn btn-primary btn-sm">Add product</Link>}
      />
      {sp.deleted && <Notice tone="success" className="mb-6">The product was deleted.</Notice>}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter by status">
          <ul className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <li key={f.value}>
                <Link
                  href={href({ status: f.value || null })}
                  aria-current={status === f.value ? "page" : undefined}
                  className={status === f.value ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm border border-sand bg-white"}
                >
                  {f.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form role="search" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="product-search" className="sr-only">Search products</label>
          <input id="product-search" name="q" type="search" defaultValue={q ?? ""} placeholder="Search name or SKU" className="field-input !min-h-9 w-64 max-w-full text-sm" />
          <button className="btn btn-outline btn-sm" type="submit">Search</button>
        </form>
      </div>

      {items.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <p className="font-serif text-2xl">No products found</p>
          <p className="mt-2 text-sm text-muted">{q || status ? "Try a different search or filter." : "Add your first product to start building the catalogue."}</p>
          <Link href="/admin/products/new" className="btn btn-primary btn-sm mt-5">Add product</Link>
        </div>
      ) : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <caption className="sr-only">Products</caption>
            <thead className="border-b border-sand bg-cream/50 text-xs tracking-[0.1em] text-muted uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Product</th>
                <th scope="col" className="px-4 py-3 font-semibold">Price</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Availability</th>
                <th scope="col" className="px-4 py-3 font-semibold">Updated</th>
                <th scope="col" className="px-4 py-3 font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {items.map((p) => (
                <tr key={p.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-cream">
                        {p.image ? <Image src={p.image} alt="" fill sizes="44px" className="object-cover" /> : <GemIcon className="m-auto mt-4 text-stone" />}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/products/${p.id}`} className="font-medium text-ink hover:underline">{p.name}</Link>
                        <p className="font-mono text-xs text-subtle">{p.sku}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.isDemo && <Badge tone="dark">Demo</Badge>}
                          {p.isFeatured && <Badge tone="gold">Featured</Badge>}
                          {p.isNewArrival && <Badge tone="green">New arrival</Badge>}
                          {p.enquiries > 0 && <Badge>{p.enquiries} enquir{p.enquiries === 1 ? "y" : "ies"}</Badge>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {p.salePrice ? (
                      <>
                        {formatINR(p.salePrice)} <s className="text-xs text-subtle">{formatINR(p.price)}</s>
                      </>
                    ) : (
                      (formatINR(p.price) ?? <span className="text-muted italic">On request</span>)
                    )}
                  </td>
                  <td className="px-4 py-3"><Badge tone={STATUS_TONE[p.status]}>{p.status.toLowerCase()}</Badge></td>
                  <td className="px-4 py-3 text-muted">{AVAILABILITY_LABELS[p.availability]}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(p.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Link href={`/admin/products/${p.id}`} className="btn btn-ghost btn-sm !px-2">Edit</Link>
                      <Link href={`/admin/products/${p.id}/preview`} className="btn btn-ghost btn-sm !px-2">Preview</Link>
                      <form action={productStatusAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="action" value={p.status === "PUBLISHED" ? "unpublish" : "publish"} />
                        <button type="submit" className="btn btn-ghost btn-sm !px-2">{p.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button>
                      </form>
                      <form action={productStatusAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="action" value={p.availability === "SOLD_OUT" ? "mark-in-stock" : "mark-sold-out"} />
                        <button type="submit" className="btn btn-ghost btn-sm !px-2">{p.availability === "SOLD_OUT" ? "Mark in stock" : "Mark sold out"}</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={Math.min(page, pageCount)} pageCount={pageCount} hrefFor={(p) => href({ page: p })} />
    </>
  );
}
