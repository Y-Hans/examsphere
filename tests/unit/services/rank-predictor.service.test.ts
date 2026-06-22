import { RankPredictorService } from '@/modules/analytics/services/rank-predictor.service';
import { prisma } from '../../../mocks/prisma';

describe('RankPredictorService', () => {
  let service: RankPredictorService;

  beforeEach(() => {
    service = new RankPredictorService();
    jest.clearAllMocks();
  });

  it('should return null ranks and a message if no test sessions exist', async () => {
    (prisma.testSession.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await service.predict('user-1', { examId: 'exam-1' });
    
    expect(result.predictedRank).toBeNull();
    expect(result.predictedPercentile).toBeNull();
    expect(result.message).toContain('Not enough data');
  });

  it('should predict 99.9 percentile and top rank for >= 95% score', async () => {
    (prisma.testSession.findFirst as jest.Mock).mockResolvedValue({
      totalScore: { toNumber: () => 285 },
      template: { totalMarks: { toNumber: () => 300 } },
    });
    (prisma.rankPrediction.create as jest.Mock).mockResolvedValue({});

    const result = await service.predict('user-1', { examId: 'exam-1' });
    
    expect(result.predictedPercentile).toBe(99.9);
    expect(result.predictedRank).toBeLessThanOrEqual(150);
  });

  it('should predict lower percentiles for scores < 40%', async () => {
    (prisma.testSession.findFirst as jest.Mock).mockResolvedValue({
      totalScore: { toNumber: () => 100 },
      template: { totalMarks: { toNumber: () => 300 } },
    });
    (prisma.rankPrediction.create as jest.Mock).mockResolvedValue({});

    const result = await service.predict('user-1', { examId: 'exam-1' });
    
    expect(result.predictedPercentile).toBeLessThan(60);
    expect(result.predictedRank).toBeGreaterThan(100000);
  });
});