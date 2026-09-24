/**
 * Seeds starter categories, default site settings, editable page templates and
 * DEMONSTRATION products (isDemo = true — shown with a "Demo" badge, excluded
 * from the sitemap and structured data). Safe to run repeatedly.
 *
 *   npm run db:seed
 *
 * No admin account is created here — use `npm run admin:create`.
 */
import "../scripts/load-env";
import { Prisma, PrismaClient } from "@prisma/client";
import { CONTENT_TEMPLATES } from "../src/lib/content-defaults";
import { DEFAULT_SETTINGS } from "../src/lib/settings-defaults";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Necklaces", slug: "necklaces", description: "Statement necklaces, chokers and everyday chains.", showInNav: true },
  { name: "Earrings", slug: "earrings", description: "Studs, drops and jhumkas.", showInNav: true },
  { name: "Rings", slug: "rings", description: "Cocktail, engagement and everyday rings.", showInNav: true },
  { name: "Bangles", slug: "bangles", description: "Classic and gemstone-set bangles.", showInNav: false },
  { name: "Bracelets", slug: "bracelets", description: "Tennis bracelets, chains and cuffs.", showInNav: false },
  { name: "Pendants", slug: "pendants", description: "Pendants to wear alone or layered.", showInNav: false },
  { name: "Gemstones", slug: "gemstones", description: "Loose gemstones selected for colour and character.", showInNav: true },
  { name: "Bridal Jewellery", slug: "bridal-jewellery", description: "Sets and heirloom pieces for the wedding season.", showInNav: true },
  { name: "Custom Jewellery", slug: "custom-jewellery", description: "Designed with you, made for you.", showInNav: false },
];

interface DemoProduct {
  sku: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  categories: string[];
  jewelleryType: string;
  material?: string;
  metalPurity?: string;
  metalColour?: string;
  price: string | null;
  salePrice?: string;
  availability?: "IN_STOCK" | "MADE_TO_ORDER" | "ON_REQUEST" | "SOLD_OUT";
  isFeatured?: boolean;
  isNewArrival?: boolean;
  size?: string;
  dimensions?: string;
  grossWeightGrams?: string;
  images: string[];
  tags: string[];
  gemstones?: { type: string; colour?: string; cut?: string; shape?: string; caratWeight?: string; count?: number }[];
  certification?: { issuer: string; certificateNumber: string; notes: string };
}

const DEMO_NOTE =
  "\n\nThis is a demonstration listing created to preview the website. The description, specifications, price and illustration are placeholders and do not describe a real item.";

