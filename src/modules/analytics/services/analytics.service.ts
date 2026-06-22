import { analyticsRepository } from '../repositories/analytics.repository';
import { rankPredictorService } from './rank-predictor.service';
import { GetDashboardQuery, GetRankPredictionInput } from '../dto/analytics.dto';
import { UserContext } from '@/server/shared/user-context';
import { TenantContext } from '@/server/shared/tenant-context';
import { prisma } from '@/server/infrastructure/prisma/client';
import { logger } from '@/server/shared/logger';

export class AnalyticsService {
  async getDashboardData(query: GetDashboardQuery) {
    const userId = UserContext.getUserId();
    if (!userId) throw new Error('User context missing');

    const [overallStats, subjectPerformance, recentTests, weakTopics] = await Promise.all([
      analyticsRepository.getOverallStats(userId),
      analyticsRepository.getSubjectPerformance(userId, query.examId),
      analyticsRepository.getRecentTests(userId),
      prisma.weakTopic.findMany({
        where: { userId },
        take: 5,
        orderBy: { weaknessScore: 'desc' },
        include: { topic: { select: { name: true } } }
      })
    ]);

    return {
      overall: overallStats,
      subjects: subjectPerformance,
      recentTests,
      weakTopics: weakTopics.map(wt => ({ id: wt.id, topic: wt.topic.name, score: wt.weaknessScore })),
    };
  }

  async getRankPrediction(input: GetRankPredictionInput) {
    const userId = UserContext.getUserId();
    if (!userId) throw new Error('User context missing');
    return rankPredictorService.predict(userId, input);
  }

  /**
   * Called by event bus listeners to update weak topics
   */
  async updateWeakTopics(payload: { userId: string, tenantId: string, topicIds: string[], isCorrect: boolean, timeSpentSec: number }) {
    const { userId, tenantId, topicIds, isCorrect, timeSpentSec } = payload;
    const log = logger.child({ module: 'AnalyticsService' });

    for (const topicId of topicIds) {
      try {
        // Simple algorithm: +10 for wrong, +5 for slow correct (>60s), -5 for fast correct (<30s)
        let scoreDelta = 0;
        if (!isCorrect) scoreDelta += 10;
        if (isCorrect && timeSpentSec > 60) scoreDelta += 5;
        if (isCorrect && timeSpentSec < 30) scoreDelta -= 5;

        if (scoreDelta === 0) continue;

        const existing = await prisma.weakTopic.findFirst({
          where: { userId, topicId }
        });

        if (existing) {
          const newScore = Math.max(0, Math.min(100, existing.weaknessScore.toNumber() + scoreDelta));
          await prisma.weakTopic.update({
            where: { id: existing.id },
            data: { weaknessScore: newScore, lastAssessedAt: new Date() }
          });
        } else {
          // Only create if it was a wrong answer or slow correct
          if (scoreDelta > 0) {
            await prisma.weakTopic.create({
              data: {
                userId,
                tenantId,
                topicId,
                weaknessScore: Math.min(100, scoreDelta),
                lastAssessedAt: new Date(),
              }
            });
          }
        }
      } catch (error) {
        log.error({ error, topicId }, 'Failed to update weak topic');
      }
    }
  }
}

export const analyticsService = new AnalyticsService();