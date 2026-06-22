import { z } from 'zod';

export const createBatchSchema = z.object({
  name: z.string().min(3, 'Batch name must be at least 3 characters'),
  description: z.string().optional(),
});
export type CreateBatchInput = z.infer<typeof createBatchSchema>;

export const enrollStudentSchema = z.object({
  batchId: z.string().uuid(),
  studentEmail: z.string().email('Invalid student email'),
});
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;