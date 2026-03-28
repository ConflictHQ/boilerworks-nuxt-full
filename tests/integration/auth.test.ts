import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SessionUser } from "~/types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockReadBody = vi.fn();
const mockGetCookie = vi.fn();
const mockSetCookie = vi.fn();
const mockDeleteCookie = vi.fn();

vi.mock("h3", () => ({
  readBody: (...args: unknown[]) => mockReadBody(...args),
  getQuery: vi.fn().mockReturnValue({}),
  getRouterParam: vi.fn(),
  createError: (opts: { statusCode: number; message: string }) => {
    const err = new Error(opts.message) as Error & { statusCode: number };
    err.statusCode = opts.statusCode;
    return err;
  },
  defineEventHandler: (handler: Function) => handler,
  getCookie: (...args: unknown[]) => mockGetCookie(...args),
  setCookie: (...args: unknown[]) => mockSetCookie(...args),
  deleteCookie: (...args: unknown[]) => mockDeleteCookie(...args),
}));

const mockFindFirstUser = vi.fn();
const mockInsertValues = vi.fn().mockResolvedValue(undefined);
const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

const mockDb = {
  query: {
    users: { findFirst: mockFindFirstUser },
    sessions: { findFirst: vi.fn() },
  },
  insert: mockInsert,
  delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
};

vi.mock("~/server/database", () => ({
  useDB: () => mockDb,
}));

vi.mock("~/server/utils/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed"),
    compare: vi.fn(),
  },
}));

import loginHandler from "~/server/api/auth/login.post";
import meHandler from "~/server/api/auth/me.get";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

function makeEvent(user: SessionUser | null = null) {
  return { context: { user } } as any;
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
describe("POST /api/auth/login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns validation errors for invalid email", async () => {
    mockReadBody.mockResolvedValue({ email: "not-an-email", password: "abc" });
    const result = await (loginHandler as Function)(makeEvent());
    expect(result.ok).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it("returns validation errors for empty password", async () => {
    mockReadBody.mockResolvedValue({ email: "a@b.com", password: "" });
    const result = await (loginHandler as Function)(makeEvent());
    expect(result.ok).toBe(false);
  });

  it("returns 401 for non-existent user", async () => {
    mockReadBody.mockResolvedValue({ email: "nobody@example.com", password: "pass123" });
    mockFindFirstUser.mockResolvedValue(undefined);
    await expect((loginHandler as Function)(makeEvent())).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("returns 401 for inactive user", async () => {
    mockReadBody.mockResolvedValue({ email: "inactive@example.com", password: "pass123" });
    mockFindFirstUser.mockResolvedValue({
      id: "u1",
      email: "inactive@example.com",
      name: "Inactive",
      isActive: false,
      passwordHash: "hash",
    });
    await expect((loginHandler as Function)(makeEvent())).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("returns 401 for wrong password", async () => {
    mockReadBody.mockResolvedValue({ email: "admin@example.com", password: "wrong" });
    mockFindFirstUser.mockResolvedValue({
      id: "u1",
      email: "admin@example.com",
      name: "Admin",
      isActive: true,
      passwordHash: "correcthash",
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    await expect((loginHandler as Function)(makeEvent())).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("returns user data and sets session cookie on valid login", async () => {
    mockReadBody.mockResolvedValue({ email: "admin@example.com", password: "admin123!" });
    mockFindFirstUser.mockResolvedValue({
      id: "u1",
      email: "admin@example.com",
      name: "Admin",
      isActive: true,
      passwordHash: "correcthash",
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await (loginHandler as Function)(makeEvent());
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ id: "u1", email: "admin@example.com", name: "Admin" });
    expect(mockSetCookie).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------
describe("GET /api/auth/me", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when no session", async () => {
    await expect((meHandler as Function)(makeEvent(null))).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("returns user data when authenticated", async () => {
    const user = makeUser();
    const result = await (meHandler as Function)(makeEvent(user));
    expect(result.ok).toBe(true);
    expect(result.data).toEqual(user);
  });
});
