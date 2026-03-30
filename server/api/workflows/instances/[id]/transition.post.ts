import { z } from "zod";
import { readBody, createError } from "h3";
import { eq } from "drizzle-orm";
import { useDB } from "~/server/database";
import {
  workflowDefinitions,
  workflowInstances,
  workflowTransitions,
} from "~/server/database/schema";
import { requireAuth, requirePermission } from "~/server/utils/auth";
import { ok, fail } from "~/server/utils/response";
import { logAudit } from "~/server/utils/audit";

const transitionSchema = z.object({
  toStep: z.string().min(1),
  action: z.string().optional(),
  comment: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  requirePermission(user, "workflows.execute");

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Missing id" });

  const body = await readBody(event);
  const parsed = transitionSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }

  const db = useDB();
  const instance = await db.query.workflowInstances.findFirst({
    where: eq(workflowInstances.id, id),
    with: { definition: true },
  });

  if (!instance) throw createError({ statusCode: 404, message: "Instance not found" });
  if (instance.status !== "active")
    throw createError({
      statusCode: 400,
      message: "Workflow instance is not active",
    });

  // Validate the transition is allowed
  const currentStepDef = instance.definition.steps?.find((s) => s.name === instance.currentStep);
  if (!currentStepDef)
    throw createError({
      statusCode: 400,
      message: "Current step not found in definition",
    });
  if (!currentStepDef.nextSteps.includes(parsed.data.toStep)) {
    return fail([
      `Transition from '${instance.currentStep}' to '${parsed.data.toStep}' is not allowed`,
    ]);
  }

  // Check if the target step exists
  const targetStep = instance.definition.steps?.find((s) => s.name === parsed.data.toStep);
  if (!targetStep) {
    return fail([`Step '${parsed.data.toStep}' not found in workflow`]);
  }

  // Determine if workflow is now completed (no next steps from target)
  const isCompleted = targetStep.nextSteps.length === 0;

  // Record the transition
  await db.insert(workflowTransitions).values({
    instanceId: id,
    fromStep: instance.currentStep,
    toStep: parsed.data.toStep,
    action: parsed.data.action,
    comment: parsed.data.comment,
    createdBy: user.id,
    updatedBy: user.id,
  });

  // Update instance
  const [updated] = await db
    .update(workflowInstances)
    .set({
      currentStep: parsed.data.toStep,
      status: isCompleted ? "completed" : "active",
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(workflowInstances.id, id))
    .returning();

  await logAudit({
    userId: user.id,
    action: "transition",
    entityType: "workflow_instance",
    entityId: id,
    oldValues: { currentStep: instance.currentStep },
    newValues: {
      currentStep: parsed.data.toStep,
      status: isCompleted ? "completed" : "active",
    },
  });

  return ok(updated);
});
