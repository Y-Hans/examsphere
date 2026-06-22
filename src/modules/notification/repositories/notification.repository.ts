import { prisma } from '@/server/infrastructure/prisma/client';
import { TenantAwareRepository } from '@/server/infrastructure/prisma/base-repository';

export class NotificationRepository extends TenantAwareRepository<any> {
  constructor() {
    super(prisma.notification as any);
  }

  async findUnreadForUser(userId: string, tenantId: string) {
    return prisma.notification.findMany({
      where: { userId, tenantId, status: 'UNREAD' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string, tenantId: string) {
    return prisma.notification.updateMany({
      where: { userId, tenantId, status: 'UNREAD' },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  async create(data: {
    userId: string;
    tenantId: string;
    type: string;
    title: string;
    body?: string;
    payload?: any;
    channel: string;
  }) {
    return prisma.notification.create({ data });
  }

  async getPreference(userId: string, channel: string, type: string) {
    return prisma.notificationPreference.findUnique({
      where: {
        userId_channel_type: { userId, channel, type },
      },
    });
  }
}

export const notificationRepository = new NotificationRepository();