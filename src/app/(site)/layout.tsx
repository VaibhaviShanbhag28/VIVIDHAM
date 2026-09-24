import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { Footer } from "@/components/site/Footer";
import { Header, type NavItem } from "@/components/site/Header";
import { WhatsAppFloat } from "@/components/site/WhatsAppFloat";
import { getNavCategories } from "@/lib/catalogue/queries";
import { getSiteSettings } from "@/lib/settings";
import { buildGeneralEnquiryMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

// Content is edited live from the admin dashboard, so render on request.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSiteSettings(), getNavCategories()]);
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, buildGeneralEnquiryMessage(settings.businessName));

  const nav: NavItem[] = [
    { label: "Shop", href: "/shop" },
    ...categories.slice(0, 5).map((c) => ({ label: c.name, href: `/shop?category=${c.slug}` })),
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-sm focus:bg-emerald-900 focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to content
      </a>
      {settings.announcementEnabled && <AnnouncementBar text={settings.announcementText} link={settings.announcementLink} />}
      <Header businessName={settings.businessName} logoUrl={settings.logoUrl} nav={nav} whatsappUrl={whatsappUrl} />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>
      <Footer settings={settings} categories={categories} />
      <WhatsAppFloat href={whatsappUrl} />
    </>
  );
}
