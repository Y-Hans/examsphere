import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './extensions/soft-delete';
import { tenantScopingExtension } from './extensions/tenant-scoping';
import { env } from '@/lib/env';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
    .$extends(softDeleteExtension)
    .$extends(tenantScopingExtension);

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;