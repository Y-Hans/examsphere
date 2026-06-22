'use server';

import { auth } from '@/lib/auth';
import { UserContext } from '@/server/shared/user-context';
import { TenantContext } from '@/server/shared/tenant-context';
import { permissionService } from '@/modules/rbac/services/permission.service';
import { superAdminService } from '../services/super-admin.service';
import { updateTenantStatusSchema, tenantQuerySchema } from '../dto/super-admin.dto';
import { AppError, AuthorizationError } from '@/server/shared/errors';

async function getContext() {
  const session = await auth();
  if (!session?.user) throw new AuthorizationError('Session required');
  
  // Super admins typically belong to the main platform tenant or have a global flag.
  // We still run them through context, but they bypass tenant scoping in the repo.
  return UserContext.run(
    {
      userId: session.user.id,
      tenantId: session.user.tenantId,
      roleIds: session.user.roleIds,
      permissions: session.user.permissions,
    },
    () => TenantContext.run(
      // For super admin, tenantId might be the main platform tenant ID.
      // The SuperAdminRepository uses `prisma` directly, bypassing the scoping extension.
      { tenantId: session.user.tenantId, subdomain: session.user.tenantSubdomain },
      async () => true
    )
  );
}

export async function getSuperAdminDashboardAction() {
  try {
    await getContext();
    permissionService.assert('tenant', 'manage'); // 'manage' implies super-admin level
    
    const result = await superAdminService.getDashboardData();
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch platform data' } };
  }
}

export async function getTenantsAction(query: any) {
  try {
    await getContext();
    permissionService.assert('tenant', 'manage');
    
    const input = tenantQuerySchema.parse(query);
    const result = await superAdminService.getTenants(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tenants' } };
  }
}

export async function updateTenantStatusAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) throw new AuthorizationError('Session required');
    
    await UserContext.run(
      {
        userId: session.user.id,
        tenantId: session.user.tenantId,
        roleIds: session.user.roleIds,
        permissions: session.user.permissions,
      },
      () => TenantContext.run(
        { tenantId: session.user.tenantId, subdomain: session.user.tenantSubdomain },
        async () => {
          permissionService.assert('tenant', 'manage');
          return true;
        }
      )
    );

    const input = updateTenantStatusSchema.parse({
      tenantId: formData.get('tenantId'),
      status: formData.get('status'),
    });

    const result = await superAdminService.updateTenantStatus(input, session.user.id);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update tenant status' } };
  }
}