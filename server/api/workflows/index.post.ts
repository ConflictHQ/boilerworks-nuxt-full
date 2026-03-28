import { z } from "zod";
import { readBody } from "h3";
import { useDB } from "~/server/database";
import { workflowDefinitions } from "~/server/database/schema";
import { requireAuth, requirePermission } from "~/server/utils/auth";
import { ok, fail } from "~/server/utils/response";
import { logAudit } from "~/server/utils/audit";

const stepSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["manual", "auto"]),
  assigneeGroupId: z.string().uuid().optional(),
  nextSteps: z.array(z.string()),
});

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  steps: z.array(stepSchema).min(1),
  isActive: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  requirePermission(user, "workflows.create");

  const body = await readBody(event);
  const parsed = createWorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }

  const db = useDB();
  const [row] = await db
    .insert(workflowDefinitions)
    .values({
      ...parsed.data,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  await logAudit({
    userId: user.id,
    action: "create",
    entityType: "workflow_definition",
    entityId: row!.id,
    newValues: { name: parsed.data.name, slug: parsed.data.slug },
  });

  return ok(row);
});
