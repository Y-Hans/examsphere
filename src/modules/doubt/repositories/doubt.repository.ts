import { prisma } from '@/server/infrastructure/prisma/client';
import { TenantAwareRepository } from '@/server/infrastructure/prisma/base-repository';

export class DoubtRepository extends TenantAwareRepository<any> {
  constructor() {
    super(prisma.doubt as any);
  }

  async findForTenant(tenantId: string, status?: string) {
    return prisma.doubt.findMany({
      where: { tenantId, status: status || undefined },
      include: {
        user: { select: { email: true } },
        question: { include: { versions: { take: 1, orderBy: { versionNo: 'desc' } } } },
        responses: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(doubtId: string) {
    return prisma.doubt.findUnique({
      where: { id: doubtId },
      include: {
        user: { select: { email: true } },
        question: { include: { versions: { take: 1, orderBy: { versionNo: 'desc' } } } },
        responses: {
          include: { author: { select: { email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async addResponse(doubtId: string, authorId: string, body: string) {
    return prisma.$transaction(async (tx) => {
      const response = await tx.doubtResponse.create({
        data: { doubtId, authorId, body },
      });
      
      const doubt = await tx.doubt.update({
        where: { id: doubtId },
        data: { status: 'RESOLVED', updated_at: new Date() },
      });

      return { response, doubt };
    });
  }
}

export const doubtRepository = new DoubtRepository();