import pino from 'pino';
import { env } from '@/lib/env';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: {
    service: 'examsphere-api',
    env: env.NODE_ENV,
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.passwordHash', '*.token'],
    censor: '[REDACTED]',
  },
  transport: env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

export function getLogger(module: string) {
  return logger.child({ module });
}