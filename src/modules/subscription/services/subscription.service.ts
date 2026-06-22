import { prisma } from '@/server/infrastructure/prisma/client';
import { TenantContext } from '@/server/shared/tenant-context';
import { UserContext } from '@/server/shared/user-context';
import { NotFoundError } from '@/server/shared/errors';

export class SubscriptionService {
  async getPlans() {
    return prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceInr: 'asc' },
    });
  }

  async getCurrentSubscription() {
    const userId = UserContext.getUserId();
    if (!userId) throw new Error('Context missing');

    return prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { startedAt: 'desc' },
    });
  }

  async upgradePlan(planId: string) {
    const userId = UserContext.getUserId();
    const tenantId = TenantContext.getTenantId();
    if (!userId || !tenantId) throw new Error('Context missing');

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundError('Plan', planId);

    // Expire current subscriptions
    await prisma.subscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'EXPIRED', cancelledAt: new Date() },
    });

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        tenantId,
        planId,
        status: 'ACTIVE',
        startedAt: new Date(),
        endsAt: plan.billingCycle === 'YEARLY' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
      },
      include: { plan: true },
    });

    // Activate feature flags based on plan
    if (plan.code === 'PREMIUM' || plan.code === 'PREMIUM_PLUS') {
      await prisma.featureFlag.upsert({
        where: { key: 'AI_TUTOR_ACCESS' },
        update: {},
        create: { key: 'AI_TUTOR_ACCESS', defaultEnabled: true },
      });
    }

    return subscription;
  }
}

export const subscriptionService = new SubscriptionService();