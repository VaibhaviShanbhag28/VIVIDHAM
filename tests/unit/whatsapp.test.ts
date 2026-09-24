import { describe, expect, it } from "vitest";
import { buildGeneralEnquiryMessage, buildProductEnquiryMessage, buildWhatsAppUrl, normaliseWhatsAppNumber } from "@/lib/whatsapp";

const base = {
  businessName: "VIVIDHUM JEWELLERY",
  productName: "Emerald Halo Ring",
  sku: "VJ-RG-001",
  displayPrice: "₹1,85,000",
  quantity: 2,
  productUrl: "https://vividhum.example/product/emerald-halo-ring",
};

describe("normaliseWhatsAppNumber", () => {
  it("strips spaces, symbols and leading 00", () => {
    expect(normaliseWhatsAppNumber("+91 98765 43210")).toBe("919876543210");
    expect(normaliseWhatsAppNumber("(+91) 98765-43210")).toBe("919876543210");
    expect(normaliseWhatsAppNumber("0091 98765 43210")).toBe("919876543210");
  });

  it("rejects missing, short, too long or local-format numbers", () => {
    expect(normaliseWhatsAppNumber(null)).toBeNull();
    expect(normaliseWhatsAppNumber("")).toBeNull();
    expect(normaliseWhatsAppNumber("12345")).toBeNull();
    expect(normaliseWhatsAppNumber("09876543210")).toBeNull();
    expect(normaliseWhatsAppNumber("1234567890123456")).toBeNull();
  });
});

describe("buildProductEnquiryMessage", () => {
  it("includes every required detail in order", () => {
    const msg = buildProductEnquiryMessage(base);
    expect(msg).toBe(
      [
        "Hello VIVIDHUM JEWELLERY,",
        "",
        "I would like to enquire about purchasing this product.",
        "",
        "Product: Emerald Halo Ring",
        "SKU: VJ-RG-001",
        "Price: ₹1,85,000",
        "Quantity: 2",
        "Product link: https://vividhum.example/product/emerald-halo-ring",
        "",
        "Please share the availability, final price, shipping details, and payment procedure.",
        "",
        "Thank you.",
      ].join("\n"),
    );
  });

  it("adds optional name and note, stripping control characters", () => {
    const msg = buildProductEnquiryMessage({ ...base, customerName: " Asha\u0007 ", customerMessage: "Ring size 12\u0000" });
    expect(msg).toContain("My name: Asha");
    expect(msg).toContain("Note: Ring size 12");
    expect(msg).not.toMatch(/[\u0000\u0007]/);
  });

  it("clamps invalid quantities", () => {
    expect(buildProductEnquiryMessage({ ...base, quantity: 0 })).toContain("Quantity: 1");
    expect(buildProductEnquiryMessage({ ...base, quantity: 1.5 })).toContain("Quantity: 1");
    expect(buildProductEnquiryMessage({ ...base, quantity: 5000 })).toContain("Quantity: 99");
  });
});

describe("buildWhatsAppUrl", () => {
  it("uses the wa.me click-to-chat format with a URL-encoded message", () => {
    const msg = buildProductEnquiryMessage({ ...base, productName: "Ring & Band #1 ?" });
    const url = buildWhatsAppUrl("+91 98765 43210", msg)!;
    expect(url.startsWith("https://wa.me/919876543210?text=")).toBe(true);
    const encoded = url.split("?text=")[1];
    expect(encoded).not.toMatch(/[ \n&#?]/);
    expect(encoded).toContain("%0A");
    expect(encoded).toContain("%E2%82%B9"); // ₹
    expect(decodeURIComponent(encoded)).toBe(msg);
    expect(new URL(url).searchParams.get("text")).toBe(msg);
  });

  it("returns null when the number is not configured or invalid", () => {
    expect(buildWhatsAppUrl(null, "hi")).toBeNull();
    expect(buildWhatsAppUrl("abc", "hi")).toBeNull();
  });

  it("omits the text parameter when no message is given", () => {
    expect(buildWhatsAppUrl("919876543210")).toBe("https://wa.me/919876543210");
    expect(buildGeneralEnquiryMessage("VIVIDHUM JEWELLERY")).toContain("VIVIDHUM JEWELLERY");
  });
});
