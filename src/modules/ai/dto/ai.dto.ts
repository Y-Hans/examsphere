import { z } from 'zod';

export const startConversationSchema = z.object({
  type: z.enum(['TUTOR', 'PLANNER', 'TEST_GENERATOR', 'GENERAL']),
  context: z.record(z.any()).optional(),
});
export type StartConversationInput = z.infer<typeof startConversationSchema>;

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1, 'Message cannot be empty').max(4000, 'Message too long'),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const generateStudyPlanSchema = z.object({
  examId: z.string().uuid(),
  weeksUntilExam: z.number().int().min(1).max(52),
  hoursPerDay: z.number().min(1).max(16),
  weakTopicIds: z.array(z.string().uuid()).optional(),
});
export type GenerateStudyPlanInput = z.infer<typeof generateStudyPlanSchema>;

export const generateTestSchema = z.object({
  examId: z.string().uuid(),
  subjectId: z.string().uuid().optional(),
  topicIds: z.array(z.string().uuid()).min(1),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'VERY_HARD']),
  questionCount: z.number().int().min(5).max(30),
});
export type GenerateTestInput = z.infer<typeof generateTestSchema>;