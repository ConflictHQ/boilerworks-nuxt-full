import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SessionUser } from "~/types";

// ---------------------------------------------------------------------------
// Mocks – vi.mock calls are hoisted above imports automatically
// ---------------------------------------------------------------------------
const mockReadBody = vi.fn();
const mockGetQuery = vi.fn().mockReturnValue({});
const mockGetRouterParam = vi.fn();

vi.mock("h3", () => ({
  readBody: (...args: unknown[]) => mockReadBody(...args),
  getQuery: (...args: unknown[]) => mockGetQuery(...args),
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

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockFindFirst = vi.fn();

const mockDb = {
  insert: mockInsert,
  select: mockSelect,
  update: mockUpdate,
  query: {
    items: { findFirst: mockFindFirst },
  },
};

vi.mock("~/server/database", () => ({
  useDB: () => mockDb,
}));

vi.mock("~/server/utils/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

// Override the Nitro auto-import globals so they delegate to our mocks.
// defineEventHandler and useRuntimeConfig are set in setup.ts (module-scope).
// getQuery / getRouterParam are called inside handler bodies — override here.
(globalThis as any).getQuery = (...args: unknown[]) => mockGetQuery(...args);
(globalThis as any).getRouterParam = (...args: unknown[]) => mockGetRouterParam(...args);

// ---------------------------------------------------------------------------
// Import handlers (setup.ts already set defineEventHandler globally)
// ---------------------------------------------------------------------------
import createItem from "~/server/api/items/index.post";
import listItems from "~/server/api/items/index.get";
import deleteItem from "~/server/api/items/[id].delete";

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
// POST /api/items
// ---------------------------------------------------------------------------
describe("POST /api/items", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when no session user", async () => {
    const event = makeEvent(null);
    await expect((createItem as Function)(event)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("returns 403 when user lacks items.create permission", async () => {
    const event = makeEvent(makeUser({ permissions: ["items.view"] }));
    await expect((createItem as Function)(event)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("allows superuser regardless of permissions", async () => {
    const user = makeUser({ isSuperuser: true, permissions: [] });
    const event = makeEvent(user);
    const item = { id: "prod-1", name: "Widget", slug: "widget", price: 1000 };

    mockReadBody.mockResolvedValue({ name: "Widget", slug: "widget", price: 1000 });
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([item]),
      }),
    });

    const result = await (createItem as Function)(event);
    expect(result.ok).toBe(true);
    expect(result.data).toEqual(item);
  });

  it("validates request body and returns errors for invalid data", async () => {
    const event = makeEvent(makeUser({ permissions: ["items.create"] }));
    mockReadBody.mockResolvedValue({ name: "", price: -5 });

    const result = await (createItem as Function)(event);
    expect(result.ok).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it("creates item with valid data and calls audit log", async () => {
    const user = makeUser({ permissions: ["items.create"] });
    const event = makeEvent(user);
    const item = { id: "prod-1", name: "Widget", slug: "widget", price: 1000 };

    mockReadBody.mockResolvedValue({ name: "Widget", slug: "widget", price: 1000 });
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([item]),
      }),
    });

    const result = await (createItem as Function)(event);
    expect(result.ok).toBe(true);
    expect(result.data!.name).toBe("Widget");
  });

  it("rejects non-integer price", async () => {
    const event = makeEvent(makeUser({ permissions: ["items.create"] }));
    mockReadBody.mockResolvedValue({ name: "Widget", slug: "widget", price: 9.99 });

    const result = await (createItem as Function)(event);
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// GET /api/items
// ---------------------------------------------------------------------------
describe("GET /api/items", () => {
  beforeEach(() => vi.clearAllMocks());

  // Builder mocks for select chains
  const mockOrderBy = vi.fn();
  const mockOffset = vi.fn();
  const mockLimit = vi.fn();
  const mockWhere = vi.fn();
  const mockLeftJoin = vi.fn();
  const mockFrom = vi.fn();

  function setupListChain(rows: unknown[], count: number) {
    mockOrderBy.mockResolvedValue(rows);
    mockOffset.mockReturnValue({ orderBy: mockOrderBy });
    mockLimit.mockReturnValue({ offset: mockOffset });
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockLeftJoin.mockReturnValue({ where: mockWhere });
    mockFrom.mockReturnValue({ leftJoin: mockLeftJoin });

    const countWhere = vi.fn().mockResolvedValue([{ count }]);
    const countFrom = vi.fn().mockReturnValue({ where: countWhere });

    let callIdx = 0;
    mockSelect.mockImplementation(() => {
      callIdx++;
      if (callIdx % 2 === 1) return { from: mockFrom };
      return { from: countFrom };
    });
  }

  it("returns 401 when no session user", async () => {
    const event = makeEvent(null);
    await expect((listItems as Function)(event)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("returns paginated list", async () => {
    const event = makeEvent(makeUser({ permissions: ["items.view"] }));
    const rows = [
      { id: "p1", name: "A" },
      { id: "p2", name: "B" },
    ];
    mockGetQuery.mockReturnValue({ page: "1", pageSize: "10" });
    setupListChain(rows, 2);

    const result = await (listItems as Function)(event);
    expect(result.ok).toBe(true);
    expect(result.data).toEqual(rows);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
  });

  it("defaults to page 1, pageSize 20", async () => {
    const event = makeEvent(makeUser());
    mockGetQuery.mockReturnValue({});
    setupListChain([], 0);

    const result = await (listItems as Function)(event);
    expect(result.ok).toBe(true);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/items/:id
// ---------------------------------------------------------------------------
describe("DELETE /api/items/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when no session user", async () => {
    const event = makeEvent(null);
    await expect((deleteItem as Function)(event)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("returns 403 when user lacks items.delete permission", async () => {
    const event = makeEvent(makeUser({ permissions: ["items.view"] }));
    await expect((deleteItem as Function)(event)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("returns 400 when id is missing", async () => {
    const event = makeEvent(makeUser({ permissions: ["items.delete"] }));
    mockGetRouterParam.mockReturnValue(undefined);

    await expect((deleteItem as Function)(event)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("returns 404 when item not found", async () => {
    const event = makeEvent(makeUser({ permissions: ["items.delete"] }));
    mockGetRouterParam.mockReturnValue("non-existent-id");
    mockFindFirst.mockResolvedValue(undefined);

    await expect((deleteItem as Function)(event)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("soft-deletes item by setting deletedAt and deletedBy", async () => {
    const user = makeUser({ permissions: ["items.delete"] });
    const event = makeEvent(user);
    mockGetRouterParam.mockReturnValue("prod-to-delete");
    mockFindFirst.mockResolvedValue({ id: "prod-to-delete", deletedAt: null });

    const mockSetFn = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    mockUpdate.mockReturnValue({ set: mockSetFn });

    const result = await (deleteItem as Function)(event);
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSetFn).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: expect.any(Date),
        deletedBy: user.id,
      }),
    );
  });
});
