'use server';

import { auth } from '@/lib/auth';
import { UserContext } from '@/server/shared/user-context';
import { TenantContext } from '@/server/shared/tenant-context';
import { notificationService } from '../services/notification.service';
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

export async function getUnreadNotificationsAction() {
  try {
    await getContext();
    const userId = UserContext.getUserId();
    const tenantId = TenantContext.getTenantId();
    if (!userId || !tenantId) throw new Error('Context missing');
    
    const result = await notificationService.getUnreadNotifications(userId, tenantId);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch notifications' } };
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    await getContext();
    const result = await notificationService.markAsRead(notificationId);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to mark notification as read' } };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    await getContext();
    const userId = UserContext.getUserId();
    const tenantId = TenantContext.getTenantId();
    if (!userId || !tenantId) throw new Error('Context missing');
    
    const result = await notificationService.markAllAsRead(userId, tenantId);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: { code: error.code, message: error.message } };
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to mark all notifications as read' } };
  }
}