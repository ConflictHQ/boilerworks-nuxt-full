import { getSessionUser } from "../utils/auth";

export default defineEventHandler(async (event) => {
  event.context.user = await getSessionUser(event);
});
