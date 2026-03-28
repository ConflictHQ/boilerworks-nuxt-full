import { useDB } from "../database";
import { auditLogs } from "../database/schema";

export async function logAudit(params: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}): Promise<void> {
  const db = useDB();
  await db.insert(auditLogs).values({
    userId: params.userId ?? undefined,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? undefined,
    oldValues: params.oldValues ?? undefined,
    newValues: params.newValues ?? undefined,
  });
}
