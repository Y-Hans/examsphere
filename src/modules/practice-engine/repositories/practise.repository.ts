import { prisma } from '@/server/infrastructure/prisma/client';
import { TenantAwareRepository } from '@/server/infrastructure/prisma/base-repository';
import { StartPracticeInput } from '../dto/practice.dto';
import { TenantContext } from '@/server/shared/tenant-context';
import { UserContext } from '@/server/shared/user-context';

export class PracticeRepository extends TenantAwareRepository<any> {
  constructor() {
    super(prisma.practiceSession as any);
  }

  async createSession(data: StartPracticeInput & { tenantId: string, userId: string }) {
    return prisma.practiceSession.create({
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        type: data.type,
        targetTopicId: data.type === 'TOPIC' || data.type === 'WEAK_TOPIC' ? data.targetId : null,
      },
    });
  }

  async fetchQuestionsForPractice(data: StartPracticeInput & { tenantId: string, userId: string }) {
    const tenantId = data.tenantId;
    
    // Base where clause for published questions in tenant
    const where: any = {
      tenantId,
      status: 'PUBLISHED',
    };

    if (data.type === 'SUBJECT' && data.targetId) {
      where.subjectId = data.targetId;
    } else if (data.type === 'TOPIC' && data.targetId) {
      where.topics = { some: { topicId: data.targetId } };
    } else if (data.type === 'PYQ') {
      where.sourceType = 'PYQ';
      if (data.examId) where.examId = data.examId;
    } else if (data.type === 'WEAK_TOPIC') {
      // Fetch user's weak topics
      const weakTopics = await prisma.weakTopic.findMany({
        where: { userId: data.userId, tenantId },
        select: { topicId: true },
        take: 3, // Focus on top 3 weak topics
      });
      const topicIds = weakTopics.map(wt => wt.topicId);
      if (topicIds.length === 0) return [];
      where.topics = { some: { topicId: { in: topicIds } } };
    }

    // Fetch random questions
    // Note: Prisma doesn't have native ORDER BY RAND() for Oracle easily.
    // We fetch a larger set and slice, or use raw query for true random.
    // For production, a raw query is better. Here we use Prisma's findMany with a skip logic for simulation.
    const questions = await prisma.question.findMany({
      where,
      include: {
        versions: {
          orderBy: { versionNo: 'desc' },
          take: 1,
        },
        topics: true,
      },
      take: data.limit * 2, // Fetch extra to simulate randomness
    });

    // Shuffle and take limit
    return questions.sort(() => 0.5 - Math.random()).slice(0, data.limit);
  }

  async saveResponse(data: any) {
    return prisma.practiceResponse.create({
      data: {
        sessionId: data.sessionId,
        questionId: data.questionId,
        responseValue: data.responseValue || null,
        isCorrect: data.isCorrect,
        timeSpentSec: data.timeSpentSec,
        hintUsed: data.hintUsed,
        explanationViewed: false, // default false, updated when user views it
      },
    });
  }

  async getSessionProgress(sessionId: string) {
    const responses = await prisma.practiceResponse.findMany({
      where: { sessionId },
      include: {
        question: {
          include: {
            versions: { orderBy: { versionNo: 'desc' }, take: 1 }
          }
        }
      }
    });
    
    const answeredCount = responses.length;
    const correctCount = responses.filter(r => r.isCorrect).length;
    
    return {
      answered: answeredCount,
      correct: correctCount,
      accuracy: answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0,
      responses,
    };
  }
}

export const practiceRepository = new PracticeRepository();