import { z } from 'zod';

const envSchema = z.object({
  // Core
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000/api/v1'),

  // Auth
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  // Database
  DATABASE_URL: z.string(),
  ORACLE_SCHEMA: z.string().default('EXAMSPHERE'),
  ORACLE_WALLET_BASE64: z.string().optional(),
  ORACLE_WALLET_PATH: z.string().optional(),
  ORACLE_WALLET_PASSWORD: z.string().optional(),

  // Storage
  STORAGE_DRIVER: z.enum(['local', 'oracle']).default('local'),
  LOCAL_STORAGE_PATH: z.string().default('./uploads'),
  ORACLE_OBJECT_STORAGE_NAMESPACE: z.string().optional(),
  ORACLE_OBJECT_STORAGE_REGION: z.string().optional(),
  ORACLE_OBJECT_STORAGE_BUCKET: z.string().optional(),
  ORACLE_OBJECT_STORAGE_ACCESS_KEY: z.string().optional(),
  ORACLE_OBJECT_STORAGE_SECRET_KEY: z.string().optional(),

  // AI Providers
  AI_PREFERRED_PROVIDER: z.enum(['OPENAI', 'GEMINI', 'ANTHROPIC', 'GLM', 'DEEPSEEK']).default('OPENAI'),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GLM_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),

  // Payments
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),

  // Cron
  CRON_SECRET: z.string().min(16),

  // Observability
  SENTRY_DSN: z.string().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().default('examsphere-api'),

  // Redis (optional)
  REDIS_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables. Check your .env file.');
  }

  return parsed.data;
}

export const env = loadEnv();
