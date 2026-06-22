import { z } from 'zod';

export const resolveDoubtSchema = z.object({
  doubtId: z.string().uuid(),
  body: z.string().min(10, 'Response must be at least 10 characters'),
});
export type ResolveDoubtInput = z.infer<typeof resolveDoubtSchema>;

export const createDoubtSchema = z.object({
  title: z.string().min(5, 'Title is too short'),
  body: z.string().min(10, 'Body is too short'),
  questionId: z.string().uuid().optional(),
});
export type CreateDoubtInput = z.infer<typeof createDoubtSchema>;