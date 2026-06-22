'use server';

import { auth } from '@/lib/auth';
import { UserContext } from '@/server/shared/user-context';
import { TenantContext } from '@/server/shared/tenant-context';
import { permissionService } from '@/modules/rbac/services/permission.service';
import { questionService } from '../services/question.service';
import { syllabusService } from '../services/syllabus.service';
import { createQuestionSchema, updateQuestionSchema, reviewActionSchema, questionQuerySchema, createSyllabusNodeSchema } from '../dto/question.dto';
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
    () => {
      return TenantContext.run(
        { tenantId: session.user.tenantId, subdomain: session.user.tenantSubdomain },
        async () => true
      );
    }
  );
}

export async function createQuestionAction(formData: FormData) {
  try {
    await getContext();
    permissionService.assert('question', 'create');

    const input = createQuestionSchema.parse({
      type: formData.get('type'),
      difficulty: formData.get('difficulty'),
      sourceType: formData.get('sourceType'),
      examId: formData.get('examId'),
      subjectId: formData.get('subjectId'),
      topicIds: JSON.parse(formData.get('topicIds') as string),
      tagIds: formData.get('tagIds') ? JSON.parse(formData.get('tagIds') as string) : [],
      statement: formData.get('statement'),
      optionA: formData.get('optionA') || undefined,
      optionB: formData.get('optionB') || undefined,
      optionC: formData.get('optionC') || undefined,
      optionD: formData.get('optionD') || undefined,
      correctOptions: formData.get('correctOptions'),
      solution: formData.get('solution') || undefined,
      hintLevel1: formData.get('hintLevel1') || undefined,
      hintLevel2: formData.get('hintLevel2') || undefined,
      hintLevel3: formData.get('hintLevel3') || undefined,
      marksCorrect: parseFloat(formData.get('marksCorrect') as string),
      marksWrong: parseFloat(formData.get('marksWrong') as string) || 0,
      estTimeSec: parseInt(formData.get('estTimeSec') as string) || undefined,
      pyqYear: parseInt(formData.get('pyqYear') as string) || undefined,
      pyqExamSession: formData.get('pyqExamSession') || undefined,
      pyqShift: formData.get('pyqShift') || undefined,
    });

    const result = await questionService.createQuestion(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message, field: error.field } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create question' } };
  }
}

export async function submitForReviewAction(questionId: string) {
  try {
    await getContext();
    permissionService.assert('question', 'update');
    
    const result = await questionService.submitForReview(questionId);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit for review' } };
  }
}

export async function reviewQuestionAction(formData: FormData) {
  try {
    await getContext();
    permissionService.assert('question', 'manage'); // Only managers/admins can review

    const input = reviewActionSchema.parse({
      questionId: formData.get('questionId'),
      action: formData.get('action'),
      comment: formData.get('comment'),
    });

    const result = await questionService.reviewAction(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to review question' } };
  }
}

export async function createSyllabusNodeAction(formData: FormData) {
  try {
    await getContext();
    permissionService.assert('question', 'manage');

    const input = createSyllabusNodeSchema.parse({
      name: formData.get('name'),
      parentId: formData.get('parentId'),
      level: formData.get('level'),
    });

    const result = await syllabusService.createNode(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create syllabus node' } };
  }
}

export async function getQuestionsAction(query: any) {
  try {
    await getContext();
    permissionService.assert('question', 'read');

    const input = questionQuerySchema.parse(query);
    const result = await questionService.listQuestions(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch questions' } };
  }
}