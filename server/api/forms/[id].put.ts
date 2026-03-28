import { z } from "zod";
import { readBody, createError } from "h3";
import { eq, and, isNull } from "drizzle-orm";
import { useDB } from "~/server/database";
import { formDefinitions } from "~/server/database/schema";
import { requireAuth, requirePermission } from "~/server/utils/auth";
import { ok, fail } from "~/server/utils/response";
import { logAudit } from "~/server/utils/audit";

const fieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum([
    "text",
    "textarea",
    "number",
    "email",
    "select",
    "checkbox",
    "date",
  ]),
  required: z.boolean().optional(),
  options: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .optional(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
});

const updateFormSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  fields: z.array(fieldSchema).min(1).optional(),
  isActive: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  requirePermission(user, "forms.update");

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Missing id" });

  const body = await readBody(event);
  const parsed = updateFormSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }

  const db = useDB();
  const existing = await db.query.formDefinitions.findFirst({
    where: and(eq(formDefinitions.id, id), isNull(formDefinitions.deletedAt)),
  });
  if (!existing) throw createError({ statusCode: 404, message: "Not found" });

  const [row] = await db
    .update(formDefinitions)
    .set({
      ...parsed.data,
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(formDefinitions.id, id))
    .returning();

  await logAudit({
    userId: user.id,
    action: "update",
    entityType: "form_definition",
    entityId: id,
    oldValues: { name: existing.name },
    newValues: parsed.data,
  });

  return ok(row);
});
