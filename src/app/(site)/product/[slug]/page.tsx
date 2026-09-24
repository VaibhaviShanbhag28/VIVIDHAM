import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { getPublishedProduct, getRelatedProducts, type ProductDetailDTO } from "@/lib/catalogue/queries";
import { getSiteSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

const loadProduct = cache((slug: string) => getPublishedProduct(slug));
const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: "Product not found", robots: { index: false } };
  const description = product.seoDescription ?? product.shortDescription ?? product.description.slice(0, 155);
  const image = product.images[0];
  return {
    title: product.seoTitle ?? product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    robots: product.isDemo ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      title: product.seoTitle ?? product.name,
      description,
      url: `/product/${product.slug}`,
      images: image ? [{ url: image.url, width: image.width ?? undefined, height: image.height ?? undefined, alt: image.alt ?? product.name }] : undefined,
    },
  };
}

/**
 * Structured data is emitted only for real (non-demo) products and only with
 * fields the client has supplied — no inferred ratings, brands or authenticity claims.
 */
function productJsonLd(product: ProductDetailDTO, url: string, businessName: string) {
  if (product.isDemo) return null;
  const price = product.salePrice ?? product.price;
  const availability = {
    IN_STOCK: "https://schema.org/InStock",
    MADE_TO_ORDER: "https://schema.org/PreOrder",
    ON_REQUEST: "https://schema.org/LimitedAvailability",
    SOLD_OUT: "https://schema.org/SoldOut",
  }[product.availability];
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.shortDescription ?? product.description.slice(0, 500),
    url,
    ...(product.images.length ? { image: product.images.map((i) => absoluteUrl(i.url, appUrl())) } : {}),
    ...(product.material ? { material: product.material } : {}),
    ...(price
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            price,
            availability,
            url,
            seller: { "@type": "Organization", name: businessName },
          },
        }
      : {}),
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const [settings, related, nonce] = await Promise.all([
    getSiteSettings(),
    getRelatedProducts(product),
    headers().then((h) => h.get("x-nonce") ?? undefined),
  ]);
  const productUrl = absoluteUrl(`/product/${product.slug}`, appUrl());
  const jsonLd = productJsonLd(product, productUrl, settings.businessName);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          nonce={nonce}
          // JSON.stringify output with "<" escaped cannot break out of the script element.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <ProductDetailView product={product} related={related} settings={settings} productUrl={productUrl} />
    </>
  );
}
