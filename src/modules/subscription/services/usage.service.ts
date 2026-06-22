import { prisma } from '@/server/infrastructure/prisma/client';
import { TenantContext } from '@/server/shared/tenant-context';
import { UserContext } from '@/server/shared/user-context';

type UsageMetric = 'AI_TOKENS' | 'MOCK_TESTS' | 'PRACTICE_QUESTIONS';

export class UsageService {
  async recordUsage(metric: UsageMetric, count: number = 1): Promise<void> {
    const userId = UserContext.getUserId();
    const tenantId = TenantContext.getTenantId();
    if (!userId || !tenantId) return;

    const now = new Date();
    const period = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    // Hardcoded limits for demonstration. In production, these come from the Plan features JSON.
    const limits: Record<UsageMetric, number> = {
      AI_TOKENS: 500000,
      MOCK_TESTS: 10,
      PRACTICE_QUESTIONS: 500,
    };

    await prisma.usageRecord.upsert({
      where: {
        userId_metric_period: { userId, metric, period },
      },
      update: {
        count: { increment: count },
      },
      create: {
        userId,
        tenantId,
        metric,
        period,
        count,
        limit: limits[metric],
      },
    });
  }

  async getUsage(userId: string): Promise<Record<UsageMetric, { count: number; limit: number }>> {
    const now = new Date();
    const period = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    const records = await prisma.usageRecord.findMany({
      where: { userId, period },
    });

    const result: any = {
      AI_TOKENS: { count: 0, limit: 500000 },
      MOCK_TESTS: { count: 0, limit: 10 },
      PRACTICE_QUESTIONS: { count: 0, limit: 500 },
    };

    for (const record of records) {
      result[record.metric as UsageMetric] = { count: record.count, limit: record.limit };
    }

    return result;
  }

  async checkLimit(metric: UsageMetric): Promise<boolean> {
    const usage = await this.getUsage(UserContext.getUserId()!);
    return usage[metric].count < usage[metric].limit;
  }
}

export const usageService = new UsageService();