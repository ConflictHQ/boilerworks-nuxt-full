import { describe, it, expect } from "vitest";
import { ok, fail, paginated } from "~/server/utils/response";

describe("response helpers", () => {
  describe("ok()", () => {
    it("returns ok with no data", () => {
      const result = ok();
      expect(result.ok).toBe(true);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeUndefined();
    });

    it("returns ok with data", () => {
      const result = ok({ id: "abc", name: "Test" });
      expect(result.ok).toBe(true);
      expect(result.data).toEqual({ id: "abc", name: "Test" });
    });
  });

  describe("fail()", () => {
    it("returns failure with errors", () => {
      const result = fail(["Name is required", "Email is invalid"]);
      expect(result.ok).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors![0]).toBe("Name is required");
    });
  });

  describe("paginated()", () => {
    it("returns paginated result", () => {
      const items = [{ id: "1" }, { id: "2" }];
      const result = paginated(items, 50, 1, 20);
      expect(result.ok).toBe(true);
      expect(result.data).toEqual(items);
      expect(result.total).toBe(50);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });
  });
});
