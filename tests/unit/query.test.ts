import { describe, it, expect, vi } from "vitest";

// Mock h3's getQuery since we're testing the logic
vi.mock("h3", () => ({
  getQuery: vi.fn(),
}));

import { getQuery } from "h3";
import { getPaginationParams } from "~/server/utils/query";
import type { H3Event } from "h3";

describe("getPaginationParams", () => {
  const mockEvent = {} as H3Event;

  it("returns defaults when no query params", () => {
    vi.mocked(getQuery).mockReturnValue({});
    const result = getPaginationParams(mockEvent);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.offset).toBe(0);
  });

  it("parses page and pageSize from query", () => {
    vi.mocked(getQuery).mockReturnValue({ page: "3", pageSize: "10" });
    const result = getPaginationParams(mockEvent);
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
    expect(result.offset).toBe(20);
  });

  it("clamps page to minimum of 1", () => {
    vi.mocked(getQuery).mockReturnValue({ page: "-5" });
    const result = getPaginationParams(mockEvent);
    expect(result.page).toBe(1);
  });

  it("clamps pageSize to maximum of 100", () => {
    vi.mocked(getQuery).mockReturnValue({ pageSize: "500" });
    const result = getPaginationParams(mockEvent);
    expect(result.pageSize).toBe(100);
  });
});
