import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

export interface RequestContextData {
  requestId: string;
  correlationId: string;
}

const requestStorage = new AsyncLocalStorage<RequestContextData>();

export const RequestContext = {
  run<T>(callback: () => T): T {
    const requestId = randomUUID();
    const correlationId = requestId; // In a real system, inherit from incoming header
    return requestStorage.run({ requestId, correlationId }, callback);
  },

  get(): RequestContextData | undefined {
    return requestStorage.getStore();
  },

  getRequestId(): string | undefined {
    return requestStorage.getStore()?.requestId;
  },

  getCorrelationId(): string | undefined {
    return requestStorage.getStore()?.correlationId;
  },
};