const PRODUCTS: DemoProduct[] = [
  {
    sku: "DEMO-RG-001", slug: "demo-emerald-halo-ring", name: "Emerald Halo Ring",
    shortDescription: "A step-cut green centre stone framed by a halo of white accents.",
    description: "An illustrative cocktail ring design featuring a rectangular step-cut centre stone surrounded by a halo of small white stones, set on a polished band.",
    categories: ["rings", "gemstones"], jewelleryType: "Fine Jewellery", material: "Yellow Gold", metalPurity: "18K", metalColour: "Yellow",
    price: "185000", isFeatured: true, isNewArrival: true, size: "Made to size", images: ["ring-emerald", "ring-emerald-alt"], tags: ["emerald", "halo", "cocktail"],
    gemstones: [{ type: "Emerald", colour: "Green", cut: "Emerald cut" }, { type: "Diamond", colour: "White", cut: "Round brilliant", count: 18 }],
  },
  {
    sku: "DEMO-RG-002", slug: "demo-ruby-solitaire-ring", name: "Ruby Solitaire Ring",
    shortDescription: "A single oval red stone on a classic four-prong setting.",
    description: "A timeless solitaire silhouette: one oval stone held in four prongs above a slim band.",
    categories: ["rings"], jewelleryType: "Fine Jewellery", material: "Yellow Gold", metalPurity: "22K",
    price: "96500", salePrice: "89000", isNewArrival: true, images: ["ring-ruby", "ring-ruby-alt"], tags: ["ruby", "solitaire", "gift"],
    gemstones: [{ type: "Ruby", colour: "Red", cut: "Oval" }],
  },
  {
    sku: "DEMO-RG-003", slug: "demo-sapphire-halo-ring", name: "Sapphire Halo Ring",
    shortDescription: "A round blue centre stone with a sparkling halo.",
    description: "A round centre stone framed by a ring of smaller accents for extra brilliance.",
    categories: ["rings", "bridal-jewellery"], jewelleryType: "Diamond Jewellery", material: "White Gold", metalPurity: "18K",
    price: "142000", isFeatured: true, images: ["ring-sapphire"], tags: ["sapphire", "halo", "engagement"],
    gemstones: [{ type: "Blue Sapphire", colour: "Blue", cut: "Round brilliant" }],
  },
  {
    sku: "DEMO-RG-004", slug: "demo-classic-solitaire", name: "Classic White Solitaire",
    shortDescription: "Understated elegance for every day.",
    description: "A minimal round solitaire design on a slim polished band.",
    categories: ["rings", "bridal-jewellery"], jewelleryType: "Diamond Jewellery", material: "Platinum", metalPurity: "950 Platinum",
    price: null, availability: "ON_REQUEST", images: ["ring-diamond"], tags: ["solitaire", "engagement"],
    gemstones: [{ type: "Diamond", colour: "White", cut: "Round brilliant" }],
  },
  {
    sku: "DEMO-NK-001", slug: "demo-emerald-collar-necklace", name: "Emerald Collar Necklace",
    shortDescription: "Graduated green and white stones leading to an oval drop.",
    description: "A graduated collar of alternating green and white stones in bezel settings, finished with a large oval drop.",
    categories: ["necklaces", "bridal-jewellery"], jewelleryType: "Bridal", material: "Yellow Gold", metalPurity: "22K",
    price: "465000", isFeatured: true, isNewArrival: true, images: ["necklace-emerald", "necklace-emerald-alt"], tags: ["emerald", "collar", "bridal", "statement"],
    gemstones: [{ type: "Emerald", colour: "Green", cut: "Oval" }, { type: "Diamond", colour: "White", cut: "Round brilliant" }],
  },
  {
    sku: "DEMO-NK-002", slug: "demo-ruby-drop-necklace", name: "Ruby Drop Necklace",
    shortDescription: "A delicate chain with a single oval drop.",
    description: "A fine link chain carrying a bezel-set oval drop — easy to wear every day.",
    categories: ["necklaces", "pendants"], jewelleryType: "Gold Jewellery", material: "Yellow Gold", metalPurity: "18K",
    price: "58500", isNewArrival: true, images: ["necklace-ruby"], tags: ["ruby", "everyday", "gift"],
    gemstones: [{ type: "Ruby", colour: "Red", cut: "Oval" }],
  },
  {
    sku: "DEMO-NK-003", slug: "demo-pearl-strand-necklace", name: "Pearl Strand Necklace",
    shortDescription: "A classic strand with a soft pink drop.",
    description: "A single strand of round pearls finished with a pink oval drop.",
    categories: ["necklaces"], jewelleryType: "Fine Jewellery", material: "Sterling Silver", metalPurity: "925 Sterling",
    price: "32000", images: ["necklace-pearl"], tags: ["pearl", "classic"],
    gemstones: [{ type: "Pearl", colour: "White" }, { type: "Tourmaline", colour: "Pink", cut: "Oval" }],
  },
  {
    sku: "DEMO-ER-001", slug: "demo-emerald-drop-earrings", name: "Emerald Drop Earrings",
    shortDescription: "Oval drops in a beaded gold frame.",
    description: "White stone studs suspending oval drops in an open, beaded frame.",
    categories: ["earrings", "bridal-jewellery"], jewelleryType: "Fine Jewellery", material: "Yellow Gold", metalPurity: "18K",
    price: "124000", isFeatured: true, isNewArrival: true, images: ["earrings-emerald", "earrings-emerald-alt"], tags: ["emerald", "drops", "festive"],
    gemstones: [{ type: "Emerald", colour: "Green", cut: "Oval", count: 2 }],
  },
  {
    sku: "DEMO-ER-002", slug: "demo-sapphire-drop-earrings", name: "Sapphire Drop Earrings",
    shortDescription: "Deep blue drops with sparkling studs.",
    description: "An elegant pair of drop earrings with oval blue stones.",
    categories: ["earrings"], jewelleryType: "Fine Jewellery", material: "White Gold", metalPurity: "18K",
    price: "98000", images: ["earrings-sapphire"], tags: ["sapphire", "drops"],
    gemstones: [{ type: "Blue Sapphire", colour: "Blue", cut: "Oval", count: 2 }],
  },
  {
    sku: "DEMO-ER-003", slug: "demo-pearl-drop-earrings", name: "Pearl Drop Earrings",
    shortDescription: "Soft lustre in a light, beaded frame.",
    description: "Round pearls suspended from sparkling studs.",
    categories: ["earrings"], jewelleryType: "Silver Jewellery", material: "Gold-plated Silver", metalPurity: "925 Sterling",
    price: "14500", salePrice: "12900", availability: "SOLD_OUT", images: ["earrings-pearl"], tags: ["pearl", "everyday"],
    gemstones: [{ type: "Pearl", colour: "White", count: 2 }],
  },
  {
    sku: "DEMO-BG-001", slug: "demo-engraved-gold-bangles", name: "Engraved Gold Bangles (Pair)",
    shortDescription: "A pair of polished bangles with engraved detailing.",
    description: "Two polished bangles with a band of engraved dots — made to be stacked.",
    categories: ["bangles"], jewelleryType: "Gold Jewellery", material: "Yellow Gold", metalPurity: "22K",
    price: "215000", availability: "MADE_TO_ORDER", size: "2.4 / 2.6 / 2.8", images: ["bangle-gold", "bangle-gold-alt"], tags: ["bangles", "pair", "classic"],
  },
  {
    sku: "DEMO-BG-002", slug: "demo-ruby-accent-bangles", name: "Ruby Accent Bangles",
    shortDescription: "Gold bangles set with small red accents.",
    description: "Stackable bangles with small oval accents set along the front.",
    categories: ["bangles", "bridal-jewellery"], jewelleryType: "Bridal", material: "Yellow Gold", metalPurity: "22K",
    price: "248000", isNewArrival: true, images: ["bangle-ruby"], tags: ["ruby", "bangles", "bridal"],
    gemstones: [{ type: "Ruby", colour: "Red", cut: "Oval" }],
  },
  {
    sku: "DEMO-BR-001", slug: "demo-tennis-bracelet", name: "White Stone Tennis Bracelet",
    shortDescription: "A continuous line of sparkle.",
    description: "A flexible line of individually set round stones with a secure clasp.",
    categories: ["bracelets"], jewelleryType: "Diamond Jewellery", material: "White Gold", metalPurity: "18K",
    price: "275000", isFeatured: true, images: ["bracelet-diamond"], tags: ["tennis", "bracelet"],
    gemstones: [{ type: "Diamond", colour: "White", cut: "Round brilliant" }],
  },
  {
    sku: "DEMO-BR-002", slug: "demo-sapphire-line-bracelet", name: "Sapphire Line Bracelet",
    shortDescription: "Blue and white stones in an alternating line.",
    description: "Alternating blue and white stones in a flexible line.",
    categories: ["bracelets"], jewelleryType: "Fine Jewellery", material: "Yellow Gold", metalPurity: "18K",
    price: "132000", images: ["bracelet-sapphire"], tags: ["sapphire", "bracelet"],
    gemstones: [{ type: "Blue Sapphire", colour: "Blue", cut: "Oval" }],
  },
  {
    sku: "DEMO-PD-001", slug: "demo-emerald-pearl-pendant", name: "Emerald & Pearl Pendant",
    shortDescription: "A step-cut stone ringed with pearls.",
    description: "A rectangular step-cut stone in a gold setting, surrounded by a ring of small pearls.",
    categories: ["pendants", "gemstones"], jewelleryType: "Fine Jewellery", material: "Yellow Gold", metalPurity: "18K",
    price: "88000", isNewArrival: true, dimensions: "Pendant 32 × 26 mm", images: ["pendant-emerald"], tags: ["emerald", "pearl", "pendant"],
    gemstones: [{ type: "Emerald", colour: "Green", cut: "Emerald cut" }, { type: "Pearl", colour: "White", count: 20 }],
  },
  {
    sku: "DEMO-PD-002", slug: "demo-amethyst-pendant", name: "Amethyst Pendant",
    shortDescription: "Rich purple framed by pearls.",
    description: "A vivid purple step-cut stone with a pearl surround.",
    categories: ["pendants"], jewelleryType: "Silver Jewellery", material: "Gold-plated Silver", metalPurity: "925 Sterling",
    price: "18500", images: ["pendant-amethyst"], tags: ["amethyst", "pendant", "gift"],
    gemstones: [{ type: "Amethyst", colour: "Purple", cut: "Emerald cut" }],
  },
  {
    sku: "DEMO-GS-001", slug: "demo-emerald-step-cut-gemstone", name: "Emerald — Step Cut",
    shortDescription: "A loose rectangular step-cut green gemstone.",
    description: "A loose rectangular step-cut gemstone, ideal for a custom ring or pendant.",
    categories: ["gemstones"], jewelleryType: "Loose Gemstone",
    price: "76000", isFeatured: true, images: ["gem-emerald", "gem-emerald-alt"], tags: ["emerald", "loose", "custom"],
    gemstones: [{ type: "Emerald", colour: "Green", cut: "Emerald cut", shape: "Rectangle" }],
    certification: { issuer: "Example Gem Laboratory (sample)", certificateNumber: "DEMO-0001", notes: "Sample data for demonstration only — not a real certificate." },
  },
  {
    sku: "DEMO-GS-002", slug: "demo-ruby-oval-gemstone", name: "Ruby — Oval",
    shortDescription: "A loose oval red gemstone.",
    description: "A loose oval gemstone with a rich red tone.",
    categories: ["gemstones"], jewelleryType: "Loose Gemstone",
    price: "54000", isNewArrival: true, images: ["gem-ruby"], tags: ["ruby", "loose"],
    gemstones: [{ type: "Ruby", colour: "Red", cut: "Oval", shape: "Oval" }],
  },
  {
    sku: "DEMO-GS-003", slug: "demo-blue-sapphire-cushion", name: "Blue Sapphire — Cushion",
    shortDescription: "A loose cushion-shaped blue gemstone.",
    description: "A loose cushion-shaped gemstone in deep blue.",
    categories: ["gemstones"], jewelleryType: "Loose Gemstone",
    price: null, availability: "ON_REQUEST", images: ["gem-sapphire"], tags: ["sapphire", "loose"],
    gemstones: [{ type: "Blue Sapphire", colour: "Blue", cut: "Cushion", shape: "Cushion" }],
  },
  {
    sku: "DEMO-GS-004", slug: "demo-yellow-sapphire-oval", name: "Yellow Sapphire — Oval",
    shortDescription: "A loose oval golden-yellow gemstone.",
    description: "A loose oval gemstone with a warm golden tone.",
    categories: ["gemstones"], jewelleryType: "Loose Gemstone",
    price: "38000", images: ["gem-yellow-sapphire"], tags: ["yellow sapphire", "loose"],
    gemstones: [{ type: "Yellow Sapphire", colour: "Yellow", cut: "Oval", shape: "Oval" }],
  },
  {
    sku: "DEMO-BS-001", slug: "demo-heritage-bridal-set", name: "Heritage Bridal Set",
    shortDescription: "Necklace and earrings with red and green drops and pearls.",
    description: "A traditional-inspired bridal set: a necklace with alternating red and green drops, pearl accents and a step-cut centre, with matching earrings.",
    categories: ["bridal-jewellery", "necklaces"], jewelleryType: "Bridal", material: "Yellow Gold", metalPurity: "22K",
    price: null, availability: "MADE_TO_ORDER", isFeatured: true, images: ["bridal-set", "bridal-set-alt"], tags: ["bridal", "set", "heritage", "wedding"],
    gemstones: [{ type: "Ruby", colour: "Red" }, { type: "Emerald", colour: "Green" }, { type: "Pearl", colour: "White" }],
  },
];

