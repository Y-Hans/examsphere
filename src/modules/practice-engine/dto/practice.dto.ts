import { z } from 'zod';

export const startPracticeSchema = z.object({
  type: z.enum(['SUBJECT', 'CHAPTER', 'TOPIC', 'CONCEPT', 'PYQ', 'WEAK_TOPIC', 'ADAPTIVE']),
  targetId: z.string().uuid().optional(), // Subject, Chapter, Topic, or Concept ID
  examId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});
export type StartPracticeInput = z.infer<typeof startPracticeSchema>;

export const submitPracticeResponseSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  responseValue: z.string().optional(),
  timeSpentSec: z.number().int().min(0),
  hintUsed: z.boolean().default(false),
});
export type SubmitPracticeResponseInput = z.infer<typeof submitPracticeResponseSchema>;

export const getNextQuestionSchema = z.object({
  sessionId: z.string().uuid(),
  currentQuestionId: z.string().uuid().optional(),
});
export type GetNextQuestionInput = z.infer<typeof getNextQuestionSchema>;