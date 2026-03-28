import { isNull, sql, eq } from "drizzle-orm";
import { useDB } from "~/server/database";
import { categories } from "~/server/database/schema";
import { requireAuth } from "~/server/utils/auth";
import { paginated } from "~/server/utils/response";
import { getPaginationParams } from "~/server/utils/query";

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const db = useDB();
  const { page, pageSize, offset } = getPaginationParams(event);

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(isNull(categories.deletedAt))
      .limit(pageSize)
      .offset(offset)
      .orderBy(categories.name),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(categories)
      .where(isNull(categories.deletedAt)),
  ]);

  return paginated(rows, countResult[0]?.count ?? 0, page, pageSize);
});
