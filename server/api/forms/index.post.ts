import { z } from "zod";
import { readBody } from "h3";
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

const createFormSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  fields: z.array(fieldSchema).min(1),
  isActive: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  requirePermission(user, "forms.create");

  const body = await readBody(event);
  const parsed = createFormSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }

  const db = useDB();
  const [row] = await db
    .insert(formDefinitions)
    .values({
      ...parsed.data,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  await logAudit({
    userId: user.id,
    action: "create",
    entityType: "form_definition",
    entityId: row!.id,
    newValues: { name: parsed.data.name, slug: parsed.data.slug },
  });

  return ok(row);
});
