import { z } from "zod";
import { normaliseWhatsAppNumber } from "@/lib/whatsapp";
import { optionalEmail, optionalHttpsUrl, optionalLink, optionalPhone, optionalText, requiredText } from "./common";

const imageRef = z.preprocess(
  (v) => (typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : (v ?? null)),
  z
    .string()
    .max(600)
    .refine((s) => (s.startsWith("/") && !s.startsWith("//")) || s.startsWith("https://"), "Image must be an uploaded image or https:// link")
    .nullable(),
);

export const trustHighlightInput = z.object({
  title: requiredText(2, 60, "Highlight title"),
  description: optionalText(200, "Highlight description"),
});

export const siteSettingsInput = z.object({
  businessName: requiredText(2, 120, "Business name"),
  tagline: optionalText(200, "Tagline"),
  logoUrl: imageRef,
  brandStory: optionalText(4000, "Brand story"),

  phone: optionalPhone("Contact number"),
  whatsappNumber: z.preprocess(
    (v) => {
      if (typeof v !== "string" || v.trim() === "") return null;
      return normaliseWhatsAppNumber(v) ?? "__invalid__";
    },
    z
      .string()
      .regex(/^\d{8,15}$/, "WhatsApp number must be in international format with country code, e.g. +91 98765 43210")
      .nullable(),
  ),
  email: optionalEmail,
  addressLine1: optionalText(200, "Address line 1"),
  addressLine2: optionalText(200, "Address line 2"),
  city: optionalText(80, "City"),
  state: optionalText(80, "State"),
  postalCode: z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : null),
    z.string().regex(/^[A-Za-z0-9 -]{3,12}$/, "Enter a valid postal code").nullable(),
  ),
  country: optionalText(80, "Country"),
  mapUrl: optionalHttpsUrl("Map link", ["google.com", "goo.gl", "maps.app.goo.gl", "apple.com", "bing.com", "openstreetmap.org"]),
  businessHours: optionalText(1000, "Business hours"),

  instagramUrl: optionalHttpsUrl("Instagram link", ["instagram.com"]),
  facebookUrl: optionalHttpsUrl("Facebook link", ["facebook.com", "fb.com"]),
  youtubeUrl: optionalHttpsUrl("YouTube link", ["youtube.com", "youtu.be"]),
  pinterestUrl: optionalHttpsUrl("Pinterest link", ["pinterest.com", "pinterest.in", "pin.it"]),

  announcementEnabled: z.boolean(),
  announcementText: optionalText(200, "Announcement"),
  announcementLink: optionalLink("Announcement link"),

  heroEyebrow: optionalText(80, "Hero eyebrow"),
  heroTitle: optionalText(120, "Hero headline"),
  heroSubtitle: optionalText(300, "Hero supporting text"),
  heroCtaLabel: optionalText(40, "Hero button label"),
  heroCtaHref: optionalLink("Hero button link"),
  heroImageUrl: imageRef,

  trustHighlights: z.array(trustHighlightInput).max(6, "Up to 6 highlights").default([]),
  footerText: optionalText(500, "Footer text"),
  currencyCode: z.literal("INR", { error: "Only INR is supported at the moment" }),
  shippingInfo: optionalText(4000, "Shipping information"),
  returnsSummary: optionalText(4000, "Returns summary"),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsInput>;

export const CONTENT_PAGE_SLUGS = ["about", "shipping", "returns", "privacy", "terms", "care"] as const;

export const contentPageInput = z.object({
  slug: z.enum(CONTENT_PAGE_SLUGS),
  title: requiredText(2, 120, "Title"),
  summary: optionalText(300, "Summary"),
  body: requiredText(1, 30000, "Page content"),
  isApproved: z.boolean(),
});

export const categoryInput = z.object({
  name: requiredText(2, 80, "Category name"),
  slug: z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? null : v.trim().toLowerCase()) : null),
    z
      .string()
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may contain lowercase letters, numbers and hyphens only")
      .nullable(),
  ),
  description: optionalText(500, "Description"),
  imageUrl: imageRef,
  isActive: z.boolean(),
  showInNav: z.boolean(),
});

export type CategoryInput = z.infer<typeof categoryInput>;
