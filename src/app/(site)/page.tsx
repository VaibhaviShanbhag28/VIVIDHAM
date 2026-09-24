import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GemIcon, HandIcon, InstagramIcon, ShieldIcon, SparkleIcon, WhatsAppIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getFeaturedCategories, getHomeCollections } from "@/lib/catalogue/queries";
import { getSiteSettings } from "@/lib/settings";
import { buildGeneralEnquiryMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

const HIGHLIGHT_ICONS = [HandIcon, ShieldIcon, GemIcon, SparkleIcon];

const DEFAULT_BRAND_STORY =
  "VIVIDHUM brings together jewellery and gemstones chosen for their colour, character and craftsmanship. Every piece is presented with the details that matter, and every purchase begins with a personal conversation — so you can ask questions, see more, and choose with confidence.";

export default async function HomePage() {
  const [settings, categories, collections] = await Promise.all([getSiteSettings(), getFeaturedCategories(8), getHomeCollections()]);
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, buildGeneralEnquiryMessage(settings.businessName));
  const heroImage = settings.heroImageUrl ?? "/demo/hero.webp";
  const instagramHandle = settings.instagramUrl ? new URL(settings.instagramUrl).pathname.replace(/\//g, "") : null;
  const moodboard = [...collections.featured, ...collections.newArrivals].filter((p) => p.primaryImage).slice(0, 6);

  return (
    <>
      {/* ───── Hero ───── */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden bg-cream">
        <div className="container-page grid items-center gap-10 py-12 md:grid-cols-2 md:py-16 lg:gap-16 lg:py-20">
          <div className="order-2 animate-fade-in md:order-1">
            {settings.heroEyebrow && <p className="eyebrow">{settings.heroEyebrow}</p>}
            <h1 id="hero-title" className="mt-4 text-5xl leading-[1.05] text-emerald-950 sm:text-6xl lg:text-7xl">
              {settings.heroTitle ?? "Crafted to be treasured"}
            </h1>
            {settings.heroSubtitle && <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">{settings.heroSubtitle}</p>}
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={settings.heroCtaHref ?? "/shop"} className="btn btn-primary">
                {settings.heroCtaLabel ?? "Shop the collection"} <ArrowRight size={16} />
              </Link>
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  <WhatsAppIcon size={18} /> Enquire on WhatsApp
                </a>
              )}
            </div>
          </div>
          <div className="relative order-1 md:order-2">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-t-[12rem] shadow-lift md:max-w-none">
              <Image src={heroImage} alt="Featured jewellery from VIVIDHUM" fill priority sizes="(min-width: 768px) 45vw, 90vw" className="object-cover" />
            </div>
            <div aria-hidden className="absolute -bottom-6 -left-6 hidden h-32 w-32 rounded-full border border-gold-300 md:block" />
          </div>
        </div>
      </section>

      {/* ───── Categories ───── */}
      {categories.length > 0 && (
        <section aria-labelledby="categories-title" className="container-page py-20 sm:py-24">
          <SectionHeading id="categories-title" eyebrow="Explore" title="Shop by category" description="From everyday elegance to heirloom pieces — find the jewellery that speaks to you." />
          <ul className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {categories.map((c) => (
              <li key={c.id} className="w-[62%] shrink-0 snap-start sm:w-auto">
                <Link href={`/shop?category=${c.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-full bg-sand">
                    {c.imageUrl ? (
                      <Image src={c.imageUrl} alt="" fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 60vw" className="object-cover transition duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gold-600"><GemIcon size={48} /></div>
                    )}
                  </div>
                  <p className="mt-4 text-center font-serif text-2xl text-ink group-hover:text-emerald-800">{c.name}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ───── New arrivals ───── */}
      {collections.newArrivals.length > 0 && (
        <section aria-labelledby="new-title" className="container-page pb-20 sm:pb-24">
          <SectionHeading id="new-title" eyebrow="Just in" title="New arrivals" href="/shop?sort=newest" hrefLabel="See what's new" align="left" />
          <ProductGrid products={collections.newArrivals.slice(0, 4)} />
        </section>
      )}

      {/* ───── Gemstone collection ───── */}
      <section aria-labelledby="gem-title" className="bg-emerald-950 text-ivory">
        <div className="container-page grid gap-12 py-20 sm:py-24 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="eyebrow !text-gold-300">The gemstone edit</p>
            <h2 id="gem-title" className="mt-4 text-4xl leading-tight !text-ivory sm:text-5xl">
              Colour, chosen with care
            </h2>
            <p className="mt-5 leading-relaxed text-emerald-100/85">
              Explore our curated gemstones and gemstone jewellery. Where a stone has been independently certified, the
              certificate details are shown on the product page.
            </p>
            <Link href="/shop?category=gemstones" className="btn btn-gold mt-8">
              Explore gemstones <ArrowRight size={16} />
            </Link>
          </div>
          <div className="lg:col-span-8">
            {collections.gemstones.length > 0 ? (
              <ul className="grid grid-cols-2 gap-4 sm:gap-6">
                {collections.gemstones.slice(0, 4).map((p) => (
                  <li key={p.id}>
                    <Link href={`/product/${p.slug}`} className="group block">
                      <div className="relative aspect-[4/5] overflow-hidden bg-emerald-900">
                        {p.primaryImage && (
                          <Image src={p.primaryImage.url} alt={p.primaryImage.alt ?? p.name} fill sizes="(min-width: 1024px) 30vw, 45vw" className="object-cover transition duration-700 group-hover:scale-105" />
                        )}
                        {p.isDemo && <span className="absolute top-3 left-3 bg-ink/80 px-2 py-1 text-[0.6rem] font-semibold tracking-[0.18em] text-ivory uppercase">Demo</span>}
                      </div>
                      <p className="mt-3 font-serif text-xl text-ivory group-hover:text-gold-300">{p.name}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-emerald-100/70">Gemstones will appear here once published.</p>
            )}
          </div>
        </div>
      </section>

      {/* ───── Featured ───── */}
      {collections.featured.length > 0 && (
        <section aria-labelledby="featured-title" className="container-page py-20 sm:py-24">
          <SectionHeading id="featured-title" eyebrow="Curated for you" title="Featured pieces" href="/shop" hrefLabel="Shop all" align="left" />
          <ProductGrid products={collections.featured.slice(0, 8)} />
        </section>
      )}

      {/* ───── Brand story ───── */}
      <section aria-labelledby="story-title" className="bg-cream">
        <div className="container-page grid items-center gap-12 py-20 sm:py-24 md:grid-cols-2 lg:gap-20">
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image src="/demo/story.webp" alt="" fill sizes="(min-width: 768px) 45vw, 90vw" className="object-cover" />
          </div>
          <div>
            <p className="eyebrow">Our story</p>
            <h2 id="story-title" className="mt-4 text-4xl leading-tight sm:text-5xl">
              {settings.tagline ?? "Jewellery with a story to tell"}
            </h2>
            <div className="mt-6 space-y-4 leading-relaxed text-muted">
              {(settings.brandStory ?? DEFAULT_BRAND_STORY).split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <Link href="/about" className="btn btn-outline mt-8">
              Discover more
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Trust highlights ───── */}
      {settings.trustHighlights.length > 0 && (
        <section aria-label="Why shop with us" className="border-b border-sand">
          <ul className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
            {settings.trustHighlights.map((h, i) => {
              const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length];
              return (
                <li key={h.title} className="flex flex-col items-center text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-300 text-gold-600">
                    <Icon size={24} />
                  </span>
                  <h3 className="mt-4 text-2xl">{h.title}</h3>
                  {h.description && <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{h.description}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ───── Instagram / social ───── */}
      {settings.instagramUrl && (
        <section aria-labelledby="insta-title" className="container-page py-20 sm:py-24">
          <SectionHeading id="insta-title" eyebrow="Follow along" title={instagramHandle ? `@${instagramHandle}` : "On Instagram"} description="New pieces, behind-the-scenes and styling ideas." />
          {moodboard.length > 0 && (
            <ul className="grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-6" aria-hidden>
              {moodboard.map((p) => (
                <li key={p.id} className="relative aspect-square overflow-hidden bg-cream">
                  <Image src={p.primaryImage!.url} alt="" fill sizes="(min-width: 1024px) 16vw, 33vw" className="object-cover" />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-10 text-center">
            <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              <InstagramIcon size={18} /> Follow on Instagram
            </a>
          </div>
        </section>
      )}

      {/* ───── WhatsApp CTA ───── */}
      <section aria-labelledby="wa-title" className="container-page pt-20 sm:pt-24">
        <div className="relative overflow-hidden bg-emerald-900 px-6 py-14 text-center sm:px-12">
          <div aria-hidden className="absolute -top-24 -right-24 h-72 w-72 rounded-full border border-gold-500/30" />
          <div aria-hidden className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full border border-gold-500/20" />
          <p className="eyebrow !text-gold-300">Personal assistance</p>
          <h2 id="wa-title" className="mx-auto mt-4 max-w-2xl text-4xl leading-tight !text-ivory sm:text-5xl">
            Looking for something special?
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-emerald-100/85">
            Ask about availability, sizing, custom designs or more photographs — we are happy to help.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {whatsappUrl ? (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <WhatsAppIcon /> Chat on WhatsApp
              </a>
            ) : null}
            <Link href="/contact" className="btn btn-gold">
              Send an enquiry
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
