import { eventBus } from '@/server/shared/event-bus';
import { analyticsService } from '../services/analytics.service';
import { logger } from '@/server/shared/logger';

const log = logger.child({ module: 'AnalyticsProcessor' });

export function initAnalyticsProcessor() {
  eventBus.on('PracticeResponseSubmitted', async (event) => {
    log.debug({ eventId: event.payload.sessionId }, 'Processing PracticeResponseSubmitted for weak topics');
    try {
      await analyticsService.updateWeakTopics(event.payload);
    } catch (error) {
      log.error({ error }, 'Failed to process PracticeResponseSubmitted');
    }
  });

  // In a real app with Exam Engine fully wired to emit topic-level data,
  // we'd also listen to 'TestSessionSubmitted'. 
  // For now, PracticeResponseSubmitted covers the core adaptive loop.
  log.info('Analytics processor initialized.');
}