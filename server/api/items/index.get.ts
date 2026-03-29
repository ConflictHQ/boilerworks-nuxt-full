import { isNull, sql, eq } from "drizzle-orm";
import { useDB } from "~/server/database";
import { items, categories } from "~/server/database/schema";
import { requireAuth } from "~/server/utils/auth";
import { paginated } from "~/server/utils/response";
import { getPaginationParams } from "~/server/utils/query";

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const db = useDB();
  const { page, pageSize, offset } = getPaginationParams(event);
  const query = getQuery(event);

  const conditions = [isNull(items.deletedAt)];
  if (query.categoryId) {
    conditions.push(eq(items.categoryId, String(query.categoryId)));
  }

  const whereClause =
    conditions.length === 1 ? conditions[0]! : sql`${conditions[0]} AND ${conditions[1]}`;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: items.id,
        name: items.name,
        slug: items.slug,
        description: items.description,
        price: items.price,
        sku: items.sku,
        isPublished: items.isPublished,
        categoryId: items.categoryId,
        categoryName: categories.name,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(whereClause)
      .limit(pageSize)
      .offset(offset)
      .orderBy(items.name),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(whereClause),
  ]);

  return paginated(rows, countResult[0]?.count ?? 0, page, pageSize);
});
