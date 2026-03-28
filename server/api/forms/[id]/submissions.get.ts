import { eq, sql } from "drizzle-orm";
import { createError } from "h3";
import { useDB } from "~/server/database";
import { formSubmissions } from "~/server/database/schema";
import { requireAuth, requirePermission } from "~/server/utils/auth";
import { paginated } from "~/server/utils/response";
import { getPaginationParams } from "~/server/utils/query";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  requirePermission(user, "forms.view_submissions");

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Missing id" });

  const db = useDB();
  const { page, pageSize, offset } = getPaginationParams(event);

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(formSubmissions)
      .where(eq(formSubmissions.formDefinitionId, id))
      .limit(pageSize)
      .offset(offset)
      .orderBy(formSubmissions.createdAt),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(formSubmissions)
      .where(eq(formSubmissions.formDefinitionId, id)),
  ]);

  return paginated(rows, countResult[0]?.count ?? 0, page, pageSize);
});
