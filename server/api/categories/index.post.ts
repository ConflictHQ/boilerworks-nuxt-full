import { z } from "zod";
import { readBody } from "h3";
import { useDB } from "~/server/database";
import { categories } from "~/server/database/schema";
import { requireAuth, requirePermission } from "~/server/utils/auth";
import { ok, fail } from "~/server/utils/response";
import { logAudit } from "~/server/utils/audit";

const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  requirePermission(user, "categories.create");

  const body = await readBody(event);
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }

  const db = useDB();
  const [row] = await db
    .insert(categories)
    .values({
      ...parsed.data,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  await logAudit({
    userId: user.id,
    action: "create",
    entityType: "category",
    entityId: row!.id,
    newValues: parsed.data,
  });

  return ok(row);
});
