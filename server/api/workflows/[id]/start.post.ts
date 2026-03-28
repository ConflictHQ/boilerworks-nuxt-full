import { z } from "zod";
import { readBody, createError } from "h3";
import { eq, and, isNull } from "drizzle-orm";
import { useDB } from "~/server/database";
import {
  workflowDefinitions,
  workflowInstances,
} from "~/server/database/schema";
import { requireAuth, requirePermission } from "~/server/utils/auth";
import { ok, fail } from "~/server/utils/response";
import { logAudit } from "~/server/utils/audit";

const startSchema = z.object({
  context: z.record(z.unknown()).optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  requirePermission(user, "workflows.execute");

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Missing id" });

  const body = await readBody(event);
  const parsed = startSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }

  const db = useDB();
  const workflow = await db.query.workflowDefinitions.findFirst({
    where: and(
      eq(workflowDefinitions.id, id),
      isNull(workflowDefinitions.deletedAt),
    ),
  });

  if (!workflow)
    throw createError({ statusCode: 404, message: "Workflow not found" });
  if (!workflow.isActive)
    throw createError({ statusCode: 400, message: "Workflow is not active" });

  const firstStep = workflow.steps?.[0];
  if (!firstStep)
    throw createError({
      statusCode: 400,
      message: "Workflow has no steps",
    });

  const [instance] = await db
    .insert(workflowInstances)
    .values({
      workflowDefinitionId: id,
      currentStep: firstStep.name,
      status: "active",
      context: parsed.data.context ?? {},
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  await logAudit({
    userId: user.id,
    action: "start",
    entityType: "workflow_instance",
    entityId: instance!.id,
    newValues: { workflowDefinitionId: id, currentStep: firstStep.name },
  });

  return ok(instance);
});
