import "server-only";
import { db } from "@/lib/db";

export function writeAudit(actorId: string | null, action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) {
  return db.auditLog.create({ data: { actorId, action, entityType, entityId, details: details ? JSON.stringify(details) : null } });
}
