import { eq, and, isNull } from "drizzle-orm";
import { createError } from "h3";
import { useDB } from "~/server/database";
import { products } from "~/server/database/schema";
import { requireAuth } from "~/server/utils/auth";
import { ok } from "~/server/utils/response";

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Missing id" });

  const db = useDB();
  const row = await db.query.products.findFirst({
    where: and(eq(products.id, id), isNull(products.deletedAt)),
    with: { category: true },
  });

  if (!row) throw createError({ statusCode: 404, message: "Not found" });
  return ok(row);
});
