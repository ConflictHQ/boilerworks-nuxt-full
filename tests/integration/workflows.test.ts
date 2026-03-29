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

const mockFindFirstInstance = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

const mockDb = {
  query: {
    workflowInstances: { findFirst: mockFindFirstInstance },
  },
  insert: mockInsert,
  update: mockUpdate,
};

vi.mock("~/server/database", () => ({
  useDB: () => mockDb,
}));

vi.mock("~/server/utils/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

// Override Nitro auto-imports for handler body usage
(globalThis as any).getRouterParam = (...args: unknown[]) => mockGetRouterParam(...args);

import transitionHandler from "~/server/api/workflows/instances/[id]/transition.post";

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

const sampleSteps = [
  { name: "draft", label: "Draft", type: "manual", nextSteps: ["review"] },
  { name: "review", label: "Review", type: "manual", nextSteps: ["approved", "rejected"] },
  { name: "approved", label: "Approved", type: "manual", nextSteps: [] },
  { name: "rejected", label: "Rejected", type: "manual", nextSteps: ["draft"] },
];

// ---------------------------------------------------------------------------
// POST /api/workflows/instances/:id/transition
// ---------------------------------------------------------------------------
describe("POST /api/workflows/instances/:id/transition", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when no session user", async () => {
    await expect((transitionHandler as Function)(makeEvent(null))).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("returns 403 when user lacks workflows.execute permission", async () => {
    const event = makeEvent(makeUser({ permissions: ["items.view"] }));
    await expect((transitionHandler as Function)(event)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("returns 404 when instance not found", async () => {
    const event = makeEvent(makeUser({ permissions: ["workflows.execute"] }));
    mockGetRouterParam.mockReturnValue("inst-1");
    mockReadBody.mockResolvedValue({ toStep: "review" });
    mockFindFirstInstance.mockResolvedValue(undefined);
    await expect((transitionHandler as Function)(event)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("returns 400 when instance is not active", async () => {
    const event = makeEvent(makeUser({ permissions: ["workflows.execute"] }));
    mockGetRouterParam.mockReturnValue("inst-1");
    mockReadBody.mockResolvedValue({ toStep: "review" });
    mockFindFirstInstance.mockResolvedValue({
      id: "inst-1",
      currentStep: "draft",
      status: "completed",
      definition: { steps: sampleSteps },
    });
    await expect((transitionHandler as Function)(event)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("rejects disallowed transition (draft -> approved)", async () => {
    const event = makeEvent(makeUser({ permissions: ["workflows.execute"] }));
    mockGetRouterParam.mockReturnValue("inst-1");
    mockReadBody.mockResolvedValue({ toStep: "approved" });
    mockFindFirstInstance.mockResolvedValue({
      id: "inst-1",
      currentStep: "draft",
      status: "active",
      definition: { steps: sampleSteps },
    });

    const result = await (transitionHandler as Function)(event);
    expect(result.ok).toBe(false);
    expect(result.errors![0]).toContain("not allowed");
  });

  it("transitions from draft to review", async () => {
    const event = makeEvent(makeUser({ permissions: ["workflows.execute"] }));
    mockGetRouterParam.mockReturnValue("inst-1");
    mockReadBody.mockResolvedValue({ toStep: "review" });
    mockFindFirstInstance.mockResolvedValue({
      id: "inst-1",
      currentStep: "draft",
      status: "active",
      definition: { steps: sampleSteps },
    });

    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
    const updatedInstance = { id: "inst-1", currentStep: "review", status: "active" };
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedInstance]),
        }),
      }),
    });

    const result = await (transitionHandler as Function)(event);
    expect(result.ok).toBe(true);
    expect(result.data!.currentStep).toBe("review");
    expect(result.data!.status).toBe("active");
  });

  it("marks instance as completed when reaching terminal step", async () => {
    const event = makeEvent(makeUser({ permissions: ["workflows.execute"] }));
    mockGetRouterParam.mockReturnValue("inst-1");
    mockReadBody.mockResolvedValue({ toStep: "approved" });
    mockFindFirstInstance.mockResolvedValue({
      id: "inst-1",
      currentStep: "review",
      status: "active",
      definition: { steps: sampleSteps },
    });

    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
    const updatedInstance = { id: "inst-1", currentStep: "approved", status: "completed" };
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedInstance]),
        }),
      }),
    });

    const result = await (transitionHandler as Function)(event);
    expect(result.ok).toBe(true);
    expect(result.data!.status).toBe("completed");
  });

  it("validates toStep is required in body", async () => {
    const event = makeEvent(makeUser({ permissions: ["workflows.execute"] }));
    mockGetRouterParam.mockReturnValue("inst-1");
    mockReadBody.mockResolvedValue({});

    const result = await (transitionHandler as Function)(event);
    expect(result.ok).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
