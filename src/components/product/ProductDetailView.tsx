import Link from "next/link";
import { CertificateIcon, ExternalIcon, ReturnIcon, SparkleIcon, TruckIcon } from "@/components/icons";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { ProductGrid } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ProductCardDTO, ProductDetailDTO } from "@/lib/catalogue/queries";
import { formatINR } from "@/lib/money";
import type { SiteSettings } from "@/lib/settings";
import { AVAILABILITY_LABELS, cn } from "@/lib/utils";
import { Price } from "./Price";
import { ProductGallery } from "./ProductGallery";
import { WhatsAppEnquiry } from "./WhatsAppEnquiry";

function SpecList({ rows }: { rows: [string, string | null | undefined][] }) {
  const present = rows.filter((r): r is [string, string] => !!r[1]);
  if (!present.length) return null;
  return (
    <dl className="divide-y divide-sand border-y border-sand text-sm">
      {present.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[40%_1fr] gap-4 py-3">
          <dt className="text-muted">{label}</dt>
          <dd className="text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Disclosure({ title, icon, children, defaultOpen = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group border-b border-sand" open={defaultOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold tracking-[0.12em] text-ink uppercase [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-3">
          <span className="text-gold-600">{icon}</span>
          {title}
        </span>
        <span aria-hidden className="text-xl leading-none font-light text-muted transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="pb-6 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="mb-3 whitespace-pre-line last:mb-0">
          {p}
        </p>
      ))}
    </>
  );
}

