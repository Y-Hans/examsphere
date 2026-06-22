import { aiTutorService } from './ai-tutor.service';
import { aiPlannerService } from './ai-planner.service';
import { aiTestGeneratorService } from './ai-test-generator.service';
import { aiRepository } from '../repositories/ai.repository';
import { SendMessageInput, GenerateStudyPlanInput, GenerateTestInput } from '../dto/ai.dto';
import { UserContext } from '@/server/shared/user-context';
import { providerRegistry } from '@/server/infrastructure/ai/provider-registry';
import { AppError } from '@/server/shared/errors';

export class AiService {
  async startTutorConversation(context?: Record<string, any>) {
    this.assertAiAvailable();
    return aiTutorService.startConversation(context);
  }

  async sendTutorMessage(input: SendMessageInput) {
    this.assertAiAvailable();
    return aiTutorService.sendMessage(input.conversationId, input.message);
  }

  async generateStudyPlan(input: GenerateStudyPlanInput) {
    this.assertAiAvailable();
    return aiPlannerService.generatePlan(input);
  }

  async generateTest(input: GenerateTestInput) {
    this.assertAiAvailable();
    return aiTestGeneratorService.generateTest(input);
  }

  async getConversations() {
    const userId = UserContext.getUserId();
    if (!userId) throw new Error('Context missing');
    return aiRepository.getUserConversations(userId);
  }

  async getConversationHistory(conversationId: string) {
    return aiRepository.getConversationWithMessages(conversationId);
  }

  async getUsageStats() {
    const userId = UserContext.getUserId();
    if (!userId) throw new Error('Context missing');
    
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const usage = await aiRepository.getTotalCostForUser(userId, monthStart);
    return {
      ...usage,
      tokenLimit: 500000,
      tokensRemaining: Math.max(0, 500000 - usage.totalTokensIn - usage.totalTokensOut),
      availableProviders: providerRegistry.getAvailableProviders(),
    };
  }

  private assertAiAvailable() {
    if (!providerRegistry.hasAnyProvider()) {
      throw new AppError(
        'AI_NOT_CONFIGURED',
        'No AI providers are configured. Please contact your administrator.',
        503
      );
    }
  }
}

export const aiService = new AiService();