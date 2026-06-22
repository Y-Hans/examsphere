import { z } from 'zod';

export const createSyllabusNodeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  parentId: z.string().uuid(),
  level: z.enum(['UNIT', 'CHAPTER', 'TOPIC', 'CONCEPT']),
});

export type CreateSyllabusNodeInput = z.infer<typeof createSyllabusNodeSchema>;

export const updateSyllabusNodeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).optional(),
});

export type UpdateSyllabusNodeInput = z.infer<typeof updateSyllabusNodeSchema>;