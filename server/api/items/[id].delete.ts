import { createError } from "h3";
import { eq, and, isNull } from "drizzle-orm";
import { useDB } from "~/server/database";
import { items } from "~/server/database/schema";
import { requireAuth, requirePermission } from "~/server/utils/auth";
import { ok } from "~/server/utils/response";
import { logAudit } from "~/server/utils/audit";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  requirePermission(user, "items.delete");

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Missing id" });

  const db = useDB();
  const existing = await db.query.items.findFirst({
    where: and(eq(items.id, id), isNull(items.deletedAt)),
  });
  if (!existing) throw createError({ statusCode: 404, message: "Not found" });

  await db
    .update(items)
    .set({
      deletedAt: new Date(),
      deletedBy: user.id,
    })
    .where(eq(items.id, id));

  await logAudit({
    userId: user.id,
    action: "delete",
    entityType: "item",
    entityId: id,
  });

  return ok();
});
