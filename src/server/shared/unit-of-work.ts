import { Prisma } from '@prisma/client';
import { prisma } from '@/server/infrastructure/prisma/client';

export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn, {
    maxWait: 10000,
    timeout: 30000,
  });
}
