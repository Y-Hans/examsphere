import { providerRegistry } from '@/server/infrastructure/ai/provider-registry';
import { LlmMessage } from '@/server/infrastructure/ai/llm-provider';
import { aiRepository } from '../repositories/ai.repository';
import { prisma } from '@/server/infrastructure/prisma/client';
import { TenantContext } from '@/server/shared/tenant-context';
import { UserContext } from '@/server/shared/user-context';
import { GenerateStudyPlanInput } from '../dto/ai.dto';

const PLANNER_SYSTEM_PROMPT = `You are ExamSphere AI Study Planner, an expert at creating personalized study schedules for JEE and NEET aspirants.

Your output must be valid JSON with this exact structure:
{
  "plan": {
    "title": "string",
    "summary": "string",
    "phases": [
      {
        "name": "string (e.g., 'Phase 1: Foundation Building')",
        "weeks": "string (e.g., 'Weeks 1-4')",
        "goals": ["string"],
        "dailySchedule": [
          {
            "day": "string (e.g., 'Monday')",
            "sessions": [
              {
                "subject": "string",
                "topic": "string",
                "duration": "string (e.g., '2 hours')",
                "activity": "string (e.g., 'Study Mechanics + Practice 20 questions')"
              }
            ]
          }
        ]
      }
    ],
    "weeklyMilestones": ["string"],
    "revisionStrategy": "string",
    "mockTestSchedule": "string"
  }
}

Rules:
- Distribute subjects evenly based on the student's weak areas
- Include 1 full mock test per week in later phases
- Allocate 20% of time to revision in early phases, 40% in later phases
- Include breaks and buffer time
- Adapt difficulty progression: easy fundamentals first, advanced problems later`;

export class AiPlannerService {
  async generatePlan(input: GenerateStudyPlanInput) {
    const userId = UserContext.getUserId();
    const tenantId = TenantContext.getTenantId();
    if (!userId || !tenantId) throw new Error('Context missing');

    // Fetch user's weak topics if not explicitly provided
    let weakTopicIds = input.weakTopicIds || [];
    let weakTopicNames: string[] = [];

    if (weakTopicIds.length === 0) {
      const weakTopics = await prisma.weakTopic.findMany({
        where: { userId },
        orderBy: { weaknessScore: 'desc' },
        take: 5,
        include: { topic: { select: { name: true } } },
      });
      weakTopicIds = weakTopics.map(wt => wt.topicId);
      weakTopicNames = weakTopics.map(wt => wt.topic.name);
    } else {
      const topics = await prisma.topic.findMany({
        where: { id: { in: weakTopicIds } },
        select: { name: true },
      });
      weakTopicNames = topics.map(t => t.name);
    }

    // Fetch exam details
    const exam = await prisma.exam.findUnique({
      where: { id: input.examId },
      include: { subjects: { select: { name: true } } },
    });

    if (!exam) throw new Error('Exam not found');

    const userPrompt = `Create a personalized study plan with these parameters:
- Exam: ${exam.name}
- Weeks until exam: ${input.weeksUntilExam}
- Hours per day available: ${input.hoursPerDay}
- Subjects: ${exam.subjects.map(s => s.name).join(', ')}
- Weak topics to focus on: ${weakTopicNames.length > 0 ? weakTopicNames.join(', ') : 'None identified yet'}

Generate a comprehensive, phased study plan in JSON format.`;

    const messages: LlmMessage[] = [
      { role: 'system', content: PLANNER_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    const provider = providerRegistry.getProvider();
    const response = await provider.generate({
      messages,
      temperature: 0.3,
      maxTokens: 3000,
      jsonMode: true,
    });

    // Persist the conversation
    const conversation = await aiRepository.createConversation({
      userId,
      tenantId,
      type: 'PLANNER',
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

    let plan;
    try {
      plan = JSON.parse(response.content);
    } catch {
      plan = { rawContent: response.content };
    }

    return {
      conversationId: conversation.id,
      plan,
      provider: response.provider,
      tokensUsed: response.tokensIn + response.tokensOut,
    };
  }
}

export const aiPlannerService = new AiPlannerService();