'use server';

import { auth } from '@/lib/auth';
import { UserContext } from '@/server/shared/user-context';
import { TenantContext } from '@/server/shared/tenant-context';
import { subscriptionService } from '../services/subscription.service';
import { usageService } from '../services/usage.service';
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
    () => TenantContext.run(
      { tenantId: session.user.tenantId, subdomain: session.user.tenantSubdomain },
      async () => true
    )
  );
}

export async function getPlansAction() {
  try {
    await getContext();
    const result = await subscriptionService.getPlans();
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch plans' } };
  }
}

export async function getCurrentSubscriptionAction() {
  try {
    await getContext();
    const result = await subscriptionService.getCurrentSubscription();
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch subscription' } };
  }
}

export async function getUsageAction() {
  try {
    await getContext();
    const userId = UserContext.getUserId();
    if (!userId) throw new Error('No user');
    const result = await usageService.getUsage(userId);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch usage' } };
  }
}

export async function upgradePlanAction(formData: FormData) {
  try {
    await getContext();
    const planId = formData.get('planId') as string;
    const result = await subscriptionService.upgradePlan(planId);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to upgrade plan' } };
  }
}