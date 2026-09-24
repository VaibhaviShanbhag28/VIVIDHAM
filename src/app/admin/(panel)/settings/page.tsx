import { AdminPageHeader } from "@/components/admin/AdminUI";
import { SettingsForm, type SettingsFormValues } from "@/components/admin/SettingsForm";
import { requireAdminPage } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/settings";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdminPage();
  // Read directly (uncached) so the form always shows the latest saved values.
  const row = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  const s = row ?? { ...DEFAULT_SETTINGS, trustHighlights: DEFAULT_SETTINGS.trustHighlights };
  const str = (x: string | null | undefined) => x ?? "";
  const highlights = Array.isArray(s.trustHighlights) ? (s.trustHighlights as { title?: string; description?: string | null }[]) : DEFAULT_SETTINGS.trustHighlights;

  const initial: SettingsFormValues = {
    businessName: s.businessName,
    tagline: str(s.tagline),
    logoUrl: str(s.logoUrl),
    brandStory: str(s.brandStory),
    phone: str(s.phone),
    whatsappNumber: s.whatsappNumber ? `+${s.whatsappNumber}` : "",
    email: str(s.email),
    addressLine1: str(s.addressLine1),
    addressLine2: str(s.addressLine2),
    city: str(s.city),
    state: str(s.state),
    postalCode: str(s.postalCode),
    country: str(s.country),
    mapUrl: str(s.mapUrl),
    businessHours: str(s.businessHours),
    instagramUrl: str(s.instagramUrl),
    facebookUrl: str(s.facebookUrl),
    youtubeUrl: str(s.youtubeUrl),
    pinterestUrl: str(s.pinterestUrl),
    announcementEnabled: s.announcementEnabled,
    announcementText: str(s.announcementText),
    announcementLink: str(s.announcementLink),
    heroEyebrow: str(s.heroEyebrow),
    heroTitle: str(s.heroTitle),
    heroSubtitle: str(s.heroSubtitle),
    heroCtaLabel: str(s.heroCtaLabel),
    heroCtaHref: str(s.heroCtaHref),
    heroImageUrl: str(s.heroImageUrl),
    trustHighlights: highlights.map((h) => ({ title: h.title ?? "", description: h.description ?? "" })),
    footerText: str(s.footerText),
    currencyCode: "INR",
    shippingInfo: str(s.shippingInfo),
    returnsSummary: str(s.returnsSummary),
  };

  return (
    <>
      <AdminPageHeader title="Business settings" description="Update the details shown across the website. Links and phone numbers are validated before saving." />
      <nav aria-label="Settings sections" className="mb-6 flex flex-wrap gap-2 text-sm">
        {[
          ["#brand", "Brand"],
          ["#contact", "Contact"],
          ["#social", "Social"],
          ["#homepage", "Home page"],
          ["#trust", "Highlights"],
          ["#policies", "Shipping & footer"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-full border border-sand bg-white px-3 py-1 hover:border-emerald-800">{label}</a>
        ))}
      </nav>
      <div className="max-w-4xl">
        <SettingsForm initial={initial} />
      </div>
    </>
  );
}
