import { AdminPageHeader } from "@/components/admin/AdminUI";
import { EMPTY_PRODUCT, ProductForm } from "@/components/admin/ProductForm";
import { requireAdminPage } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireAdminPage();
  const categories = await prisma.category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true, name: true, isActive: true } });
  return (
    <>
      <AdminPageHeader title="Add product" back={{ href: "/admin/products", label: "Products" }} description="New products are saved as drafts until you publish them." />
      <ProductForm productId={null} initial={EMPTY_PRODUCT} categories={categories} />
    </>
  );
}
