import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface AuditInput {
  companyId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAudit(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      companyId: input.companyId,
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      oldValues: input.oldValues as Prisma.InputJsonValue | undefined,
      newValues: input.newValues as Prisma.InputJsonValue | undefined,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}
