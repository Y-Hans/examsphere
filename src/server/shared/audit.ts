import { prisma } from '@/server/infrastructure/prisma/client';
import { UserContext } from './user-context';
import { TenantContext } from './tenant-context';
import { logger } from './logger';

export interface AuditParams {
  action: string;
  resourceType: string;
  resourceId?: string;
  beforeState?: any;
  afterState?: any;
}

export async function writeAuditLog(params: AuditParams): Promise<void> {
  const log = logger.child({ module: 'Audit' });
  const userId = UserContext.getUserId();
  const tenantId = TenantContext.getTenantId();

  try {
    await prisma.auditLog.create({
      data: {
        tenantId: tenantId || null,
        actorId: userId || null,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId || null,
        beforeState: params.beforeState ? JSON.stringify(params.beforeState) : null,
        afterState: params.afterState ? JSON.stringify(params.afterState) : null,
      },
    });
  } catch (error) {
    log.error({ error, params }, 'Failed to write audit log');
    // Don't throw, audit logging should ideally not break the main flow
    // unless strict compliance is required. We'll log the error.
  }
}