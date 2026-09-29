"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { saveSettingsAction } from "@/app/admin/actions/settings";
import { PlusIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { Notice } from "@/components/ui/Notice";
import { fieldErrors } from "@/lib/validation/common";
import { siteSettingsInput } from "@/lib/validation/settings";
import { ErrorSummary, TextArea, TextField, Toggle, uploadFile } from "./fields";

export interface SettingsFormValues {
  businessName: string;
  tagline: string;
  logoUrl: string;
  brandStory: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  mapUrl: string;
  businessHours: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  pinterestUrl: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementLink: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  heroCtaHref: string;
  heroImageUrl: string;
  trustHighlights: { title: string; description: string }[];
  footerText: string;
  currencyCode: "INR";
  shippingInfo: string;
  returnsSummary: string;
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="card-surface scroll-mt-6 space-y-5 p-5 sm:p-6">
      <div>
        <h2 id={`${id}-title`} className="font-sans text-base font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function ImageUpload({ label, value, onChange, kind, hint }: { label: string; value: string; onChange: (v: string) => void; kind: "branding"; hint: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <p className="field-label">{label}</p>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex h-20 w-40 items-center justify-center overflow-hidden rounded-sm border border-sand bg-cream">
          {value ? <Image src={value} alt="" fill sizes="160px" className="object-contain" /> : <span className="text-xs text-subtle">None</span>}
        </div>
        <label className="btn btn-ghost btn-sm cursor-pointer border border-sand">
          <UploadIcon size={16} /> {busy ? "Uploading…" : value ? "Replace" : "Upload"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={busy}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              setError(null);
              try {
                onChange((await uploadFile(f, kind)).url);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Upload failed");
              }
              setBusy(false);
            }}
          />
        </label>
        {value && <button type="button" className="text-sm text-ruby-700 underline" onClick={() => onChange("")}>Remove</button>}
      </div>
      <p className="field-hint">{hint}</p>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function SettingsForm({ initial }: { initial: SettingsFormValues }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof SettingsFormValues>(k: K, val: SettingsFormValues[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    setSaved(false);
  };
  const e = (k: string) => errors[k];

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const parsed = siteSettingsInput.safeParse(v);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      requestAnimationFrame(() => document.getElementById("form-errors")?.focus());
      return;
    }
    setErrors({});
    startTransition(async () => {
      try {
        const res = await saveSettingsAction(v);
        if (!res.ok) {
          setErrors(res.errors);
          requestAnimationFrame(() => document.getElementById("form-errors")?.focus());
        } else setSaved(true);
      } catch {
        setErrors({ _form: "Saving failed. Your session may have expired — please sign in again." });
      }
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <ErrorSummary errors={errors} />
      {saved && <Notice tone="success">Settings saved. Changes are live on the website.</Notice>}

      <Section id="brand" title="Brand" description="Your business name, logo and story.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Business name" required value={v.businessName} onChange={(x) => set("businessName", x)} maxLength={120} error={e("businessName")} />
          <TextField label="Tagline" value={v.tagline} onChange={(x) => set("tagline", x)} maxLength={200} error={e("tagline")} />
        </div>
        <ImageUpload label="Logo" value={v.logoUrl} onChange={(x) => set("logoUrl", x)} kind="branding" hint="Transparent PNG or WebP recommended, at least 400px wide. Square or circular works best. Leave empty to use the built-in VIVIDHAM Collection logo." />
        <TextArea label="Brand story" value={v.brandStory} onChange={(x) => set("brandStory", x)} rows={5} maxLength={4000} error={e("brandStory")} hint="Shown on the home page. Leave a blank line between paragraphs." />
      </Section>

      <Section id="contact" title="Contact details" description="Shown in the header, footer, contact page and used for WhatsApp enquiries.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="WhatsApp number" value={v.whatsappNumber} onChange={(x) => set("whatsappNumber", x)} inputMode="tel" error={e("whatsappNumber")} hint="International format with country code, e.g. +91 98765 43210" placeholder="+91 …" />
          <TextField label="Phone number" value={v.phone} onChange={(x) => set("phone", x)} inputMode="tel" error={e("phone")} placeholder="+91 …" />
          <TextField label="Email" type="email" value={v.email} onChange={(x) => set("email", x)} error={e("email")} />
          <TextField label="Map link" value={v.mapUrl} onChange={(x) => set("mapUrl", x)} error={e("mapUrl")} hint="Google Maps or similar https:// link" />
          <TextField label="Address line 1" value={v.addressLine1} onChange={(x) => set("addressLine1", x)} maxLength={200} error={e("addressLine1")} />
          <TextField label="Address line 2" value={v.addressLine2} onChange={(x) => set("addressLine2", x)} maxLength={200} error={e("addressLine2")} />
          <TextField label="City" value={v.city} onChange={(x) => set("city", x)} maxLength={80} error={e("city")} />
          <TextField label="State" value={v.state} onChange={(x) => set("state", x)} maxLength={80} error={e("state")} />
          <TextField label="PIN / postal code" value={v.postalCode} onChange={(x) => set("postalCode", x)} maxLength={12} error={e("postalCode")} />
          <TextField label="Country" value={v.country} onChange={(x) => set("country", x)} maxLength={80} error={e("country")} />
        </div>
        <TextArea label="Business hours" value={v.businessHours} onChange={(x) => set("businessHours", x)} rows={3} maxLength={1000} error={e("businessHours")} placeholder={"Mon–Sat: 11:00 am – 8:00 pm\nSunday: by appointment"} />
      </Section>

      <Section id="social" title="Social media" description="Only https:// links on the matching website are accepted.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Instagram" value={v.instagramUrl} onChange={(x) => set("instagramUrl", x)} error={e("instagramUrl")} placeholder="https://www.instagram.com/…" />
          <TextField label="Facebook" value={v.facebookUrl} onChange={(x) => set("facebookUrl", x)} error={e("facebookUrl")} placeholder="https://www.facebook.com/…" />
          <TextField label="YouTube" value={v.youtubeUrl} onChange={(x) => set("youtubeUrl", x)} error={e("youtubeUrl")} placeholder="https://www.youtube.com/…" />
          <TextField label="Pinterest" value={v.pinterestUrl} onChange={(x) => set("pinterestUrl", x)} error={e("pinterestUrl")} placeholder="https://www.pinterest.com/…" />
        </div>
      </Section>

      <Section id="homepage" title="Home page" description="Announcement bar and hero banner.">
        <Toggle label="Show announcement bar" checked={v.announcementEnabled} onChange={(x) => set("announcementEnabled", x)} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Announcement text" value={v.announcementText} onChange={(x) => set("announcementText", x)} maxLength={200} error={e("announcementText")} />
          <TextField label="Announcement link" value={v.announcementLink} onChange={(x) => set("announcementLink", x)} error={e("announcementLink")} hint="e.g. /shop?category=bridal-jewellery" />
          <TextField label="Hero eyebrow" value={v.heroEyebrow} onChange={(x) => set("heroEyebrow", x)} maxLength={80} error={e("heroEyebrow")} />
          <TextField label="Hero headline" value={v.heroTitle} onChange={(x) => set("heroTitle", x)} maxLength={120} error={e("heroTitle")} />
          <TextField label="Hero button label" value={v.heroCtaLabel} onChange={(x) => set("heroCtaLabel", x)} maxLength={40} error={e("heroCtaLabel")} />
          <TextField label="Hero button link" value={v.heroCtaHref} onChange={(x) => set("heroCtaHref", x)} error={e("heroCtaHref")} />
        </div>
        <TextArea label="Hero supporting text" value={v.heroSubtitle} onChange={(x) => set("heroSubtitle", x)} rows={2} maxLength={300} error={e("heroSubtitle")} />
        <ImageUpload label="Hero image" value={v.heroImageUrl} onChange={(x) => set("heroImageUrl", x)} kind="branding" hint="Portrait image (4:5), at least 1200px tall. Leave empty to use the placeholder." />
      </Section>

      <Section id="trust" title="Trust & service highlights" description="Up to 6 short statements shown on the home page. Only include promises the business can keep.">
        <ol className="space-y-4">
          {v.trustHighlights.map((h, i) => (
            <li key={i} className="grid gap-3 rounded-sm border border-sand p-4 sm:grid-cols-[1fr_2fr_auto] sm:items-start">
              <TextField label={`Title ${i + 1}`} value={h.title} onChange={(x) => set("trustHighlights", v.trustHighlights.map((t, j) => (j === i ? { ...t, title: x } : t)))} maxLength={60} error={e(`trustHighlights.${i}.title`)} />
              <TextField label="Description" value={h.description} onChange={(x) => set("trustHighlights", v.trustHighlights.map((t, j) => (j === i ? { ...t, description: x } : t)))} maxLength={200} error={e(`trustHighlights.${i}.description`)} />
              <button type="button" onClick={() => set("trustHighlights", v.trustHighlights.filter((_, j) => j !== i))} className="inline-flex h-11 w-11 items-center justify-center self-end text-ruby-700 hover:bg-ruby-50">
                <TrashIcon size={16} /><span className="sr-only">Remove highlight {i + 1}</span>
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="btn btn-outline btn-sm" disabled={v.trustHighlights.length >= 6} onClick={() => set("trustHighlights", [...v.trustHighlights, { title: "", description: "" }])}>
          <PlusIcon size={16} /> Add highlight
        </button>
      </Section>

      <Section id="policies" title="Shipping, returns & footer" description="Short summaries shown on product pages. Full policies are edited under Pages & policies.">
        <TextArea label="Shipping information" value={v.shippingInfo} onChange={(x) => set("shippingInfo", x)} rows={4} maxLength={4000} error={e("shippingInfo")} hint="Only include client-approved terms." />
        <TextArea label="Returns & exchanges summary" value={v.returnsSummary} onChange={(x) => set("returnsSummary", x)} rows={4} maxLength={4000} error={e("returnsSummary")} hint="Only include client-approved terms." />
        <TextArea label="Footer text" value={v.footerText} onChange={(x) => set("footerText", x)} rows={2} maxLength={500} error={e("footerText")} />
        <p className="text-sm text-muted">Currency: <strong>Indian Rupee (INR, ₹)</strong>. Other currencies are not supported in this release.</p>
      </Section>

      <div className="sticky bottom-0 -mx-4 border-t border-sand bg-[#f7f4ee]/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save settings"}</button>
      </div>
    </form>
  );
}
