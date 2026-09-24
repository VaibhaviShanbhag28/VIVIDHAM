import { describe, expect, it } from "vitest";
import { fieldErrors } from "@/lib/validation/common";
import { publicEnquiryInput } from "@/lib/validation/enquiry";
import { productInput } from "@/lib/validation/product";
import { siteSettingsInput } from "@/lib/validation/settings";
import { changePasswordInput } from "@/lib/validation/auth";

const validProduct = {
  name: "Emerald Halo Ring",
  sku: "vj-rg-001",
  description: "A step-cut emerald framed by a halo.",
  status: "DRAFT",
  availability: "IN_STOCK",
  price: "1,85,000",
  salePrice: "",
  stockQuantity: "",
  grossWeightGrams: "4.25",
  tags: ["Emerald", "emerald", "Halo"],
  images: [],
  gemstones: [{ type: "Emerald", caratWeight: "1.2", count: "1" }],
  certifications: [],
};

describe("productInput", () => {
  it("accepts and normalises a valid product", () => {
    const r = productInput.parse(validProduct);
    expect(r.sku).toBe("VJ-RG-001");
    expect(r.price).toBe("185000.00");
    expect(r.salePrice).toBeNull();
    expect(r.stockQuantity).toBeNull();
    expect(r.grossWeightGrams).toBe("4.25");
    expect(r.tags).toEqual(["emerald", "halo"]);
    expect(r.gemstones[0]).toMatchObject({ type: "Emerald", caratWeight: "1.2", count: 1, origin: null });
    expect(r.categoryIds).toEqual([]);
  });

  it("rejects a sale price that is not lower than the regular price", () => {
    const r = productInput.safeParse({ ...validProduct, salePrice: "190000" });
    expect(r.success).toBe(false);
    expect(fieldErrors(r.error!).salePrice).toMatch(/lower/);
  });

  it("requires a regular price before a sale price", () => {
    const r = productInput.safeParse({ ...validProduct, price: "", salePrice: "100" });
    expect(fieldErrors(r.error!).salePrice).toMatch(/regular price/);
  });

  it("rejects malformed amounts, SKUs, weights and gemstone rows", () => {
    const r = productInput.safeParse({
      ...validProduct,
      price: "12.345",
      sku: "bad sku!",
      grossWeightGrams: "abc",
      gemstones: [{ type: "" }],
      certifications: [{ issuer: "Lab", verificationUrl: "http://insecure.example" }],
    });
    const e = fieldErrors(r.error!);
    expect(e.price).toBeDefined();
    expect(e.sku).toBeDefined();
    expect(e.grossWeightGrams).toBeDefined();
    expect(e["gemstones.0.type"]).toBeDefined();
    expect(e["certifications.0.verificationUrl"]).toBeDefined();
  });

  it("allows price on request (no price)", () => {
    expect(productInput.parse({ ...validProduct, price: "" }).price).toBeNull();
  });

  it("rejects more than one primary image", () => {
    const img = { url: "/media/product/a.webp", provider: "LOCAL", isPrimary: true };
    const r = productInput.safeParse({ ...validProduct, images: [img, { ...img, url: "/media/product/b.webp" }] });
    expect(fieldErrors(r.error!).images).toMatch(/primary/);
  });
});

describe("publicEnquiryInput", () => {
  const ok = { customerName: "Asha", email: "ASHA@example.com", phone: "", message: "Is this available?", productId: "", consent: "on" };

  it("accepts a valid enquiry and normalises values", () => {
    const r = publicEnquiryInput.parse(ok);
    expect(r.email).toBe("asha@example.com");
    expect(r.phone).toBeNull();
    expect(r.productId).toBeNull();
  });

  it("requires consent and at least one contact method", () => {
    const e = fieldErrors(publicEnquiryInput.safeParse({ ...ok, email: "", consent: undefined }).error!);
    expect(e.email).toMatch(/email address or a phone/);
    expect(e.consent).toBeDefined();
  });

  it("validates email and phone formats", () => {
    const e = fieldErrors(publicEnquiryInput.safeParse({ ...ok, email: "not-an-email", phone: "12ab" }).error!);
    expect(e.email).toBeDefined();
    expect(e.phone).toBeDefined();
    expect(publicEnquiryInput.parse({ ...ok, email: "", phone: "+91 98765-43210" }).phone).toBe("+919876543210");
  });

  it("enforces message length", () => {
    expect(publicEnquiryInput.safeParse({ ...ok, message: "hi" }).success).toBe(false);
    expect(publicEnquiryInput.safeParse({ ...ok, message: "x".repeat(2001) }).success).toBe(false);
  });
});

describe("siteSettingsInput", () => {
  const base = {
    businessName: "VIVIDHUM JEWELLERY",
    announcementEnabled: true,
    currencyCode: "INR",
    trustHighlights: [],
  };

  it("normalises the WhatsApp number to digits", () => {
    expect(siteSettingsInput.parse({ ...base, whatsappNumber: "+91 98765 43210" }).whatsappNumber).toBe("919876543210");
  });

  it("rejects invalid numbers, non-https and off-domain social links", () => {
    const e = fieldErrors(
      siteSettingsInput.safeParse({
        ...base,
        whatsappNumber: "98765",
        instagramUrl: "https://evil.example.com/vividhum",
        facebookUrl: "http://facebook.com/x",
        mapUrl: "javascript:alert(1)",
        announcementLink: "//evil.example",
        logoUrl: "data:image/svg+xml,<svg/>",
      }).error!,
    );
    expect(e.whatsappNumber).toBeDefined();
    expect(e.instagramUrl).toBeDefined();
    expect(e.facebookUrl).toBeDefined();
    expect(e.mapUrl).toBeDefined();
    expect(e.announcementLink).toBeDefined();
    expect(e.logoUrl).toBeDefined();
  });

  it("accepts valid social links on the right domains", () => {
    const r = siteSettingsInput.parse({ ...base, instagramUrl: "https://www.instagram.com/vividhum", announcementLink: "/shop?category=rings" });
    expect(r.instagramUrl).toBe("https://www.instagram.com/vividhum");
  });
});

describe("changePasswordInput", () => {
  it("enforces length, variety and confirmation", () => {
    expect(changePasswordInput.safeParse({ currentPassword: "old", newPassword: "short1", confirmPassword: "short1" }).success).toBe(false);
    expect(changePasswordInput.safeParse({ currentPassword: "old", newPassword: "aaaaaaaaaaaa1", confirmPassword: "aaaaaaaaaaaa1" }).success).toBe(false);
    expect(changePasswordInput.safeParse({ currentPassword: "old", newPassword: "Emerald-Ring-2026", confirmPassword: "Emerald-Ring-2025" }).success).toBe(false);
    expect(changePasswordInput.safeParse({ currentPassword: "old", newPassword: "Emerald-Ring-2026", confirmPassword: "Emerald-Ring-2026" }).success).toBe(true);
  });
});
