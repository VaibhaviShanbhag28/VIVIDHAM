import { notFound } from "next/navigation";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUI";
import { ContentPageForm } from "@/components/admin/ContentPageForm";
import { requireAdminPage } from "@/lib/auth/session";
import { getContentTemplate } from "@/lib/content-defaults";
import { prisma } from "@/lib/db";

export const metadata = { title: "Edit page" };

export default async function EditContentPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdminPage();
  const { slug } = await params;
  const template = getContentTemplate(slug);
  if (!template) notFound();
  const page = await prisma.contentPage.findUnique({ where: { slug } });
  const initial = page
    ? { title: page.title, summary: page.summary ?? "", body: page.body, isApproved: page.isApproved }
    : { title: template.title, summary: template.summary, body: template.body, isApproved: false };

  return (
    <>
      <AdminPageHeader title={initial.title} back={{ href: "/admin/content", label: "Pages & policies" }} />
      <AdminCard className="max-w-4xl">
        <ContentPageForm slug={slug} initial={initial} />
      </AdminCard>
    </>
  );
}
