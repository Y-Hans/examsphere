import { z } from 'zod';

export const getDashboardQuerySchema = z.object({
  examId: z.string().uuid().optional(),
});
export type GetDashboardQuery = z.infer<typeof getDashboardQuerySchema>;

export const getRankPredictionSchema = z.object({
  examId: z.string().uuid(),
});
export type GetRankPredictionInput = z.infer<typeof getRankPredictionSchema>;