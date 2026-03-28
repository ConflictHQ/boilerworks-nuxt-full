import { destroySession, requireAuth } from "~/server/utils/auth";
import { ok } from "~/server/utils/response";
import { logAudit } from "~/server/utils/audit";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  await destroySession(event);

  await logAudit({
    userId: user.id,
    action: "logout",
    entityType: "user",
    entityId: user.id,
  });

  return ok();
});
