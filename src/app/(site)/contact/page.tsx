import type { Metadata } from "next";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { ClockIcon, ExternalIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/icons";
import { Notice } from "@/components/ui/Notice";
import { formatAddress, getSiteSettings } from "@/lib/settings";
import { buildGeneralEnquiryMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Contact VIVIDHUM JEWELLERY by WhatsApp, phone or email, or send us an enquiry.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const address = formatAddress(settings);
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, buildGeneralEnquiryMessage(settings.businessName));
  const hasDetails = address.length || settings.phone || settings.email || settings.businessHours;

  return (
    <div className="container-page py-14 sm:py-20">
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">We&apos;re here to help</p>
        <h1 className="mt-4 text-5xl sm:text-6xl">Contact us</h1>
        <p className="mt-4 text-lg text-muted">
          Questions about a piece, sizing, custom designs or delivery? Message us on WhatsApp or send an enquiry below.
        </p>
      </header>

      <div className="mt-14 grid gap-12 lg:grid-cols-5 lg:gap-16">
        <aside className="lg:col-span-2">
          <div className="space-y-8">
            <div className="bg-emerald-900 p-8 text-ivory">
              <h2 className="text-3xl !text-ivory">Chat on WhatsApp</h2>
              <p className="mt-3 text-sm leading-relaxed text-emerald-100/85">The quickest way to reach us. You will be able to review the message before sending it.</p>
              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-6 w-full">
                  <WhatsAppIcon /> Open WhatsApp
                </a>
              ) : (
                <p className="mt-6 rounded-sm bg-emerald-950/50 p-3 text-sm text-gold-100">
                  WhatsApp contact is being set up. Please use the enquiry form for now.
                </p>
              )}
            </div>

            {hasDetails ? (
              <ul className="space-y-6 text-sm">
                {address.length > 0 && (
                  <li className="flex gap-4">
                    <PinIcon className="mt-0.5 shrink-0 text-gold-600" />
                    <div>
                      <h3 className="font-sans text-xs font-semibold tracking-[0.16em] uppercase">Address</h3>
                      <address className="mt-1.5 leading-relaxed text-muted not-italic">
                        {address.map((l) => <span key={l} className="block">{l}</span>)}
                      </address>
                      {settings.mapUrl && (
                        <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-emerald-800 underline underline-offset-4">
                          Open in maps <ExternalIcon size={14} />
                        </a>
                      )}
                    </div>
                  </li>
                )}
                {settings.phone && (
                  <li className="flex gap-4">
                    <PhoneIcon className="mt-0.5 shrink-0 text-gold-600" />
                    <div>
                      <h3 className="font-sans text-xs font-semibold tracking-[0.16em] uppercase">Phone</h3>
                      <a href={`tel:${settings.phone}`} className="mt-1.5 block text-muted hover:text-ink">{settings.phone}</a>
                    </div>
                  </li>
                )}
                {settings.email && (
                  <li className="flex gap-4">
                    <MailIcon className="mt-0.5 shrink-0 text-gold-600" />
                    <div>
                      <h3 className="font-sans text-xs font-semibold tracking-[0.16em] uppercase">Email</h3>
                      <a href={`mailto:${settings.email}`} className="mt-1.5 block text-muted hover:text-ink">{settings.email}</a>
                    </div>
                  </li>
                )}
                {settings.businessHours && (
                  <li className="flex gap-4">
                    <ClockIcon className="mt-0.5 shrink-0 text-gold-600" />
                    <div>
                      <h3 className="font-sans text-xs font-semibold tracking-[0.16em] uppercase">Business hours</h3>
                      <p className="mt-1.5 whitespace-pre-line text-muted">{settings.businessHours}</p>
                    </div>
                  </li>
                )}
                {settings.instagramUrl && (
                  <li className="flex gap-4">
                    <InstagramIcon className="mt-0.5 shrink-0 text-gold-600" />
                    <div>
                      <h3 className="font-sans text-xs font-semibold tracking-[0.16em] uppercase">Instagram</h3>
                      <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 block text-muted hover:text-ink">
                        {settings.instagramUrl.replace(/^https:\/\/(www\.)?/, "")}
                      </a>
                    </div>
                  </li>
                )}
              </ul>
            ) : (
              <Notice tone="info">Our address, phone number and business hours will be published here soon.</Notice>
            )}
          </div>
        </aside>

        <section aria-labelledby="form-title" className="border border-sand bg-white p-6 sm:p-10 lg:col-span-3">
          <h2 id="form-title" className="text-3xl sm:text-4xl">Send an enquiry</h2>
          <p className="mt-2 mb-8 text-sm text-muted">Fields marked * are required. We only use your details to reply to you.</p>
          <EnquiryForm />
        </section>
      </div>
    </div>
  );
}
