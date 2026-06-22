'use server';

import { auth } from '@/lib/auth';
import { UserContext } from '@/server/shared/user-context';
import { TenantContext } from '@/server/shared/tenant-context';
import { permissionService } from '@/modules/rbac/services/permission.service';
import { analyticsService } from '../services/analytics.service';
import { getDashboardQuerySchema, getRankPredictionSchema } from '../dto/analytics.dto';
import { AppError, AuthorizationError } from '@/server/shared/errors';

async function getContext() {
  const session = await auth();
  if (!session?.user) throw new AuthorizationError('Session required');
  
  return UserContext.run(
    {
      userId: session.user.id,
      tenantId: session.user.tenantId,
      roleIds: session.user.roleIds,
      permissions: session.user.permissions,
    },
    () => TenantContext.run(
      { tenantId: session.user.tenantId, subdomain: session.user.tenantSubdomain },
      async () => true
    )
  );
}

export async function getDashboardDataAction(query: any) {
  try {
    await getContext();
    permissionService.assert('analytics', 'read');

    const input = getDashboardQuerySchema.parse(query);
    const result = await analyticsService.getDashboardData(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard data' } };
  }
}

export async function getRankPredictionAction(formData: FormData) {
  try {
    await getContext();
    permissionService.assert('analytics', 'read');

    const input = getRankPredictionSchema.parse({
      examId: formData.get('examId'),
    });

    const result = await analyticsService.getRankPrediction(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate rank prediction' } };
  }
}