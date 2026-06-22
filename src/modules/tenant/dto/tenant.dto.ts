import { z } from 'zod';

export const updateBrandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color'),
  logoUrl: z.string().url().optional().or(z.literal('')),
  customDomain: z.string().optional().or(z.literal('')),
  theme: z.enum(['LIGHT', 'DARK', 'SYSTEM']).default('SYSTEM'),
});

export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;

export const updateTenantSettingsSchema = z.object({
  allowStudentSignup: z.boolean().default(true),
  requireEmailVerification: z.boolean().default(false),
  defaultExamCode: z.enum(['JEE_MAIN', 'JEE_ADVANCED', 'NEET']).optional(),
  timezone: z.string().default('Asia/Kolkata'),
});

export type UpdateTenantSettingsInput = z.infer<typeof updateTenantSettingsSchema>;