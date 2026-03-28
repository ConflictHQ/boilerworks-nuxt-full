import { isNull, sql } from "drizzle-orm";
import { useDB } from "~/server/database";
import { groups } from "~/server/database/schema";
import { requireAuth, requireSuperuser } from "~/server/utils/auth";
import { paginated } from "~/server/utils/response";
import { getPaginationParams } from "~/server/utils/query";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  requireSuperuser(user);

  const db = useDB();
  const { page, pageSize, offset } = getPaginationParams(event);

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(groups)
      .where(isNull(groups.deletedAt))
      .limit(pageSize)
      .offset(offset)
      .orderBy(groups.name),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(groups)
      .where(isNull(groups.deletedAt)),
  ]);

  return paginated(rows, countResult[0]?.count ?? 0, page, pageSize);
});
