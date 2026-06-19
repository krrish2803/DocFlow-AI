import { prisma } from '@/lib/prisma';

export async function createAuditLog(params: {
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  workspaceId: string;
  userId?: string;
}) {
  return prisma.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details ? JSON.stringify(params.details) : null,
      workspaceId: params.workspaceId,
      userId: params.userId ?? null,
    },
  });
}
