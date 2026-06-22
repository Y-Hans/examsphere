'use server';

import { auth } from '@/lib/auth';
import { UserContext } from '@/server/shared/user-context';
import { TenantContext } from '@/server/shared/tenant-context';
import { permissionService } from '@/modules/rbac/services/permission.service';
import { aiService } from '../services/ai.service';
import {
  sendMessageSchema,
  generateStudyPlanSchema,
  generateTestSchema,
} from '../dto/ai.dto';
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

export async function startTutorConversationAction(formData: FormData) {
  try {
    await getContext();
    permissionService.assert('ai', 'create');

    const questionId = formData.get('questionId') as string | null;
    const query = formData.get('query') as string | null;

    const context: Record<string, any> = {};
    if (questionId) context.questionId = questionId;
    if (query) context.query = query;

    const result = await aiService.startTutorConversation(context);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to start AI conversation' } };
  }
}

export async function sendTutorMessageAction(formData: FormData) {
  try {
    await getContext();
    permissionService.assert('ai', 'create');

    const input = sendMessageSchema.parse({
      conversationId: formData.get('conversationId'),
      message: formData.get('message'),
    });

    const result = await aiService.sendTutorMessage(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to send message' } };
  }
}

export async function generateStudyPlanAction(formData: FormData) {
  try {
    await getContext();
    permissionService.assert('ai', 'create');

    const input = generateStudyPlanSchema.parse({
      examId: formData.get('examId'),
      weeksUntilExam: parseInt(formData.get('weeksUntilExam') as string),
      hoursPerDay: parseFloat(formData.get('hoursPerDay') as string),
      weakTopicIds: formData.get('weakTopicIds')
        ? JSON.parse(formData.get('weakTopicIds') as string)
        : undefined,
    });

    const result = await aiService.generateStudyPlan(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate study plan' } };
  }
}

export async function generateAiTestAction(formData: FormData) {
  try {
    await getContext();
    permissionService.assert('ai', 'create');

    const input = generateTestSchema.parse({
      examId: formData.get('examId'),
      subjectId: formData.get('subjectId') || undefined,
      topicIds: JSON.parse(formData.get('topicIds') as string),
      difficulty: formData.get('difficulty'),
      questionCount: parseInt(formData.get('questionCount') as string),
    });

    const result = await aiService.generateTest(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate AI test' } };
  }
}

export async function getAiUsageAction() {
  try {
    await getContext();
    permissionService.assert('ai', 'read');

    const result = await aiService.getUsageStats();
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch usage' } };
  }
}