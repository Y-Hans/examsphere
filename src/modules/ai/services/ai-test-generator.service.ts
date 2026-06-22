import { providerRegistry } from '@/server/infrastructure/ai/provider-registry';
import { LlmMessage } from '@/server/infrastructure/ai/llm-provider';
import { aiRepository } from '../repositories/ai.repository';
import { prisma } from '@/server/infrastructure/prisma/client';
import { TenantContext } from '@/server/shared/tenant-context';
import { UserContext } from '@/server/shared/user-context';
import { GenerateTestInput } from '../dto/ai.dto';
import { logger } from '@/server/shared/logger';

const log = logger.child({ module: 'AiTestGenerator' });

const TEST_GEN_SYSTEM_PROMPT = `You are ExamSphere AI Test Generator, specialized in creating JEE and NEET practice questions.

Your output must be valid JSON with this exact structure:
{
  "questions": [
    {
      "type": "SC" or "MCQ",
      "statement": "string - the question text. Use $...$ for inline LaTeX and $$...$$ for display LaTeX.",
      "optionA": "string",
      "optionB": "string",
      "optionC": "string",
      "optionD": "string",
      "correctOptions": "string - single letter for SC (e.g. 'A'), comma-separated for MCQ (e.g. 'A,C')",
      "solution": "string - detailed step-by-step solution",
      "hintLevel1": "string - subtle hint",
      "hintLevel2": "string - more direct hint",
      "hintLevel3": "string - nearly gives away the approach",
      "estimatedTimeSec": number,
      "difficulty": "EASY" | "MEDIUM" | "HARD" | "VERY_HARD"
    }
  ]
}

Rules:
- Generate exactly the requested number of questions
- Each question must be original and pedagogically sound
- Options must be plausible with common misconceptions as distractors
- Solutions must show complete working
- Use proper LaTeX for all mathematical expressions
- Vary the question types within the requested set
- Ensure questions match the specified difficulty level`;

export class AiTestGeneratorService {
  async generateTest(input: GenerateTestInput) {
    const userId = UserContext.getUserId();
    const tenantId = TenantContext.getTenantId();
    if (!userId || !tenantId) throw new Error('Context missing');

    // Fetch topic and subject details
    const topics = await prisma.topic.findMany({
      where: { id: { in: input.topicIds } },
      include: {
        chapter: { include: { unit: { include: { subject: true } } } },
      },
    });

    if (topics.length === 0) throw new Error('Topics not found');

    const subjectName = input.subjectId
      ? (await prisma.subject.findUnique({ where: { id: input.subjectId } }))?.name
      : topics[0].chapter.unit.subject.name;

    const topicNames = topics.map(t => `${t.chapter.unit.subject.name} > ${t.chapter.name} > ${t.name}`);

    const userPrompt = `Generate ${input.questionCount} practice questions for the following:
- Exam: JEE/NEET level
- Subject: ${subjectName}
- Topics: ${topicNames.join(', ')}
- Difficulty: ${input.difficulty}

Create high-quality, original questions in JSON format.`;

    const messages: LlmMessage[] = [
      { role: 'system', content: TEST_GEN_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    const provider = providerRegistry.getProvider();
    const response = await provider.generate({
      messages,
      temperature: 0.5,
      maxTokens: 4000,
      jsonMode: true,
    });

    // Parse generated questions
    let generatedQuestions: any[] = [];
    try {
      const parsed = JSON.parse(response.content);
      generatedQuestions = parsed.questions || [];
    } catch {
      log.error({ content: response.content }, 'Failed to parse AI-generated questions');
      throw new Error('AI generated invalid question format. Please try again.');
    }

    // Persist the generation as a conversation
    const conversation = await aiRepository.createConversation({
      userId,
      tenantId,
      type: 'TEST_GENERATOR',
    });

    await aiRepository.addMessage({
      conversationId: conversation.id,
      role: 'user',
      content: userPrompt,
      provider: 'USER',
      tokensIn: 0,
      tokensOut: 0,
      costInr: 0,
      latencyMs: 0,
    });

    await aiRepository.addMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: response.content,
      provider: response.provider,
      tokensIn: response.tokensIn,
      tokensOut: response.tokensOut,
      costInr: response.costInr,
      latencyMs: response.latencyMs,
    });

    return {
      conversationId: conversation.id,
      questions: generatedQuestions,
      provider: response.provider,
      tokensUsed: response.tokensIn + response.tokensOut,
    };
  }
}

export const aiTestGeneratorService = new AiTestGeneratorService();