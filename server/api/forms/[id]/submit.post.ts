import { z } from "zod";
import { readBody, createError } from "h3";
import { eq, and, isNull } from "drizzle-orm";
import { useDB } from "~/server/database";
import { formDefinitions, formSubmissions } from "~/server/database/schema";
import { requireAuth } from "~/server/utils/auth";
import { ok, fail } from "~/server/utils/response";
import { logAudit } from "~/server/utils/audit";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Missing id" });

  const db = useDB();
  const form = await db.query.formDefinitions.findFirst({
    where: and(
      eq(formDefinitions.id, id),
      isNull(formDefinitions.deletedAt),
    ),
  });

  if (!form) throw createError({ statusCode: 404, message: "Form not found" });
  if (!form.isActive)
    throw createError({ statusCode: 400, message: "Form is not active" });

  const body = await readBody(event);
  const data = body?.data;
  if (!data || typeof data !== "object") {
    return fail(["data is required and must be an object"]);
  }

  // Validate required fields
  const errors: string[] = [];
  for (const field of form.fields ?? []) {
    if (field.required && !data[field.name]) {
      errors.push(`${field.label} is required`);
    }
  }
  if (errors.length > 0) return fail(errors);

  const [row] = await db
    .insert(formSubmissions)
    .values({
      formDefinitionId: id,
      data,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  await logAudit({
    userId: user.id,
    action: "submit",
    entityType: "form_submission",
    entityId: row!.id,
    newValues: { formDefinitionId: id },
  });

  return ok(row);
});
