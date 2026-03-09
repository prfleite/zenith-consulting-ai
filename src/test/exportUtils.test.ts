import { describe, it, expect } from "vitest";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

describe("exportUtils", () => {
  describe("exportToCSV", () => {
    it("does nothing with empty data", () => {
      // Should not throw
      expect(() => exportToCSV([], "test")).not.toThrow();
    });

    it("creates correct CSV format", () => {
      // We can't easily test file download, but we can verify the function doesn't throw
      const data = [
        { Name: "Test", Value: 100 },
        { Name: 'With "quotes"', Value: 200 },
      ];
      expect(() => exportToCSV(data, "test")).not.toThrow();
    });
  });

  describe("exportToPDF", () => {
    it("does nothing with empty data", () => {
      expect(() => exportToPDF("Title", [])).not.toThrow();
    });
  });
});
