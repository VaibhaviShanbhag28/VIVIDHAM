import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUI";
import { ManualEnquiryForm } from "@/components/admin/EnquiryForms";
import { requireAdminPage } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = { title: "Record enquiry" };

export default async function NewEnquiryPage() {
  await requireAdminPage();
  const products = await prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, sku: true }, take: 1000 });
  return (
    <>
      <AdminPageHeader
        title="Record an enquiry"
        back={{ href: "/admin/enquiries", label: "Enquiries" }}
        description="Log an enquiry received over WhatsApp, phone or in person so it can be tracked alongside website enquiries."
      />
      <AdminCard className="max-w-3xl">
        <ManualEnquiryForm products={products} />
      </AdminCard>
    </>
  );
}
