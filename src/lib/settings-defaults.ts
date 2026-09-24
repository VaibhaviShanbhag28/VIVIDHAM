export interface TrustHighlight {
  title: string;
  description: string | null;
}

export interface SiteSettings {
  businessName: string;
  tagline: string | null;
  logoUrl: string | null;
  brandStory: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  mapUrl: string | null;
  businessHours: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  pinterestUrl: string | null;
  announcementEnabled: boolean;
  announcementText: string | null;
  announcementLink: string | null;
  heroEyebrow: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroCtaLabel: string | null;
  heroCtaHref: string | null;
  heroImageUrl: string | null;
  trustHighlights: TrustHighlight[];
  footerText: string | null;
  currencyCode: string;
  shippingInfo: string | null;
  returnsSummary: string | null;
  updatedAt: string | null;
}

/**
 * Placeholder defaults used until the client supplies real details.
 * Deliberately contains no contact data and no quality / authenticity claims.
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  businessName: "VIVIDHUM JEWELLERY",
  tagline: "Fine jewellery & gemstones",
  logoUrl: null,
  brandStory: null,
  phone: null,
  whatsappNumber: null,
  email: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  postalCode: null,
  country: "India",
  mapUrl: null,
  businessHours: null,
  instagramUrl: null,
  facebookUrl: null,
  youtubeUrl: null,
  pinterestUrl: null,
  announcementEnabled: true,
  announcementText: "Enquire on WhatsApp for availability, pricing and personalised assistance",
  announcementLink: "/shop",
  heroEyebrow: "Fine jewellery & gemstones",
  heroTitle: "Crafted to be treasured",
  heroSubtitle:
    "Discover jewellery and gemstones selected for colour, character and craftsmanship — and speak with us directly to make a piece yours.",
  heroCtaLabel: "Shop the collection",
  heroCtaHref: "/shop",
  heroImageUrl: null,
  trustHighlights: [
    { title: "Personal assistance", description: "Talk to us on WhatsApp about sizing, details and custom requests." },
    { title: "Clear product details", description: "Listings show only the specifications and certificates we can verify." },
    { title: "Confirmed before you pay", description: "Availability, final price and delivery are confirmed with you directly." },
    { title: "Custom creations", description: "Ask us about bespoke designs for special occasions." },
  ],
  footerText: null,
  currencyCode: "INR",
  shippingInfo: null,
  returnsSummary: null,
  updatedAt: null,
};
