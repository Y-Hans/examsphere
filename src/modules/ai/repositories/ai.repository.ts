import { prisma } from '@/server/infrastructure/prisma/client';
import { TenantAwareRepository } from '@/server/infrastructure/prisma/base-repository';

export class AiRepository extends TenantAwareRepository<any> {
  constructor() {
    super(prisma.aiConversation as any);
  }

  async createConversation(data: { userId: string, tenantId: string, type: string }) {
    return prisma.aiConversation.create({ data });
  }

  async getConversationWithMessages(conversationId: string) {
    return prisma.aiConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async addMessage(data: {
    conversationId: string;
    role: string;
    content: string;
    provider: string;
    tokensIn: number;
    tokensOut: number;
    costInr: number;
    latencyMs: number;
  }) {
    return prisma.aiMessage.create({ data });
  }

  async getUserConversations(userId: string, limit: number = 20) {
    return prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true },
        },
      },
    });
  }

  async getTotalCostForUser(userId: string, since: Date) {
    const result = await prisma.aiMessage.aggregate({
      where: {
        conversation: { userId },
        createdAt: { gte: since },
      },
      _sum: {
        costInr: true,
        tokensIn: true,
        tokensOut: true,
      },
    });
    return {
      totalCostInr: result._sum.costInr?.toNumber() || 0,
      totalTokensIn: result._sum.tokensIn || 0,
      totalTokensOut: result._sum.tokensOut || 0,
    };
  }
}

export const aiRepository = new AiRepository();