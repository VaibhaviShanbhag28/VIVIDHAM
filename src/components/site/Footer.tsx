import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon, PinterestIcon, WhatsAppIcon, YoutubeIcon } from "@/components/icons";
import { formatAddress, type SiteSettings } from "@/lib/settings";
import { buildGeneralEnquiryMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

export function Footer({ settings, categories }: { settings: SiteSettings; categories: { name: string; slug: string }[] }) {
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, buildGeneralEnquiryMessage(settings.businessName));
  const address = formatAddress(settings);
  const socials = [
    { href: settings.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    { href: settings.facebookUrl, label: "Facebook", Icon: FacebookIcon },
    { href: settings.youtubeUrl, label: "YouTube", Icon: YoutubeIcon },
    { href: settings.pinterestUrl, label: "Pinterest", Icon: PinterestIcon },
  ].filter((s): s is { href: string; label: string; Icon: typeof InstagramIcon } => !!s.href);

  return (
    <footer className="mt-24 bg-emerald-950 text-emerald-100">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Wordmark logoUrl={null} businessName={settings.businessName} tone="light" className="items-start" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-emerald-100/80">
            {settings.footerText ?? settings.tagline ?? "Fine jewellery and gemstones, presented with care."}
          </p>
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-2" aria-label="Social media">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100/25 hover:border-gold-300 hover:text-gold-300"
                  >
                    <Icon size={18} />
                    <span className="sr-only">{label} (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Shop" className="lg:col-span-2">
          <h2 className="font-sans text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase">Shop</h2>
          <ul className="mt-5 space-y-3 text-sm">
            <li><Link href="/shop" className="hover:text-white">All jewellery</Link></li>
            {categories.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className="hover:text-white">{c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Information" className="lg:col-span-2">
          <h2 className="font-sans text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase">Information</h2>
          <ul className="mt-5 space-y-3 text-sm">
            <li><Link href="/about" className="hover:text-white">About us</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/policies/shipping" className="hover:text-white">Shipping &amp; delivery</Link></li>
            <li><Link href="/policies/returns" className="hover:text-white">Returns &amp; exchanges</Link></li>
            <li><Link href="/policies/care" className="hover:text-white">Jewellery care</Link></li>
            <li><Link href="/policies/privacy" className="hover:text-white">Privacy policy</Link></li>
            <li><Link href="/policies/terms" className="hover:text-white">Terms &amp; conditions</Link></li>
          </ul>
        </nav>

        <div className="lg:col-span-4">
          <h2 className="font-sans text-xs font-semibold tracking-[0.2em] text-gold-300 uppercase">Visit &amp; contact</h2>
          <ul className="mt-5 space-y-4 text-sm">
            {address.length > 0 && (
              <li className="flex gap-3">
                <PinIcon className="mt-0.5 shrink-0 text-gold-300" size={18} />
                <address className="not-italic leading-relaxed">
                  {address.map((line) => (
                    <span key={line} className="block">{line}</span>
                  ))}
                </address>
              </li>
            )}
            {settings.phone && (
              <li className="flex gap-3">
                <PhoneIcon className="shrink-0 text-gold-300" size={18} />
                <a href={`tel:${settings.phone}`} className="hover:text-white">{settings.phone}</a>
              </li>
            )}
            {settings.email && (
              <li className="flex gap-3">
                <MailIcon className="shrink-0 text-gold-300" size={18} />
                <a href={`mailto:${settings.email}`} className="hover:text-white">{settings.email}</a>
              </li>
            )}
            {!address.length && !settings.phone && !settings.email && (
              <li className="text-emerald-100/70">Contact details will appear here once configured.</li>
            )}
          </ul>
          {whatsappUrl ? (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-6">
              <WhatsAppIcon /> Chat on WhatsApp
            </a>
          ) : (
            <p className="mt-6 text-xs text-emerald-100/60">WhatsApp contact will be available soon.</p>
          )}
        </div>
      </div>
      <div className="border-t border-emerald-100/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-emerald-100/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {settings.businessName}. All rights reserved.</p>
          <p>Prices shown in INR. Availability and final pricing are confirmed on enquiry.</p>
        </div>
      </div>
    </footer>
  );
}
