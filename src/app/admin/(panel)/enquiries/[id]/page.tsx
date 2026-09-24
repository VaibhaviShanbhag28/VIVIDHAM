import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteEnquiryAction } from "@/app/admin/actions/enquiries";
import { AdminCard, AdminPageHeader, Badge, ENQUIRY_TONE } from "@/components/admin/AdminUI";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { EnquiryStatusForm } from "@/components/admin/EnquiryForms";
import { WhatsAppIcon } from "@/components/icons";
import { Notice } from "@/components/ui/Notice";
import { requireAdminPage } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ENQUIRY_CHANNEL_LABELS, ENQUIRY_STATUS_LABELS, formatDate } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata = { title: "Enquiry" };

export default async function EnquiryDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const sp = await searchParams;
  const e = await prisma.enquiry.findUnique({ where: { id }, include: { product: { select: { id: true, name: true, sku: true, slug: true } } } });
  if (!e) notFound();
  const snap = e.productSnapshot as { name?: string; sku?: string; displayedPrice?: string } | null;
  const replyUrl = e.phone ? buildWhatsAppUrl(e.phone, `Hello${e.customerName ? ` ${e.customerName}` : ""}, thank you for your enquiry (${e.reference}).`) : null;

  const rows: [string, React.ReactNode][] = [
    ["Reference", <span key="r" className="font-mono">{e.reference}</span>],
    ["Received", formatDate(e.createdAt, true)],
    ["Source", ENQUIRY_CHANNEL_LABELS[e.channel]],
    ["Customer", e.customerName ?? "—"],
    ["Email", e.email ? <a key="e" href={`mailto:${e.email}`} className="text-emerald-800 underline">{e.email}</a> : "—"],
    ["Phone", e.phone ? <a key="p" href={`tel:${e.phone}`} className="text-emerald-800 underline">{e.phone}</a> : "—"],
    ["Consent to be contacted", e.channel === "WEBSITE_FORM" ? (e.consentGiven ? "Given via website form" : "Not recorded") : "Recorded manually by admin"],
  ];

  return (
    <>
      <AdminPageHeader
        title={`Enquiry ${e.reference}`}
        back={{ href: "/admin/enquiries", label: "Enquiries" }}
        description={<Badge tone={ENQUIRY_TONE[e.status]}>{ENQUIRY_STATUS_LABELS[e.status]}</Badge>}
        actions={
          <>
            {replyUrl && (
              <a href={replyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm">
                <WhatsAppIcon size={16} /> Reply on WhatsApp
              </a>
            )}
            <ConfirmDeleteButton action={deleteEnquiryAction} id={e.id} title="Delete this enquiry?" description="The enquiry and its notes will be permanently removed." />
          </>
        }
      />
      {sp.created && <Notice tone="success" className="mb-6">Enquiry recorded.</Notice>}
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <AdminCard title="Details">
            <dl className="divide-y divide-sand text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[11rem_1fr] gap-4 py-2.5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </AdminCard>
          <AdminCard title="Product">
            {e.product || snap ? (
              <div className="text-sm">
                <p className="font-medium">
                  {e.product ? <Link href={`/admin/products/${e.product.id}`} className="text-emerald-800 underline">{e.product.name}</Link> : snap?.name}
                  {!e.product && <span className="ml-2 text-xs text-subtle">(product since deleted)</span>}
                </p>
                <p className="mt-1 text-muted">SKU: <span className="font-mono">{e.product?.sku ?? snap?.sku}</span></p>
                {snap?.displayedPrice && <p className="mt-1 text-muted">Price shown at the time: {snap.displayedPrice}</p>}
                {e.quantity && <p className="mt-1 text-muted">Quantity: {e.quantity}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted">General enquiry (no product).</p>
            )}
          </AdminCard>
          <AdminCard title="Message">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink">{e.message ?? <span className="text-subtle">No message.</span>}</p>
          </AdminCard>
        </div>
        <AdminCard title="Follow-up" className="xl:sticky xl:top-6 xl:self-start">
          <EnquiryStatusForm id={e.id} status={e.status} adminNotes={e.adminNotes ?? ""} />
        </AdminCard>
      </div>
    </>
  );
}
