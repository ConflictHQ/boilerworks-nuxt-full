import { isNull, sql, eq } from "drizzle-orm";
import { useDB } from "~/server/database";
import { products, categories } from "~/server/database/schema";
import { requireAuth } from "~/server/utils/auth";
import { paginated } from "~/server/utils/response";
import { getPaginationParams } from "~/server/utils/query";

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const db = useDB();
  const { page, pageSize, offset } = getPaginationParams(event);
  const query = getQuery(event);

  const conditions = [isNull(products.deletedAt)];
  if (query.categoryId) {
    conditions.push(eq(products.categoryId, String(query.categoryId)));
  }

  const whereClause =
    conditions.length === 1 ? conditions[0]! : sql`${conditions[0]} AND ${conditions[1]}`;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        price: products.price,
        sku: products.sku,
        isPublished: products.isPublished,
        categoryId: products.categoryId,
        categoryName: categories.name,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .limit(pageSize)
      .offset(offset)
      .orderBy(products.name),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause),
  ]);

  return paginated(rows, countResult[0]?.count ?? 0, page, pageSize);
});
