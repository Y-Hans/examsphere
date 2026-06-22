'use server';

import { auth } from '@/lib/auth';
import { UserContext } from '@/server/shared/user-context';
import { TenantContext } from '@/server/shared/tenant-context';
import { permissionService } from '@/modules/rbac/services/permission.service';
import { practiceService } from '../services/practice.service';
import { startPracticeSchema, submitPracticeResponseSchema } from '../dto/practice.dto';
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

export async function startPracticeAction(formData: FormData) {
  try {
    await getContext();
    permissionService.assert('practice_session', 'create');

    const input = startPracticeSchema.parse({
      type: formData.get('type'),
      targetId: formData.get('targetId') || undefined,
      examId: formData.get('examId') || undefined,
      limit: parseInt(formData.get('limit') as string) || 10,
    });

    const result = await practiceService.startSession(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to start practice session' } };
  }
}

export async function submitPracticeResponseAction(formData: FormData) {
  try {
    await getContext();
    permissionService.assert('practice_session', 'update');

    const input = submitPracticeResponseSchema.parse({
      sessionId: formData.get('sessionId'),
      questionId: formData.get('questionId'),
      responseValue: formData.get('responseValue') || undefined,
      timeSpentSec: parseInt(formData.get('timeSpentSec') as string),
      hintUsed: formData.get('hintUsed') === 'true',
    });

    const result = await practiceService.submitResponse(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit response' } };
  }
}

export async function getPracticeProgressAction(sessionId: string) {
  try {
    await getContext();
    permissionService.assert('practice_session', 'read');

    const result = await practiceService.getProgress(sessionId);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch progress' } };
  }
}