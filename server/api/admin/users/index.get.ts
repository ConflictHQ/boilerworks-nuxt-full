import { isNull, sql } from "drizzle-orm";
import { useDB } from "~/server/database";
import { users } from "~/server/database/schema";
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
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        isActive: users.isActive,
        isSuperuser: users.isSuperuser,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(isNull(users.deletedAt))
      .limit(pageSize)
      .offset(offset)
      .orderBy(users.email),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(isNull(users.deletedAt)),
  ]);

  return paginated(rows, countResult[0]?.count ?? 0, page, pageSize);
});
