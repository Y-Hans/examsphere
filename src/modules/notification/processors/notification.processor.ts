import { eventBus } from '@/server/shared/event-bus';
import { notificationService } from '../services/notification.service';
import { logger } from '@/server/shared/logger';
import { prisma } from '@/server/infrastructure/prisma/client';

const log = logger.child({ module: 'NotificationProcessor' });