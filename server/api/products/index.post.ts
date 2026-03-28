import { z } from "zod";
import { readBody } from "h3";
import { useDB } from "~/server/database";
import { products } from "~/server/database/schema";
import { requireAuth, requirePermission } from "~/server/utils/auth";
import { ok, fail } from "~/server/utils/response";
import { logAudit } from "~/server/utils/audit";

const createProductSchema = z.object({
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
  requirePermission(user, "products.create");

  const body = await readBody(event);
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }

  const db = useDB();
  const [row] = await db
    .insert(products)
    .values({
      ...parsed.data,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  await logAudit({
    userId: user.id,
    action: "create",
    entityType: "product",
    entityId: row!.id,
    newValues: parsed.data,
  });

  return ok(row);
});
