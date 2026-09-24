import Link from "next/link";
import { AdminPageHeader, Badge, ENQUIRY_TONE } from "@/components/admin/AdminUI";
import { Pagination } from "@/components/shop/Pagination";
import { Notice } from "@/components/ui/Notice";
import { requireAdminPage } from "@/lib/auth/session";
import { listEnquiries } from "@/lib/services/enquiries";
import { ENQUIRY_CHANNEL_LABELS, ENQUIRY_STATUS_LABELS, formatDate } from "@/lib/utils";

export const metadata = { title: "Enquiries" };

type SP = Promise<Record<string, string | undefined>>;

export default async function EnquiriesPage({ searchParams }: { searchParams: SP }) {
  await requireAdminPage();
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 100) || null;
  const status = sp.status ?? "";
  const channel = sp.channel ?? "";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { items, total, pageCount } = await listEnquiries({ q, status, channel, page });

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (channel) params.set("channel", channel);
    if (p > 1) params.set("page", String(p));
    return `/admin/enquiries${params.size ? `?${params}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader
        title="Enquiries"
        description={
          <>
            Website form submissions appear here automatically. WhatsApp conversations are <strong>not</strong> captured automatically — record them with
            “Record enquiry”.
          </>
        }
        actions={<Link href="/admin/enquiries/new" className="btn btn-primary btn-sm">Record enquiry</Link>}
      />
      {sp.deleted && <Notice tone="success" className="mb-6">Enquiry deleted.</Notice>}

      <form className="card-surface mb-6 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end" role="search">
        <div>
          <label htmlFor="enq-q" className="field-label">Search</label>
          <input id="enq-q" name="q" type="search" defaultValue={q ?? ""} placeholder="Reference, name, email, phone, product…" className="field-input !min-h-10 text-sm" />
        </div>
        <div>
          <label htmlFor="enq-status" className="field-label">Status</label>
          <select id="enq-status" name="status" defaultValue={status} className="field-input !min-h-10 text-sm">
            <option value="">All</option>
            {Object.entries(ENQUIRY_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="enq-channel" className="field-label">Source</label>
          <select id="enq-channel" name="channel" defaultValue={channel} className="field-input !min-h-10 text-sm">
            <option value="">All</option>
            {Object.entries(ENQUIRY_CHANNEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <button type="submit" className="btn btn-outline btn-sm !min-h-10">Filter</button>
      </form>

      <p className="mb-3 text-sm text-muted">{total} enquir{total === 1 ? "y" : "ies"}</p>
      {items.length === 0 ? (
        <div className="card-surface p-10 text-center text-sm text-muted">No enquiries match these filters.</div>
      ) : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <caption className="sr-only">Enquiries</caption>
            <thead className="border-b border-sand bg-cream/50 text-xs tracking-[0.1em] text-muted uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Reference</th>
                <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
                <th scope="col" className="px-4 py-3 font-semibold">Product</th>
                <th scope="col" className="px-4 py-3 font-semibold">Source</th>
                <th scope="col" className="px-4 py-3 font-semibold">Received</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {items.map((e) => {
                const snap = e.productSnapshot as { name?: string; sku?: string } | null;
                return (
                  <tr key={e.id} className="hover:bg-cream/30">
                    <td className="px-4 py-3"><Link href={`/admin/enquiries/${e.id}`} className="font-mono text-emerald-800 underline-offset-4 hover:underline">{e.reference}</Link></td>
                    <td className="px-4 py-3">
                      <p className="text-ink">{e.customerName ?? <span className="text-subtle italic">Not provided</span>}</p>
                      <p className="text-xs text-subtle">{e.email ?? e.phone ?? ""}</p>
                    </td>
                    <td className="px-4 py-3">{e.product?.name ?? snap?.name ?? <span className="text-subtle">General</span>}</td>
                    <td className="px-4 py-3 text-muted">{ENQUIRY_CHANNEL_LABELS[e.channel].replace(" (recorded manually)", "")}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(e.createdAt, true)}</td>
                    <td className="px-4 py-3"><Badge tone={ENQUIRY_TONE[e.status]}>{ENQUIRY_STATUS_LABELS[e.status]}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={Math.min(page, pageCount)} pageCount={pageCount} hrefFor={href} />
    </>
  );
}
