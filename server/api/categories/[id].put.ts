import { z } from "zod";
import { readBody, createError } from "h3";
import { eq, and, isNull } from "drizzle-orm";
import { useDB } from "~/server/database";
import { categories } from "~/server/database/schema";
import { requireAuth, requirePermission } from "~/server/utils/auth";
import { ok, fail } from "~/server/utils/response";
import { logAudit } from "~/server/utils/audit";

const updateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  requirePermission(user, "categories.update");

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Missing id" });

  const body = await readBody(event);
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }

  const db = useDB();
  const existing = await db.query.categories.findFirst({
    where: and(eq(categories.id, id), isNull(categories.deletedAt)),
  });
  if (!existing) throw createError({ statusCode: 404, message: "Not found" });

  const [row] = await db
    .update(categories)
    .set({
      ...parsed.data,
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, id))
    .returning();

  await logAudit({
    userId: user.id,
    action: "update",
    entityType: "category",
    entityId: id,
    oldValues: existing as unknown as Record<string, unknown>,
    newValues: parsed.data,
  });

  return ok(row);
});
