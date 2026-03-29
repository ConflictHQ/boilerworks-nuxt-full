import { z } from "zod";
import { readBody } from "h3";
import { useDB } from "~/server/database";
import { items } from "~/server/database/schema";
import { requireAuth, requirePermission } from "~/server/utils/auth";
import { ok, fail } from "~/server/utils/response";
import { logAudit } from "~/server/utils/audit";

const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().int().min(0),
  sku: z.string().optional(),
  isPublished: z.boolean().optional(),
  categoryId: z.string().uuid().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  requirePermission(user, "items.create");

  const body = await readBody(event);
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }

  const db = useDB();
  const [row] = await db
    .insert(items)
    .values({
      ...parsed.data,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  await logAudit({
    userId: user.id,
    action: "create",
    entityType: "item",
    entityId: row!.id,
    newValues: parsed.data,
  });

  return ok(row);
});
