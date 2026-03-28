import { createError } from "h3";
import { eq, and, isNull } from "drizzle-orm";
import { useDB } from "~/server/database";
import { categories } from "~/server/database/schema";
import { requireAuth, requirePermission } from "~/server/utils/auth";
import { ok } from "~/server/utils/response";
import { logAudit } from "~/server/utils/audit";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  requirePermission(user, "categories.delete");

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Missing id" });

  const db = useDB();
  const existing = await db.query.categories.findFirst({
    where: and(eq(categories.id, id), isNull(categories.deletedAt)),
  });
  if (!existing) throw createError({ statusCode: 404, message: "Not found" });

  // Soft delete
  await db
    .update(categories)
    .set({
      deletedAt: new Date(),
      deletedBy: user.id,
    })
    .where(eq(categories.id, id));

  await logAudit({
    userId: user.id,
    action: "delete",
    entityType: "category",
    entityId: id,
  });

  return ok();
});
