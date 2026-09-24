import Link from "next/link";
import { AdminCard, AdminPageHeader, Badge, ENQUIRY_TONE } from "@/components/admin/AdminUI";
import { CheckIcon, AlertIcon } from "@/components/icons";
import { requireAdminPage } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getSiteSettings, whatsappConfigured } from "@/lib/settings";
import { ENQUIRY_STATUS_LABELS, formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const admin = await requireAdminPage();
  const [settings, counts, newEnquiries, recent, approvedPages, demoCount] = await Promise.all([
    getSiteSettings(),
    prisma.product.groupBy({ by: ["status"], _count: true }),
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { product: { select: { name: true } } } }),
    prisma.contentPage.count({ where: { isApproved: true } }),
    prisma.product.count({ where: { isDemo: true } }),
  ]);
  const soldOut = await prisma.product.count({ where: { availability: "SOLD_OUT", status: "PUBLISHED" } });
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<string, number>;

  const checklist = [
    { done: whatsappConfigured(settings), label: "Add the business WhatsApp number", href: "/admin/settings#contact" },
    { done: !!settings.logoUrl, label: "Upload the business logo", href: "/admin/settings#brand" },
    { done: !!(settings.phone || settings.email), label: "Add phone and email contact details", href: "/admin/settings#contact" },
    { done: !!settings.addressLine1, label: "Add the business address and hours", href: "/admin/settings#contact" },
    { done: approvedPages >= 6, label: `Review and approve policy & About pages (${approvedPages}/6 approved)`, href: "/admin/content" },
    { done: demoCount === 0, label: demoCount ? `Replace ${demoCount} demonstration product(s) with real products` : "Demonstration products removed", href: "/admin/products" },
  ];

  const stats = [
    { label: "Published products", value: byStatus.PUBLISHED ?? 0, href: "/admin/products?status=PUBLISHED" },
    { label: "Drafts", value: byStatus.DRAFT ?? 0, href: "/admin/products?status=DRAFT" },
    { label: "Sold out (published)", value: soldOut, href: "/admin/products?status=SOLD_OUT" },
    { label: "New enquiries", value: newEnquiries, href: "/admin/enquiries?status=NEW" },
  ];

  return (
    <>
      <AdminPageHeader
        title={`Welcome, ${admin.name.split(" ")[0]}`}
        description="Overview of your catalogue and enquiries."
        actions={
          <>
            <Link href="/admin/products/new" className="btn btn-primary btn-sm">Add product</Link>
            <Link href="/admin/enquiries/new" className="btn btn-outline btn-sm">Record enquiry</Link>
          </>
        }
      />

      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="card-surface block p-5 transition hover:shadow-soft">
              <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">{s.label}</p>
              <p className="mt-2 font-serif text-4xl text-ink">{s.value}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <AdminCard title="Launch checklist" description="Details still needed before the site goes live.">
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-start gap-3 text-sm">
                <span className={item.done ? "text-emerald-700" : "text-gold-600"}>{item.done ? <CheckIcon size={18} /> : <AlertIcon size={18} />}</span>
                {item.done ? (
                  <span className="text-muted line-through decoration-stone">{item.label}</span>
                ) : (
                  <Link href={item.href} className="text-ink underline-offset-4 hover:underline">{item.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </AdminCard>

        <AdminCard title="Recent enquiries">
          {recent.length ? (
            <ul className="divide-y divide-sand">
              {recent.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/enquiries/${e.id}`} className="flex items-center justify-between gap-4 py-3 hover:bg-cream/40">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{e.customerName ?? "Unnamed"} {e.product && <span className="text-muted">— {e.product.name}</span>}</p>
                      <p className="text-xs text-subtle"><span className="font-mono">{e.reference}</span> · {formatDate(e.createdAt, true)}</p>
                    </div>
                    <Badge tone={ENQUIRY_TONE[e.status]}>{ENQUIRY_STATUS_LABELS[e.status]}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No enquiries yet. Enquiries submitted through the website form appear here automatically.</p>
          )}
          <p className="mt-4 rounded-sm bg-cream p-3 text-xs leading-relaxed text-muted">
            Conversations started with the “Enquire on WhatsApp” button happen inside WhatsApp and are <strong>not</strong> recorded here automatically.
            Use <Link href="/admin/enquiries/new" className="text-emerald-800 underline">Record enquiry</Link> to log them manually.
          </p>
        </AdminCard>
      </div>
    </>
  );
}
