import { questionRepository } from '../repositories/question.repository';
import { CreateQuestionInput, UpdateQuestionInput, QuestionQueryInput, ReviewActionInput } from '../dto/question.dto';
import { TenantContext } from '@/server/shared/tenant-context';
import { UserContext } from '@/server/shared/user-context';
import { NotFoundError, ValidationError } from '@/server/shared/errors';
import { prisma } from '@/server/infrastructure/prisma/client';
import { writeAuditLog } from '@/server/shared/audit';

export class QuestionService {
  async createQuestion(input: CreateQuestionInput) {
    const tenantId = TenantContext.getTenantId();
    const userId = UserContext.getUserId();
    if (!tenantId || !userId) throw new Error('Context missing');

    const result = await questionRepository.createWithVersion({ ...input, tenantId }, userId);
    
    await writeAuditLog({
      action: 'CREATE_QUESTION',
      resourceType: 'question',
      resourceId: result.question.id,
      afterState: result,
    });

    return result;
  }

  async updateQuestion(input: UpdateQuestionInput) {
    const userId = UserContext.getUserId();
    if (!userId) throw new Error('Context missing');

    const existing = await prisma.question.findUnique({ where: { id: input.questionId } });
    if (!existing) throw new NotFoundError('Question', input.questionId);
    if (existing.status === 'PUBLISHED') {
      throw new ValidationError('Cannot edit a published question directly. Create a new version or archive it.');
    }

    const result = await questionRepository.updateWithVersion(input.questionId, input, userId);

    await writeAuditLog({
      action: 'UPDATE_QUESTION',
      resourceType: 'question',
      resourceId: input.questionId,
      afterState: result,
    });

    return result;
  }

  async getQuestion(id: string) {
    return questionRepository.findWithLatestVersion(id);
  }

  async listQuestions(input: QuestionQueryInput) {
    return questionRepository.listQuestions(input);
  }

  async submitForReview(questionId: string) {
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundError('Question', questionId);
    if (question.status !== 'DRAFT') throw new ValidationError('Only draft questions can be submitted for review');

    return prisma.question.update({
      where: { id: questionId },
      data: { status: 'IN_REVIEW' },
    });
  }

  async reviewAction(input: ReviewActionInput) {
    const reviewerId = UserContext.getUserId();
    if (!reviewerId) throw new Error('Context missing');

    const question = await prisma.question.findUnique({ where: { id: input.questionId } });
    if (!question) throw new NotFoundError('Question', input.questionId);
    if (question.status !== 'IN_REVIEW') throw new ValidationError('Question is not in review state');

    let newStatus = question.status;
    if (input.action === 'APPROVE') newStatus = 'PUBLISHED';
    if (input.action === 'REJECT') newStatus = 'ARCHIVED';
    if (input.action === 'REQUEST_CHANGES') newStatus = 'DRAFT';

    await prisma.questionReviewLog.create({
      data: {
        questionId: input.questionId,
        reviewerId,
        action: input.action,
        comment: input.comment,
      },
    });

    const updated = await prisma.question.update({
      where: { id: input.questionId },
      data: { status: newStatus },
    });

    await writeAuditLog({
      action: `REVIEW_${input.action}`,
      resourceType: 'question',
      resourceId: input.questionId,
      afterState: updated,
    });

    return updated;
  }
}

export const questionService = new QuestionService();