import { prisma } from '@/server/infrastructure/prisma/client';
import { GetRankPredictionInput } from '../dto/analytics.dto';
import { NotFoundError } from '@/server/shared/errors';

export class RankPredictorService {
  async predict(userId: string, input: GetRankPredictionInput) {
    // Fetch the user's best mock test score for the given exam
    const bestSession = await prisma.testSession.findFirst({
      where: { 
        userId, 
        status: 'SUBMITTED',
        template: { examId: input.examId }
      },
      orderBy: { totalScore: 'desc' },
      include: { template: { select: { totalMarks: true } } }
    });

    if (!bestSession || !bestSession.totalScore) {
      return { predictedRank: null, predictedPercentile: null, message: 'Not enough data. Take a mock test first.' };
    }

    const score = bestSession.totalScore.toNumber();
    const maxMarks = bestSession.template.totalMarks.toNumber();
    const percentage = (score / maxMarks) * 100;

    // Simplified linear regression model for JEE/NEET estimation
    // In a real app, this would use historical data arrays and proper ML models.
    let percentile = 0;
    let rank = 0;

    if (percentage >= 95) {
      percentile = 99.9;
      rank = Math.round(100 + (100 - percentage) * 100);
    } else if (percentage >= 80) {
      percentile = 95 + (percentage - 80) * 0.8;
      rank = Math.round(5000 + (95 - percentage) * 1000);
    } else if (percentage >= 60) {
      percentile = 85 + (percentage - 60) * 0.5;
      rank = Math.round(25000 + (80 - percentage) * 1500);
    } else if (percentage >= 40) {
      percentile = 60 + (percentage - 40) * 1.25;
      rank = Math.round(80000 + (60 - percentage) * 2000);
    } else {
      percentile = percentage * 1.5;
      rank = Math.round(150000 + (40 - percentage) * 3000);
    }

    // Persist prediction
    await prisma.rankPrediction.create({
      data: {
        userId,
        examId: input.examId,
        predictedRank: rank,
        predictedPercentile: percentile,
        modelVersion: 'v1-linear-est',
      },
    });

    return { 
      predictedRank: rank, 
      predictedPercentile: Number(percentile.toFixed(2)), 
      message: 'Prediction generated successfully.' 
    };
  }
}

export const rankPredictorService = new RankPredictorService();