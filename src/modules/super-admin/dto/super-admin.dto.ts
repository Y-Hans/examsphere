import { z } from 'zod';

export const updateTenantStatusSchema = z.object({
  tenantId: z.string().uuid(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TERMINATED']),
});
export type UpdateTenantStatusInput = z.infer<typeof updateTenantStatusSchema>;

export const tenantQuerySchema = z.object({
  page: z.number().int().default(1),
  pageSize: z.number().int().default(20),
  search: z.string().optional(),
  type: z.enum(['INDIVIDUAL', 'INSTITUTE', 'SCHOOL', 'ENTERPRISE']).optional(),
});
export type TenantQueryInput = z.infer<typeof tenantQuerySchema>;