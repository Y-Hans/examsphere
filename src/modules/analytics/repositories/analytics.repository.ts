import { prisma } from '@/server/infrastructure/prisma/client';
import { TenantAwareRepository } from '@/server/infrastructure/prisma/base-repository';

export class AnalyticsRepository extends TenantAwareRepository<any> {
  constructor() {
    super(prisma.analyticsSnapshot as any);
  }

  async getOverallStats(userId: string) {
    const [testResponses, practiceResponses] = await Promise.all([
      prisma.testResponse.findMany({
        where: { session: { userId } },
        select: { isCorrect: true, timeSpentSec: true, sessionId: true },
      }),
      prisma.practiceResponse.findMany({
        where: { session: { userId } },
        select: { isCorrect: true, timeSpentSec: true, sessionId: true },
      }),
    ]);

    const totalAttempted = testResponses.length + practiceResponses.length;
    const totalCorrect = testResponses.filter(r => r.isCorrect).length + practiceResponses.filter(r => r.isCorrect).length;
    const totalTime = testResponses.reduce((sum, r) => sum + r.timeSpentSec, 0) + practiceResponses.reduce((sum, r) => sum + r.timeSpentSec, 0);

    return {
      totalAttempted,
      totalCorrect,
      accuracy: totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0,
      avgTimePerQuestion: totalAttempted > 0 ? totalTime / totalAttempted : 0,
    };
  }

  async getSubjectPerformance(userId: string, examId?: string) {
    const responses = await prisma.testResponse.findMany({
      where: { 
        session: { userId },
        question: { examId }
      },
      include: {
        question: {
          select: { subject: { select: { name: true } } }
        }
      },
    });

    const subjectMap: Record<string, { correct: number, total: number }> = {};

    for (const r of responses) {
      const subjectName = r.question.subject.name;
      if (!subjectMap[subjectName]) subjectMap[subjectName] = { correct: 0, total: 0 };
      subjectMap[subjectName].total++;
      if (r.isCorrect) subjectMap[subjectName].correct++;
    }

    return Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
      totalAttempted: data.total,
    }));
  }

  async getRecentTests(userId: string, limit: number = 5) {
    return prisma.testSession.findMany({
      where: { userId, status: 'SUBMITTED' },
      include: {
        template: {
          select: { name: true, totalMarks: true }
        }
      },
      orderBy: { submittedAt: 'desc' },
      take: limit,
    });
  }
}

export const analyticsRepository = new AnalyticsRepository();