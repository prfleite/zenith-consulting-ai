import { describe, it, expect } from "vitest";
import { withErrorHandling, withAsyncErrorHandling } from "@/lib/supabaseErrorHandler";

describe("supabaseErrorHandler", () => {
  describe("withErrorHandling", () => {
    it("returns data on success", async () => {
      const result = await withErrorHandling(
        Promise.resolve({ data: { id: "1" }, error: null })
      );
      expect(result).toEqual({ id: "1" });
    });

    it("returns null on error", async () => {
      const result = await withErrorHandling(
        Promise.resolve({ data: null, error: { message: "fail" } })
      );
      expect(result).toBeNull();
    });
  });

  describe("withAsyncErrorHandling", () => {
    it("returns value on success", async () => {
      const result = await withAsyncErrorHandling(async () => "ok");
      expect(result).toBe("ok");
    });

    it("returns null on thrown error", async () => {
      const result = await withAsyncErrorHandling(async () => {
        throw new Error("boom");
      });
      expect(result).toBeNull();
    });
  });
});
