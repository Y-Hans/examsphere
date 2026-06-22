'use server';

import { auth } from '@/lib/auth';
import { UserContext } from '@/server/shared/user-context';
import { TenantContext } from '@/server/shared/tenant-context';
import { permissionService } from '@/modules/rbac/services/permission.service';
import { doubtService } from '../services/doubt.service';
import { resolveDoubtSchema } from '../dto/doubt.dto';
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

export async function getTeacherDoubtsAction(status?: string) {
  try {
    await getContext();
    permissionService.assert('doubt', 'read');
    const result = await doubtService.getDoubts(status);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch doubts' } };
  }
}

export async function getDoubtDetailsAction(doubtId: string) {
  try {
    await getContext();
    permissionService.assert('doubt', 'read');
    const result = await doubtService.getDoubtDetails(doubtId);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch doubt details' } };
  }
}

export async function resolveDoubtAction(formData: FormData) {
  try {
    await getContext();
    permissionService.assert('doubt', 'update');

    const input = resolveDoubtSchema.parse({
      doubtId: formData.get('doubtId'),
      body: formData.get('body'),
    });

    const result = await doubtService.resolveDoubt(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message, field: error.field } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to resolve doubt' } };
  }
}