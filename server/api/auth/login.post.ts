import { z } from "zod";
import { readBody, createError } from "h3";
import { eq, and, isNull } from "drizzle-orm";
import { useDB } from "~/server/database";
import { users } from "~/server/database/schema";
import { createSession, verifyPassword } from "~/server/utils/auth";
import { ok, fail } from "~/server/utils/response";
import { logAudit } from "~/server/utils/audit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }

  const db = useDB();
  const user = await db.query.users.findFirst({
    where: and(eq(users.email, parsed.data.email), isNull(users.deletedAt)),
  });

  if (!user || !user.isActive) {
    throw createError({ statusCode: 401, message: "Invalid credentials" });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    throw createError({ statusCode: 401, message: "Invalid credentials" });
  }

  await createSession(event, user.id);

  await logAudit({
    userId: user.id,
    action: "login",
    entityType: "user",
    entityId: user.id,
  });

  return ok({ id: user.id, email: user.email, name: user.name });
});
