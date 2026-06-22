import { z } from 'zod';

export const questionMetadataSchema = z.object({
  type: z.enum(['SC', 'MCQ', 'NUMERICAL', 'ASSERTION', 'MATRIX', 'COMPREHENSION']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'VERY_HARD']),
  sourceType: z.enum(['PYQ', 'ORIGINAL', 'INSTITUTE', 'AI']),
  examId: z.string().uuid(),
  subjectId: z.string().uuid(),
  topicIds: z.array(z.string().uuid()).min(1, 'At least one topic is required'),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const questionContentSchema = z.object({
  statement: z.string().min(10, 'Statement must be at least 10 characters'),
  optionA: z.string().optional(),
  optionB: z.string().optional(),
  optionC: z.string().optional(),
  optionD: z.string().optional(),
  correctOptions: z.string().regex(/^[A-D]+(,[A-D]+)*$/, 'Invalid correct options format'),
  solution: z.string().optional(),
  hintLevel1: z.string().optional(),
  hintLevel2: z.string().optional(),
  hintLevel3: z.string().optional(),
  marksCorrect: z.number().positive(),
  marksWrong: z.number().min(0).default(0),
  estTimeSec: z.number().int().positive().optional(),
  pyqYear: z.number().int().min(1990).max(new Date().getFullYear()).optional(),
  pyqExamSession: z.string().optional(),
  pyqShift: z.string().optional(),
  changeSummary: z.string().optional(),
});

export const createQuestionSchema = questionMetadataSchema.merge(questionContentSchema);
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

export const updateQuestionSchema = z.object({
  questionId: z.string().uuid(),
  content: questionContentSchema,
  metadata: questionMetadataSchema.partial(),
});
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

export const reviewActionSchema = z.object({
  questionId: z.string().uuid(),
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES']),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
});
export type ReviewActionInput = z.infer<typeof reviewActionSchema>;

export const questionQuerySchema = z.object({
  page: z.number().int().default(1),
  pageSize: z.number().int().default(20),
  examId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  topicId: z.string().uuid().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'VERY_HARD']).optional(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED', 'FLAGGED']).optional(),
  search: z.string().optional(),
});
export type QuestionQueryInput = z.infer<typeof questionQuerySchema>;