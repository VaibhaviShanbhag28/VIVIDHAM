/**
 * Starter templates for editable pages. They are intentionally generic and
 * marked as awaiting client approval — they must be reviewed (and, for legal
 * pages, checked by a qualified professional) before being approved.
 */
export interface ContentTemplate {
  slug: "about" | "shipping" | "returns" | "privacy" | "terms" | "care";
  title: string;
  summary: string;
  body: string;
}

export const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    slug: "about",
    title: "About VIVIDHUM JEWELLERY",
    summary: "Our story, craftsmanship and the values behind every piece.",
    body: `## Our story
[Client to provide: how and when VIVIDHUM JEWELLERY began, the people behind it, and what inspires the collection.]

## Craftsmanship
[Client to provide: how pieces are designed and made — techniques, workshops, artisans and quality checks.]

## Our values
- [Client to provide: value one — e.g. transparency in how products are described]
- [Client to provide: value two]
- [Client to provide: value three]

## Gemstone expertise
[Client to provide: how gemstones are selected, which laboratories issue certificates for certified stones, and what information customers can expect.]

## Visit or contact us
We are happy to answer questions about any piece. [Contact us](/contact) or message us on WhatsApp.`,
  },
  {
    slug: "shipping",
    title: "Shipping & Delivery",
    summary: "How and when your jewellery is delivered.",
    body: `## Overview
[Client to confirm: regions served (within India / international), courier partners, and whether shipments are insured.]

## Processing time
[Client to confirm: typical time to dispatch in-stock items and made-to-order items.]

## Delivery timelines and charges
[Client to confirm: estimated delivery times and any shipping charges.]

## Tracking
[Client to confirm: how tracking details are shared with customers.]

## Important
Orders are confirmed only after the business has confirmed availability, final price, shipping and payment details directly with the customer.`,
  },
  {
    slug: "returns",
    title: "Returns, Refunds & Exchanges",
    summary: "Our approach to returns, refunds and exchanges.",
    body: `## Returns
[Client to confirm: whether returns are accepted, eligible items, time window and condition requirements.]

## Exchanges
[Client to confirm: exchange eligibility and process.]

## Refunds
[Client to confirm: refund method and processing time.]

## Non-returnable items
[Client to confirm: e.g. customised, engraved or resized pieces.]

## How to request a return or exchange
[Client to confirm: contact method and information required.]`,
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "How we collect, use and protect your information.",
    body: `## Information we collect
When you submit an enquiry form we store the details you choose to provide — your name, email and/or phone number, and your message — so that we can respond.

WhatsApp conversations take place inside WhatsApp and are subject to WhatsApp's own terms and privacy policy.

## How we use your information
We use enquiry details only to respond to you and to manage your enquiry. [Client to confirm any other uses.]

## Retention
[Client to confirm: how long enquiry records are kept.]

## Cookies and analytics
This website uses a strictly necessary cookie for the administrator login only. [Client to confirm whether any analytics service will be enabled.]

## Your rights and contact
[Client and legal adviser to complete: data-protection rights under applicable law and how to exercise them.]`,
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    summary: "Terms for using this website.",
    body: `## About this website
This website is a catalogue. Prices, availability and product details are provided for information and are confirmed directly with the customer before any purchase.

## Enquiries and orders
Submitting an enquiry or opening a WhatsApp conversation does not create an order or reserve a product.

## Pricing
Prices are shown in Indian Rupees (INR). [Client to confirm: tax treatment, making charges and how metal-rate changes affect final prices.]

## Product information
[Client to confirm: statement on photographs, natural variation in gemstones, and tolerances for weights and sizes.]

## Governing law
[Client and legal adviser to complete.]`,
  },
  {
    slug: "care",
    title: "Jewellery Care & Product Information",
    summary: "Keep your jewellery looking its best.",
    body: `## Everyday care
- Put jewellery on after applying perfume, lotion or make-up.
- Remove jewellery before swimming, bathing, exercise or household cleaning.
- Store pieces separately in a soft pouch or lined box to prevent scratches.

## Cleaning
- Wipe gently with a soft, lint-free cloth after wearing.
- Avoid harsh chemicals and ultrasonic cleaners unless advised for your specific piece.

## Gemstones
Some gemstones are sensitive to heat, light, chemicals or sudden temperature changes. [Client to add stone-specific guidance.]

## Product information
[Client to confirm: notes on photographs, natural variations, and how weights and sizes are measured.]`,
  },
];

export function getContentTemplate(slug: string) {
  return CONTENT_TEMPLATES.find((t) => t.slug === slug) ?? null;
}
