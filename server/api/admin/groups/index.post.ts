import { z } from "zod";
import { readBody } from "h3";
import { useDB } from "~/server/database";
import { groups, groupPermissions } from "~/server/database/schema";
import { requireAuth, requireSuperuser } from "~/server/utils/auth";
import { ok, fail } from "~/server/utils/response";
import { logAudit } from "~/server/utils/audit";

const createGroupSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  requireSuperuser(user);

  const body = await readBody(event);
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((i) => i.message));
  }

  const db = useDB();
  const [row] = await db
    .insert(groups)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  if (parsed.data.permissionIds?.length) {
    await db.insert(groupPermissions).values(
      parsed.data.permissionIds.map((permissionId) => ({
        groupId: row!.id,
        permissionId,
      })),
    );
  }

  await logAudit({
    userId: user.id,
    action: "create",
    entityType: "group",
    entityId: row!.id,
    newValues: { name: parsed.data.name },
  });

  return ok(row);
});
