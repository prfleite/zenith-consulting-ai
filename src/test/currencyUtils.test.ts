import { describe, it, expect, vi, beforeEach } from "vitest";
import { convertCurrency, formatCurrency, getCurrencySymbol } from "@/lib/currencyUtils";

describe("currencyUtils", () => {
  describe("convertCurrency", () => {
    const rates = { BRL: 1, USD: 0.175, EUR: 0.16, GBP: 0.138 };

    it("returns same amount when from === to", () => {
      expect(convertCurrency(100, "BRL", "BRL", rates)).toBe(100);
    });

    it("converts BRL to USD", () => {
      const result = convertCurrency(1000, "BRL", "USD", rates);
      expect(result).toBeCloseTo(175, 0);
    });

    it("converts USD to EUR", () => {
      const result = convertCurrency(100, "USD", "EUR", rates);
      // 100 USD / 0.175 * 0.16 = ~91.43
      expect(result).toBeCloseTo(91.43, 0);
    });
  });

  describe("formatCurrency", () => {
    it("formats BRL correctly", () => {
      const result = formatCurrency(1234.56, "BRL", "pt-BR");
      expect(result).toContain("1.234,56");
    });

    it("formats USD correctly", () => {
      const result = formatCurrency(1234.56, "USD", "en-US");
      expect(result).toContain("1,234.56");
    });
  });

  describe("getCurrencySymbol", () => {
    it("returns R$ for BRL", () => {
      expect(getCurrencySymbol("BRL")).toBe("R$");
    });

    it("returns $ for USD", () => {
      expect(getCurrencySymbol("USD")).toBe("$");
    });
  });
});
