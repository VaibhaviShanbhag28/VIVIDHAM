import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProductAction } from "@/app/admin/actions/products";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { ProductForm, type ProductFormState } from "@/components/admin/ProductForm";
import { Notice } from "@/components/ui/Notice";
import { requireAdminPage } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getProductForEdit } from "@/lib/services/products";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const [product, categories, sp] = await Promise.all([
    getProductForEdit(id),
    prisma.category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true, name: true, isActive: true } }),
    searchParams,
  ]);
  if (!product) notFound();

  return (
    <>
      <AdminPageHeader
        title={product.values.name}
        back={{ href: "/admin/products", label: "Products" }}
        description={
          product.values.status === "PUBLISHED" ? (
            <Link href={`/product/${product.slug}`} target="_blank" className="text-emerald-800 underline underline-offset-4">View on website ↗</Link>
          ) : (
            "This product is not visible on the website."
          )
        }
        actions={
          <ConfirmDeleteButton
            action={deleteProductAction}
            id={product.id}
            title="Delete this product?"
            description="The product, its images and certificate files will be permanently removed. Existing enquiries keep a snapshot of the product details. This cannot be undone — consider archiving instead."
          />
        }
      />
      {sp.created && <Notice tone="success" className="mb-6">Product created. You can keep editing, preview it, or publish it when ready.</Notice>}
      <ProductForm productId={product.id} initial={product.values as ProductFormState} categories={categories} isDemo={product.isDemo} />
    </>
  );
}
