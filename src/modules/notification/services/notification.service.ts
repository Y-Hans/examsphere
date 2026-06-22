import { notificationRepository } from '../repositories/notification.repository';
import { emailProvider } from '@/server/infrastructure/email/resend-adapter';
import { prisma } from '@/server/infrastructure/prisma/client';
import { logger } from '@/server/shared/logger';

const log = logger.child({ module: 'NotificationService' });

export class NotificationService {
  async sendNotification(params: {
    userId: string;
    tenantId: string;
    type: string;
    title: string;
    body?: string;
    payload?: any;
    emailSubject?: string;
    emailHtml?: string;
  }) {
    const { userId, tenantId, type, title, body, payload, emailSubject, emailHtml } = params;

    // 1. Check In-App Preference (default to true)
    const inAppPref = await notificationRepository.getPreference(userId, 'IN_APP', type);
    if (inAppPref?.enabled !== false) {
      await notificationRepository.create({
        userId,
        tenantId,
        type,
        title,
        body,
        payload,
        channel: 'IN_APP',
      });
    }

    // 2. Check Email Preference & Send Email
    const emailPref = await notificationRepository.getPreference(userId, 'EMAIL', type);
    if (emailPref?.enabled !== false && emailSubject && emailHtml) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (user) {
        try {
          await emailProvider.send({
            to: user.email,
            subject: emailSubject,
            html: emailHtml,
          });
        } catch (error) {
          log.error({ error, userId, type }, 'Failed to send email notification');
          // Don't fail the whole process if email fails, in-app is already saved
        }
      }
    }
  }

  async getUnreadNotifications(userId: string, tenantId: string) {
    return notificationRepository.findUnreadForUser(userId, tenantId);
  }

  async markAsRead(notificationId: string) {
    return notificationRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string, tenantId: string) {
    return notificationRepository.markAllAsRead(userId, tenantId);
  }
}

export const notificationService = new NotificationService();