export function ProductDetailView({
  product,
  related,
  settings,
  productUrl,
  preview = false,
}: {
  product: ProductDetailDTO;
  related: ProductCardDTO[];
  settings: SiteSettings;
  productUrl: string;
  preview?: boolean;
}) {
  const displayPrice = formatINR(product.salePrice ?? product.price) ?? "Price on request";
  const soldOut = product.availability === "SOLD_OUT";
  const weight = (g: string | null) => (g ? `${g} g` : null);
  const primaryCategory = product.categories[0];

  const availabilityTone = soldOut ? "text-ruby-700" : product.availability === "IN_STOCK" ? "text-emerald-700" : "text-gold-700";

  return (
    <div className="container-page py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="text-xs text-subtle">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-ink">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/shop" className="hover:text-ink">Shop</Link></li>
          {primaryCategory && (
            <>
              <li aria-hidden>/</li>
              <li><Link href={`/shop?category=${primaryCategory.slug}`} className="hover:text-ink">{primaryCategory.name}</Link></li>
            </>
          )}
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-muted">{product.name}</li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <ProductGallery images={product.images} name={product.name} isDemo={product.isDemo} />
        </div>

        <div>
          {product.jewelleryType && <p className="eyebrow">{product.jewelleryType}</p>}
          <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{product.name}</h1>
          <p className="mt-3 text-xs tracking-[0.14em] text-subtle uppercase">
            SKU <span className="font-mono tracking-normal text-muted">{product.sku}</span>
          </p>

          <Price price={product.price} salePrice={product.salePrice} size="lg" className="mt-6" />
          {product.price && <p className="mt-1 text-xs text-subtle">Indicative price in INR. Final price is confirmed on enquiry.</p>}

          <p className={cn("mt-4 flex items-center gap-2 text-sm font-medium", availabilityTone)}>
            <span aria-hidden className="h-2 w-2 rounded-full bg-current" />
            {AVAILABILITY_LABELS[product.availability]}
            {product.availability === "IN_STOCK" && product.stockQuantity !== null && product.stockQuantity > 0 && product.stockQuantity <= 3 && (
              <span className="text-muted">— only {product.stockQuantity} available</span>
            )}
          </p>

          {product.isDemo && (
            <p className="mt-5 rounded-sm border border-dashed border-stone bg-cream px-4 py-3 text-xs leading-relaxed text-muted">
              <strong className="text-ink">Demonstration product.</strong> This listing is sample content used to preview the website design. Its
              details, price and images are placeholders and do not describe a real item for sale.
            </p>
          )}

          {product.shortDescription && <p className="mt-6 text-lg leading-relaxed text-muted">{product.shortDescription}</p>}

          <div className="mt-8 border-t border-sand pt-8">
            {soldOut ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">This piece is currently sold out. Ask us about similar designs or made-to-order options.</p>
                <WhatsAppEnquiry
                  businessName={settings.businessName}
                  whatsappNumber={settings.whatsappNumber}
                  productName={product.name}
                  sku={product.sku}
                  displayPrice={`${displayPrice} (sold out — asking about similar pieces)`}
                  productUrl={productUrl}
                  showQuantity={false}
                />
              </div>
            ) : (
              <WhatsAppEnquiry
                businessName={settings.businessName}
                whatsappNumber={settings.whatsappNumber}
                productName={product.name}
                sku={product.sku}
                displayPrice={displayPrice}
                productUrl={productUrl}
                showQuantity
              />
            )}
            <p className="mt-4 text-center text-sm text-muted">
              Prefer email?{" "}
              <a href="#product-enquiry" className="text-emerald-800 underline underline-offset-4">
                Send an enquiry form
              </a>
            </p>
          </div>

          <div className="mt-10">
            <Disclosure title="Description" icon={<SparkleIcon size={18} />} defaultOpen>
              <Paragraphs text={product.description} />
              {product.otherDetails && (
                <div className="mt-4">
                  <Paragraphs text={product.otherDetails} />
                </div>
              )}
            </Disclosure>

            <Disclosure title="Specifications" icon={<SparkleIcon size={18} />} defaultOpen>
              <SpecList
                rows={[
                  ["Category", product.categories.map((c) => c.name).join(", ") || null],
                  ["Jewellery type", product.jewelleryType],
                  ["Material", product.material],
                  ["Metal purity", product.metalPurity],
                  ["Metal colour", product.metalColour],
                  ["Hallmark", product.hallmarkDetails],
                  ["Gross weight", weight(product.grossWeightGrams)],
                  ["Net weight", weight(product.netWeightGrams)],
                  ["Size", product.size],
                  ["Dimensions", product.dimensions],
                ]}
              />
              {product.gemstones.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-sans text-xs font-semibold tracking-[0.16em] text-ink uppercase">Gemstone details</h3>
                  {product.gemstones.map((g) => (
                    <SpecList
                      key={g.id}
                      rows={[
                        ["Gemstone", g.type],
                        ["Colour", g.colour],
                        ["Cut", g.cut],
                        ["Shape", g.shape],
                        ["Clarity", g.clarity],
                        ["Weight", g.caratWeight ? `${g.caratWeight} ct` : null],
                        ["Number of stones", g.count ? String(g.count) : null],
                        ["Origin", g.origin],
                        ["Treatment", g.treatment],
                      ]}
                    />
                  ))}
                </div>
              )}
            </Disclosure>

            {product.certifications.length > 0 && (
              <Disclosure title="Certification" icon={<CertificateIcon size={18} />} defaultOpen>
                <ul className="space-y-4">
                  {product.certifications.map((c) => (
                    <li key={c.id} className="rounded-sm border border-sand bg-white p-4">
                      <SpecList
                        rows={[
                          ["Issued by", c.issuer],
                          ["Certificate no.", c.certificateNumber],
                          ["Report date", c.reportDate],
                          ["Notes", c.notes],
                        ]}
                      />
                      <div className="mt-3 flex flex-wrap gap-4">
                        {c.fileUrl && (
                          <a href={c.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-emerald-800 underline underline-offset-4">
                            View certificate <ExternalIcon size={14} />
                          </a>
                        )}
                        {c.verificationUrl && (
                          <a href={c.verificationUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 text-sm text-emerald-800 underline underline-offset-4">
                            Verify with issuer <ExternalIcon size={14} />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Disclosure>
            )}

            <Disclosure title="Care instructions" icon={<SparkleIcon size={18} />}>
              {product.careInstructions ? (
                <Paragraphs text={product.careInstructions} />
              ) : (
                <p>
                  See our <Link href="/policies/care" className="text-emerald-800 underline underline-offset-4">jewellery care guide</Link> for general advice.
                </p>
              )}
            </Disclosure>

            <Disclosure title="Delivery" icon={<TruckIcon size={18} />}>
              {settings.shippingInfo ? <Paragraphs text={settings.shippingInfo} /> : <p>Delivery options, timelines and charges are confirmed with you when you enquire.</p>}
              <p className="mt-3">
                <Link href="/policies/shipping" className="text-emerald-800 underline underline-offset-4">Shipping &amp; delivery policy</Link>
              </p>
            </Disclosure>

            <Disclosure title="Returns & exchanges" icon={<ReturnIcon size={18} />}>
              {settings.returnsSummary ? <Paragraphs text={settings.returnsSummary} /> : <p>Return and exchange terms are confirmed with you before purchase.</p>}
              <p className="mt-3">
                <Link href="/policies/returns" className="text-emerald-800 underline underline-offset-4">Returns, refunds &amp; exchanges policy</Link>
              </p>
            </Disclosure>
          </div>
        </div>
      </div>

      <section id="product-enquiry" aria-labelledby="enquiry-title" className="mx-auto mt-20 max-w-3xl scroll-mt-28 border border-sand bg-white p-6 sm:p-10">
        <p className="eyebrow">Enquire</p>
        <h2 id="enquiry-title" className="mt-2 text-3xl sm:text-4xl">Ask about this piece</h2>
        <p className="mt-2 mb-6 text-sm text-muted">Send us your question and we will reply by email or phone.</p>
        {preview ? (
          <p className="text-sm text-muted">The enquiry form is disabled in admin preview.</p>
        ) : (
          <EnquiryForm productId={product.id} productName={product.name} />
        )}
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-24">
          <SectionHeading id="related-title" eyebrow="You may also like" title="Related pieces" />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
