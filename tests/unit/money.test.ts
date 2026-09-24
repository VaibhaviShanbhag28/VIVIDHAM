import { describe, expect, it } from "vitest";
import { compareMoney, discountPercent, formatINR, normaliseMoney, toPaise } from "@/lib/money";

describe("money helpers", () => {
  it("normalises admin input to canonical strings", () => {
    expect(normaliseMoney("1,25,000")).toBe("125000.00");
    expect(normaliseMoney("₹ 999.5")).toBe("999.50");
    expect(normaliseMoney("INR 10")).toBe("10.00");
    expect(normaliseMoney("")).toBeNull();
    expect(normaliseMoney("12.345")).toBeNull();
    expect(normaliseMoney("-5")).toBeNull();
    expect(normaliseMoney("1e5")).toBeNull();
  });

  it("formats INR with Indian digit grouping", () => {
    expect(formatINR("125000")).toBe("₹1,25,000");
    expect(formatINR("12345678.5")).toBe("₹1,23,45,678.50");
    expect(formatINR("999")).toBe("₹999");
    expect(formatINR("1000")).toBe("₹1,000");
    expect(formatINR(null)).toBeNull();
  });

  it("does exact arithmetic in paise (no floating point)", () => {
    expect(toPaise("0.10")! + toPaise("0.20")!).toBe(30n);
    expect(compareMoney("100.10", "100.1")).toBe(0);
    expect(compareMoney("99.99", "100")).toBe(-1);
    expect(discountPercent("100000", "89000")).toBe(11);
    expect(discountPercent("100", "100")).toBeNull();
    expect(discountPercent(null, "10")).toBeNull();
  });
});
