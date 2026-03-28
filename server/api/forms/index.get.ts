import { isNull, sql } from "drizzle-orm";
import { useDB } from "~/server/database";
import { formDefinitions } from "~/server/database/schema";
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
      .from(formDefinitions)
      .where(isNull(formDefinitions.deletedAt))
      .limit(pageSize)
      .offset(offset)
      .orderBy(formDefinitions.name),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(formDefinitions)
      .where(isNull(formDefinitions.deletedAt)),
  ]);

  return paginated(rows, countResult[0]?.count ?? 0, page, pageSize);
});
