import { practiceRepository } from '../repositories/practise.repository';
import { StartPracticeInput, SubmitPracticeResponseInput } from '../dto/practice.dto';
import { TenantContext } from '@/server/shared/tenant-context';
import { UserContext } from '@/server/shared/user-context';
import { NotFoundError, ValidationError } from '@/server/shared/errors';
import { prisma } from '@/server/infrastructure/prisma/client';
import { eventBus } from '@/server/shared/event-bus';

export class PracticeService {
  async startSession(input: StartPracticeInput) {
    const tenantId = TenantContext.getTenantId();
    const userId = UserContext.getUserId();
    if (!tenantId || !userId) throw new Error('Context missing');

    const session = await practiceRepository.createSession({ ...input, tenantId, userId });
    const questions = await practiceRepository.fetchQuestionsForPractice({ ...input, tenantId, userId });

    if (questions.length === 0) {
      throw new NotFoundError('No questions found for the selected criteria.');
    }

    return { session, questions };
  }

  async submitResponse(input: SubmitPracticeResponseInput) {
    const userId = UserContext.getUserId();
    const tenantId = TenantContext.getTenantId();
    if (!userId || !tenantId) throw new Error('Context missing');

    const session = await prisma.practiceSession.findUnique({
      where: { id: input.sessionId },
    });

    if (!session) throw new NotFoundError('PracticeSession', input.sessionId);
    if (session.userId !== userId) throw new ValidationError('Unauthorized access to practice session');

    const question = await prisma.question.findUnique({
      where: { id: input.questionId },
      include: {
        versions: {
          orderBy: { versionNo: 'desc' },
          take: 1,
        },
      },
    });

    if (!question || !question.versions[0]) throw new NotFoundError('Question', input.questionId);

    const latestVersion = question.versions[0];
    const correctOptions = latestVersion.correctOptions.split(',').sort().join(',').trim();
    const userResponse = (input.responseValue || '').split(',').sort().join(',').trim();

    const isCorrect = userResponse === correctOptions && userResponse !== '';

    const response = await practiceRepository.saveResponse({
      ...input,
      isCorrect,
    });

    // Emit event for analytics to update weak topics
    await eventBus.emitAndPersist({
      type: 'PracticeResponseSubmitted',
      tenantId,
      payload: {
        userId,
        sessionId: input.sessionId,
        questionId: input.questionId,
        topicIds: (await prisma.questionTopic.findMany({ where: { questionId: input.questionId }, select: { topicId: true } })).map(t => t.topicId),
        isCorrect,
        timeSpentSec: input.timeSpentSec,
      },
    });

    // Return instant feedback
    return {
      response,
      feedback: {
        isCorrect,
        correctOptions: latestVersion.correctOptions,
        solution: latestVersion.solution,
        hintLevel1: latestVersion.hintLevel1,
        hintLevel2: latestVersion.hintLevel2,
        hintLevel3: latestVersion.hintLevel3,
      },
    };
  }

  async getProgress(sessionId: string) {
    const userId = UserContext.getUserId();
    if (!userId) throw new Error('Context missing');

    const session = await prisma.practiceSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundError('PracticeSession', sessionId);
    if (session.userId !== userId) throw new ValidationError('Unauthorized');

    return practiceRepository.getSessionProgress(sessionId);
  }
}

export const practiceService = new PracticeService();