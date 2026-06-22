'use server';

import { tenantService } from '../services/tenant.service';
import { updateBrandingSchema, updateTenantSettingsSchema } from '../dto/tenant.dto';
import { AppError, AuthorizationError } from '@/server/shared/errors';
import { UserContext } from '@/server/shared/user-context';
import { TenantContext } from '@/server/shared/tenant-context';
import { auth } from '@/lib/auth';
import { permissionService } from '@/modules/rbac/services/permission.service';

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
    () => {
      return TenantContext.run(
        { tenantId: session.user.tenantId, subdomain: session.user.tenantSubdomain },
        async () => {
          permissionService.assert('tenant', 'update');
          return true;
        }
      );
    }
  );
}

export async function updateTenantBrandingAction(formData: FormData) {
  try {
    await getContext();

    const input = updateBrandingSchema.parse({
      primaryColor: formData.get('primaryColor'),
      logoUrl: formData.get('logoUrl') || undefined,
      customDomain: formData.get('customDomain') || undefined,
      theme: formData.get('theme'),
    });

    const result = await tenantService.updateBranding(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message, field: error.field } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update branding' } };
  }
}

export async function updateTenantSettingsAction(formData: FormData) {
  try {
    await getContext();

    const input = updateTenantSettingsSchema.parse({
      allowStudentSignup: formData.get('allowStudentSignup') === 'true',
      requireEmailVerification: formData.get('requireEmailVerification') === 'true',
      defaultExamCode: formData.get('defaultExamCode') || undefined,
      timezone: formData.get('timezone') || 'Asia/Kolkata',
    });

    const result = await tenantService.updateSettings(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message, field: error.field } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update settings' } };
  }
}

export async function getCurrentTenantConfig() {
  try {
    const session = await auth();
    if (!session?.user) throw new AuthorizationError('Session required');
    
    // Just fetch, no permission check needed for own tenant config
    return UserContext.run(
      {
        userId: session.user.id,
        tenantId: session.user.tenantId,
        roleIds: session.user.roleIds,
        permissions: session.user.permissions,
      },
      () => {
        return TenantContext.run(
          { tenantId: session.user.tenantId, subdomain: session.user.tenantSubdomain },
          async () => {
            const tenant = await tenantService.getCurrentTenant();
            const features = await tenantService.getFeatureConfig(tenant.id);
            return { success: true, data: { tenant, features } };
          }
        );
      }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tenant config' } };
  }
}