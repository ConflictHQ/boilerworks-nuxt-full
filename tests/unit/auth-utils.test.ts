import { describe, it, expect } from "vitest";
import { requirePermission } from "~/server/utils/auth";
import type { SessionUser } from "~/types";

function makeUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    email: "test@example.com",
    name: "Test User",
    isSuperuser: false,
    permissions: [],
    ...overrides,
  };
}

describe("requirePermission", () => {
  it("allows superuser regardless of permissions", () => {
    const user = makeUser({ isSuperuser: true, permissions: [] });
    // Should not throw
    expect(() => requirePermission(user, "items.create")).not.toThrow();
  });

  it("allows user with the required permission", () => {
    const user = makeUser({ permissions: ["items.create", "items.view"] });
    expect(() => requirePermission(user, "items.create")).not.toThrow();
  });

  it("denies user without the required permission", () => {
    const user = makeUser({ permissions: ["items.view"] });
    expect(() => requirePermission(user, "items.create")).toThrow();
  });

  it("denies user with no permissions", () => {
    const user = makeUser({ permissions: [] });
    expect(() => requirePermission(user, "items.create")).toThrow();
  });
});
