import { EventEmitter } from 'events';
import { prisma } from '@/server/infrastructure/prisma/client';
import { logger } from './logger';

export interface DomainEvent {
  type: string;
  tenantId?: string;
  payload: any;
}

class EventBus extends EventEmitter {
  async emitAndPersist(event: DomainEvent): Promise<void> {
    const log = logger.child({ module: 'EventBus' });
    
    try {
      // Persist to domain_events table
      await prisma.domainEvent.create({
        data: {
          type: event.type,
          tenantId: event.tenantId,
          payload: event.payload,
        },
      });

      // Emit to in-process listeners
      this.emit(event.type, event);
      this.emit('*', event);
      
      log.debug({ eventType: event.type }, 'Domain event emitted and persisted');
    } catch (error) {
      log.error({ error, event }, 'Failed to emit/persist domain event');
      // Depending on the severity, we might want to throw here
      // to rollback the transaction that spawned this event.
      throw error;
    }
  }
}

export const eventBus = new EventBus();

// Allow max listeners for multiple module subscriptions
eventBus.setMaxListeners(50);