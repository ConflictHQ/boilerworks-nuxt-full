import { z } from "zod";
import { readBody } from "h3";
import { useDB } from "~/server/database";
import { users } from "~/server/database/schema";
import { requireAuth, requireSuperuser, hashPassword } from "~/server/utils/auth";
import { ok, fail } from "~/server/utils/response";
import { logAudit } from "~/server/utils/audit";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password: z.string().min(8),
  isActive: z.boolean().optional(),
  isSuperuser: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  requireSuperuser(user);

  const body = await readBody(event);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }

  const db = useDB();
  const passwordHash = await hashPassword(parsed.data.password);

  const [row] = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      isActive: parsed.data.isActive ?? true,
      isSuperuser: parsed.data.isSuperuser ?? false,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      isActive: users.isActive,
      isSuperuser: users.isSuperuser,
    });

  await logAudit({
    userId: user.id,
    action: "create",
    entityType: "user",
    entityId: row!.id,
    newValues: { email: parsed.data.email, name: parsed.data.name },
  });

  return ok(row);
});
