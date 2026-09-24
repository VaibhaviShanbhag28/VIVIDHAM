import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { requireAdminPage } from "@/lib/auth/session";
import { getProductForPreview, getRelatedProducts } from "@/lib/catalogue/queries";
import { getSiteSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/utils";

export const metadata = { title: "Preview product" };

export default async function PreviewProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const product = await getProductForPreview(id);
  if (!product) notFound();
  const [settings, related] = await Promise.all([getSiteSettings(), getRelatedProducts(product)]);
  const productUrl = absoluteUrl(`/product/${product.slug}`, process.env.APP_URL ?? "http://localhost:3000");

  return (
    <div className="-mx-4 -my-8 sm:-mx-8 lg:-mx-10 lg:-my-10">
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 bg-gold-100 px-4 py-3 text-sm text-gold-700 sm:px-8">
        <p>
          <strong>Preview</strong> — status: {product.status.toLowerCase()}.{" "}
          {product.status !== "PUBLISHED" && "Customers cannot see this product until it is published."}
        </p>
        <Link href={`/admin/products/${product.id}`} className="btn btn-primary btn-sm">Back to editing</Link>
      </div>
      <div className="bg-ivory">
        <ProductDetailView product={product} related={related} settings={settings} productUrl={productUrl} preview />
      </div>
    </div>
  );
}
