import { z } from 'zod';

export const createTestTemplateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  type: z.string(), // FULL_SYLLABUS, CHAPTER_TEST, etc.
  examId: z.string().uuid(),
  durationMin: z.number().int().positive(),
  totalMarks: z.number().positive(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  sections: z.array(z.object({
    subjectId: z.string().uuid(),
    name: z.string().min(2),
    questionCount: z.number().int().positive(),
    marksCorrect: z.number().positive(),
    marksWrong: z.number().min(0).default(0),
    durationMin: z.number().int().positive().optional(),
    orderNo: z.number().int().positive(),
    questionIds: z.array(z.string().uuid()).min(1)
  })).min(1, 'At least one section is required')
});
export type CreateTestTemplateInput = z.infer<typeof createTestTemplateSchema>;

export const saveResponseSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  sectionId: z.string().uuid(),
  responseValue: z.string().optional(),
  status: z.enum(['NOT_VISITED', 'VISITED', 'ANSWERED', 'MARKED_REVIEW', 'ANSWERED_REVIEW']),
  timeSpentSec: z.number().int().min(0).default(0),
});
export type SaveResponseInput = z.infer<typeof saveResponseSchema>;

export const submitTestSchema = z.object({
  sessionId: z.string().uuid(),
});
export type SubmitTestInput = z.infer<typeof submitTestSchema>;