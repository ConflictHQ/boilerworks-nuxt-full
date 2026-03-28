import { requireAuth } from "~/server/utils/auth";
import { ok } from "~/server/utils/response";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  return ok(user);
});
