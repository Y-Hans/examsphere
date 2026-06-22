import { providerRegistry } from '@/server/infrastructure/ai/provider-registry';
import { LlmMessage } from '@/server/infrastructure/ai/llm-provider';
import { aiRepository } from '../repositories/ai.repository';
import { TenantContext } from '@/server/shared/tenant-context';
import { UserContext } from '@/server/shared/user-context';
import { NotFoundError } from '@/server/shared/errors';
import { prisma } from '@/server/infrastructure/prisma/client';

const TUTOR_SYSTEM_PROMPT = `You are ExamSphere AI Tutor, an expert educator for Indian competitive exams (JEE Main, JEE Advanced, NEET).

Your role:
- Explain concepts clearly using simple language and real-world analogies
- Solve problems step-by-step, showing every intermediate calculation
- Identify the student's misconception and correct it
- Provide practice recommendations based on the student's weak areas
- Use LaTeX formatting for mathematical expressions: inline with $...$ and display with $$...$$ 
Rules:
- Never just give the final answer without explanation
- Always ask a guiding question at the end to check understanding
- Keep responses concise (under 500 words) unless a detailed derivation is needed
- If the student is confused, simplify further rather than repeating the same explanation
- Encourage the student and acknowledge their effort`;

export class AiTutorService {
  async startConversation(context?: Record<string, any>) {
    const userId = UserContext.getUserId();
    const tenantId = TenantContext.getTenantId();
    if (!userId || !tenantId) throw new Error('Context missing');

    const conversation = await aiRepository.createConversation({
      userId,
      tenantId,
      type: 'TUTOR',
    });

    // If context has a question reference, include it
    let contextMessage = '';
    if (context?.questionId) {
      const question = await prisma.question.findUnique({
        where: { id: context.questionId },
        include: { versions: { orderBy: { versionNo: 'desc' }, take: 1 } },
      });
      if (question?.versions[0]) {
        const v = question.versions[0];
        contextMessage = `The student is asking about this question:\n\nStatement: ${v.statement}\n${v.optionA ? `A) ${v.optionA}\n` : ''}${v.optionB ? `B) ${v.optionB}\n` : ''}${v.optionC ? `C) ${v.optionC}\n` : ''}${v.optionD ? `D) ${v.optionD}\n` : ''}\nCorrect answer: ${v.correctOptions}\n\nStudent's query: ${context.query || 'Please explain this question.'}`;
      }
    }

    return { conversation, contextMessage };
  }

  async sendMessage(conversationId: string, userMessage: string) {
    const userId = UserContext.getUserId();
    const tenantId = TenantContext.getTenantId();
    if (!userId || !tenantId) throw new Error('Context missing');

    const conversation = await aiRepository.getConversationWithMessages(conversationId);
    if (!conversation) throw new NotFoundError('Conversation', conversationId);
    if (conversation.userId !== userId) throw new Error('Unauthorized');

    // Check usage limits
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const usage = await aiRepository.getTotalCostForUser(userId, monthStart);
    if (usage.totalTokensIn + usage.totalTokensOut > 500000) {
      throw new Error('Monthly AI usage limit reached. Please upgrade your plan.');
    }

    // Build message history
    const messages: LlmMessage[] = [
      { role: 'system', content: TUTOR_SYSTEM_PROMPT },
    ];

    // Add previous messages (last 10 to keep context window manageable)
    const recentMessages = conversation.messages.slice(-10);
    for (const msg of recentMessages) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    // Add current message
    messages.push({ role: 'user', content: userMessage });

    // Generate response
    const provider = providerRegistry.getProvider();
    const response = await provider.generate({
      messages,
      temperature: 0.7,
      maxTokens: 1500,
    });

    // Persist user message
    await aiRepository.addMessage({
      conversationId,
      role: 'user',
      content: userMessage,
      provider: 'USER',
      tokensIn: 0,
      tokensOut: 0,
      costInr: 0,
      latencyMs: 0,
    });

    // Persist AI response
    await aiRepository.addMessage({
      conversationId,
      role: 'assistant',
      content: response.content,
      provider: response.provider,
      tokensIn: response.tokensIn,
      tokensOut: response.tokensOut,
      costInr: response.costInr,
      latencyMs: response.latencyMs,
    });

    return {
      message: response.content,
      provider: response.provider,
      tokensUsed: response.tokensIn + response.tokensOut,
    };
  }
}

export const aiTutorService = new AiTutorService();