async function main() {
  // Categories
  for (const [position, c] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c, position, imageUrl: `/demo/category-${c.slug}.webp` },
    });
  }
  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const catId = new Map(categories.map((c) => [c.slug, c.id]));

  // Settings (never overwrite values the client has already entered)
  const { updatedAt: _u, trustHighlights, ...defaults } = DEFAULT_SETTINGS;
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", ...defaults, trustHighlights: trustHighlights as unknown as Prisma.InputJsonArray },
  });

  // Page templates (awaiting approval)
  for (const t of CONTENT_TEMPLATES) {
    await prisma.contentPage.upsert({
      where: { slug: t.slug },
      update: {},
      create: { slug: t.slug, title: t.title, summary: t.summary, body: t.body, isApproved: false },
    });
  }

  // Demo products
  const now = Date.now();
  for (const [i, p] of PRODUCTS.entries()) {
    const exists = await prisma.product.findUnique({ where: { sku: p.sku }, select: { id: true } });
    if (exists) continue;
    const effective = p.salePrice ?? p.price;
    await prisma.product.create({
      data: {
        sku: p.sku,
        slug: p.slug,
        name: p.name,
        shortDescription: p.shortDescription,
        description: p.description + DEMO_NOTE,
        status: "PUBLISHED",
        availability: p.availability ?? "IN_STOCK",
        stockQuantity: p.availability === "SOLD_OUT" ? 0 : null,
        price: p.price,
        salePrice: p.salePrice ?? null,
        effectivePrice: effective,
        jewelleryType: p.jewelleryType,
        material: p.material ?? null,
        metalPurity: p.metalPurity ?? null,
        metalColour: p.metalColour ?? null,
        size: p.size ?? null,
        dimensions: p.dimensions ?? null,
        grossWeightGrams: p.grossWeightGrams ?? null,
        tags: p.tags,
        isFeatured: p.isFeatured ?? false,
        isNewArrival: p.isNewArrival ?? false,
        isDemo: true,
        publishedAt: new Date(now - i * 3_600_000),
        images: {
          create: p.images.map((img, position) => ({
            url: `/demo/${img}.webp`,
            storageKey: null,
            provider: "STATIC" as const,
            alt: `${p.name} — illustrative demo image${position ? ` (view ${position + 1})` : ""}`,
            width: 900,
            height: 1125,
            position,
            isPrimary: position === 0,
          })),
        },
        gemstones: { create: (p.gemstones ?? []).map((g, position) => ({ ...g, position })) },
        certifications: p.certification ? { create: [p.certification] } : undefined,
        categories: { create: p.categories.filter((s) => catId.has(s)).map((s) => ({ categoryId: catId.get(s)! })) },
      },
    });
  }

  const counts = await Promise.all([prisma.category.count(), prisma.product.count({ where: { isDemo: true } }), prisma.contentPage.count()]);
  console.log(`✔ Seed complete: ${counts[0]} categories, ${counts[1]} demo products, ${counts[2]} content pages.`);
  console.log("  Next: create an admin account with `npm run admin:create`.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
