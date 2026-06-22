import { prisma } from '@/server/infrastructure/prisma/client';
import { TenantQueryInput } from '../dto/super-admin.dto';
import { getPaginationParams } from '@/server/shared/pagination';

export class SuperAdminRepository {
  async getPlatformStats() {
    const [tenants, users, questions, testSessions] = await Promise.all([
      prisma.tenant.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.question.count({ where: { deletedAt: null } }),
      prisma.testSession.count({ where: { deletedAt: null } }),
    ]);

    // Aggregate AI costs
    const aiCosts = await prisma.aiMessage.aggregate({
      _sum: { costInr: true },
    });

    return {
      tenants,
      users,
      questions,
      testSessions,
      totalAiCostInr: aiCosts._sum.costInr?.toNumber() || 0,
    };
  }

  async getTenantGrowth() {
    const tenants = await prisma.tenant.findMany({
      where: { deletedAt: null },
      select: { createdAt: true, type: true },
      orderBy: { createdAt: 'asc' },
    });

    const monthlyGrowth: Record<string, { INDIVIDUAL: number, INSTITUTE: number, SCHOOL: number, ENTERPRISE: number }> = {};
    
    for (const t of tenants) {
      const monthYear = `${t.createdAt.getFullYear()}-${(t.createdAt.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthlyGrowth[monthYear]) {
        monthlyGrowth[monthYear] = { INDIVIDUAL: 0, INSTITUTE: 0, SCHOOL: 0, ENTERPRISE: 0 };
      }
      monthlyGrowth[monthYear][t.type]++;
    }

    return Object.entries(monthlyGrowth).map(([month, counts]) => ({
      month,
      ...counts,
    }));
  }

  async findAllTenants(query: TenantQueryInput) {
    const { skip, take, page, pageSize } = getPaginationParams(query);
    
    const where = {
      type: query.type,
      OR: query.search ? [
        { name: { contains: query.search, insensitive: true } },
        { subdomain: { contains: query.search, insensitive: true } },
      ] : undefined,
    };

    const [data, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tenant.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async updateTenantStatus(tenantId: string, status: string) {
    return prisma.tenant.update({
      where: { id: tenantId },
      data: { status },
    });
  }
}

export const superAdminRepository = new SuperAdminRepository();