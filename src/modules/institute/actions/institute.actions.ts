'use server';

import { auth } from '@/lib/auth';
import { UserContext } from '@/server/shared/user-context';
import { TenantContext } from '@/server/shared/tenant-context';
import { permissionService } from '@/modules/rbac/services/permission.service';
import { instituteService } from '../services/institute.service';
import { createBatchSchema, enrollStudentSchema } from '../dto/institute.dto';
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

export async function getInstituteDashboardAction() {
  try {
    await getContext();
    permissionService.assert('tenant', 'read');
    const result = await instituteService.getDashboardData();
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard data' } };
  }
}

export async function getBatchesAction() {
  try {
    await getContext();
    permissionService.assert('tenant', 'read');
    const result = await instituteService.getBatches();
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch batches' } };
  }
}

export async function getBatchDetailsAction(batchId: string) {
  try {
    await getContext();
    permissionService.assert('tenant', 'read');
    const result = await instituteService.getBatchDetails(batchId);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch batch details' } };
  }
}

export async function createBatchAction(formData: FormData) {
  try {
    await getContext();
    permissionService.assert('tenant', 'update');

    const input = createBatchSchema.parse({
      name: formData.get('name'),
      description: formData.get('description') || undefined,
    });

    const result = await instituteService.createBatch(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message, field: error.field } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create batch' } };
  }
}

export async function enrollStudentAction(formData: FormData) {
  try {
    await getContext();
    permissionService.assert('tenant', 'update');

    const input = enrollStudentSchema.parse({
      batchId: formData.get('batchId'),
      studentEmail: formData.get('studentEmail'),
    });

    const result = await instituteService.enrollStudent(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message, field: error.field } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to enroll student' } };
  }
}