import Link from "next/link";
import { AdminPageHeader, Badge } from "@/components/admin/AdminUI";
import { requireAdminPage } from "@/lib/auth/session";
import { CONTENT_TEMPLATES } from "@/lib/content-defaults";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Pages & policies" };

export default async function ContentListPage() {
  await requireAdminPage();
  const pages = await prisma.contentPage.findMany();
  const bySlug = new Map(pages.map((p) => [p.slug, p]));

  return (
    <>
      <AdminPageHeader
        title="Pages & policies"
        description="Edit the About page and customer policies. Pages that are not approved show a “Draft — awaiting client approval” notice to visitors. Legal pages should be reviewed by a qualified professional before approval."
      />
      <ul className="card-surface divide-y divide-sand">
        {CONTENT_TEMPLATES.map((t) => {
          const page = bySlug.get(t.slug);
          const publicHref = t.slug === "about" ? "/about" : `/policies/${t.slug}`;
          return (
            <li key={t.slug} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-medium text-ink">{page?.title ?? t.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-subtle">
                  {page?.isApproved ? <Badge tone="green">Approved</Badge> : <Badge tone="gold">Awaiting approval</Badge>}
                  {page ? `Updated ${formatDate(page.updatedAt, true)}` : "Using starter template"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={publicHref} target="_blank" className="btn btn-ghost btn-sm">View</Link>
                <Link href={`/admin/content/${t.slug}`} className="btn btn-outline btn-sm">Edit</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
