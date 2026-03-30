import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SessionUser } from "~/types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockReadBody = vi.fn();
const mockGetRouterParam = vi.fn();

vi.mock("h3", () => ({
  readBody: (...args: unknown[]) => mockReadBody(...args),
  getQuery: vi.fn().mockReturnValue({}),
  getRouterParam: (...args: unknown[]) => mockGetRouterParam(...args),
  createError: (opts: { statusCode: number; message: string }) => {
    const err = new Error(opts.message) as Error & { statusCode: number };
    err.statusCode = opts.statusCode;
    return err;
  },
  defineEventHandler: (handler: Function) => handler,
  getCookie: vi.fn(),
  setCookie: vi.fn(),
  deleteCookie: vi.fn(),
}));

const mockFindFirst = vi.fn();
const mockInsert = vi.fn();

const mockDb = {
  query: {
    formDefinitions: { findFirst: mockFindFirst },
  },
  insert: mockInsert,
};

vi.mock("~/server/database", () => ({
  useDB: () => mockDb,
}));

vi.mock("~/server/utils/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

// Override Nitro auto-imports for handler body usage
(globalThis as any).getRouterParam = (...args: unknown[]) => mockGetRouterParam(...args);

import submitHandler from "~/server/api/forms/[id]/submit.post";

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
// POST /api/forms/:id/submit
// ---------------------------------------------------------------------------
describe("POST /api/forms/:id/submit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when no session user", async () => {
    await expect((submitHandler as Function)(makeEvent(null))).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("returns 400 when id param is missing", async () => {
    mockGetRouterParam.mockReturnValue(undefined);
    await expect((submitHandler as Function)(makeEvent(makeUser()))).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("returns 404 when form definition not found", async () => {
    mockGetRouterParam.mockReturnValue("form-1");
    mockReadBody.mockResolvedValue({ data: {} });
    mockFindFirst.mockResolvedValue(undefined);
    await expect((submitHandler as Function)(makeEvent(makeUser()))).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("returns 400 when form is not active", async () => {
    mockGetRouterParam.mockReturnValue("form-1");
    mockReadBody.mockResolvedValue({ data: {} });
    mockFindFirst.mockResolvedValue({
      id: "form-1",
      isActive: false,
      fields: [],
      deletedAt: null,
    });
    await expect((submitHandler as Function)(makeEvent(makeUser()))).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("returns validation errors when required fields are missing", async () => {
    mockGetRouterParam.mockReturnValue("form-1");
    mockReadBody.mockResolvedValue({ data: { email: "a@b.com" } });
    mockFindFirst.mockResolvedValue({
      id: "form-1",
      isActive: true,
      fields: [
        { name: "email", label: "Email", type: "email", required: true },
        { name: "name", label: "Full Name", type: "text", required: true },
      ],
      deletedAt: null,
    });

    const result = await (submitHandler as Function)(makeEvent(makeUser()));
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Full Name is required");
  });

  it("returns error when data field is missing from body", async () => {
    mockGetRouterParam.mockReturnValue("form-1");
    mockReadBody.mockResolvedValue({});
    mockFindFirst.mockResolvedValue({
      id: "form-1",
      isActive: true,
      fields: [],
      deletedAt: null,
    });

    const result = await (submitHandler as Function)(makeEvent(makeUser()));
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("data is required and must be an object");
  });

  it("creates submission with valid data", async () => {
    mockGetRouterParam.mockReturnValue("form-1");
    mockReadBody.mockResolvedValue({ data: { email: "test@example.com" } });
    mockFindFirst.mockResolvedValue({
      id: "form-1",
      isActive: true,
      fields: [{ name: "email", label: "Email", type: "email", required: true }],
      deletedAt: null,
    });

    const submission = {
      id: "sub-1",
      formDefinitionId: "form-1",
      data: { email: "test@example.com" },
    };
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([submission]),
      }),
    });

    const result = await (submitHandler as Function)(makeEvent(makeUser()));
    expect(result.ok).toBe(true);
    expect(result.data).toEqual(submission);
  });
});
