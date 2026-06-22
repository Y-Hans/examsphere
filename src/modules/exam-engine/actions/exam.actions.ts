'use server';

import { auth } from '@/lib/auth';
import { UserContext } from '@/server/shared/user-context';
import { TenantContext } from '@/server/shared/tenant-context';
import { permissionService } from '@/modules/rbac/services/permission.service';
import { examService } from '../services/exam.service';
import { createTestTemplateSchema, saveResponseSchema, submitTestSchema } from '../dto/exam.dto';
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

export async function createTestTemplateAction(formData: FormData) {
  try {
    await getContext();
    permissionService.assert('test_template', 'create');

    // Parse JSON strings from FormData for complex nested objects
    const sections = JSON.parse(formData.get('sections') as string);

    const input = createTestTemplateSchema.parse({
      name: formData.get('name'),
      type: formData.get('type'),
      examId: formData.get('examId'),
      durationMin: parseInt(formData.get('durationMin') as string),
      totalMarks: parseFloat(formData.get('totalMarks') as string),
      scheduledStart: formData.get('scheduledStart') || undefined,
      scheduledEnd: formData.get('scheduledEnd') || undefined,
      sections,
    });

    const result = await examService.createTestTemplate(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message, field: error.field } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create test template' } };
  }
}

export async function startTestAction(templateId: string) {
  try {
    await getContext();
    permissionService.assert('test_session', 'create');

    const result = await examService.startTestSession(templateId);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to start test' } };
  }
}

export async function saveResponseAction(formData: FormData) {
  try {
    await getContext();
    permissionService.assert('test_session', 'update');

    const input = saveResponseSchema.parse({
      sessionId: formData.get('sessionId'),
      questionId: formData.get('questionId'),
      sectionId: formData.get('sectionId'),
      responseValue: formData.get('responseValue') || undefined,
      status: formData.get('status'),
      timeSpentSec: parseInt(formData.get('timeSpentSec') as string) || 0,
    });

    const result = await examService.saveResponse(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to save response' } };
  }
}

export async function submitTestAction(sessionId: string) {
  try {
    await getContext();
    permissionService.assert('test_session', 'update');

    const input = submitTestSchema.parse({ sessionId });
    const result = await examService.submitTest(input.sessionId);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit test' } };
  }
}
