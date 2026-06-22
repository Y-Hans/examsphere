ExamSphere — System Architecture
1. High-Level Topology
┌───────────────────────────────┐
│ Vercel Edge │
│ (CDN, TLS, WAF, Edge Fn) │
└───────────────┬───────────────┘
│
┌───────────────▼───────────────┐
│ Next.js 15 (App Router) │
│ RSC + Server Actions + APIs │
└───────┬───────────────┬───────┘
│ │
┌─────────────▼───┐ ┌──────▼──────────────┐
│ src/server │ │ src/client │
│ Domain Layer │ │ Zustand + RQ + UI │
│ Services │ └─────────────────────┘
│ Repositories │
└────────┬────────┘
│
┌──────────────▼──────────────┐
│ Prisma ORM │
│ (Oracle Adapter, mTLS) │
└──────────────┬──────────────┘
│
┌──────────────▼──────────────┐
│ Oracle Autonomous Database │
│ (Partitioned, MVs, Audit) │
└─────────────────────────────┘
│
┌──────────────▼──────────────┐
│ Oracle Object Storage │
│ (Question images, doubt │
│ screenshots, exports) │
└─────────────────────────────┘
External integrations: Auth.js providers, AI providers (OpenAI / Gemini / Anthropic / GLM / DeepSeek), Email (SMTP/Resend), Payment (Razorpay/Stripe/Cashfree), Webhooks.

## 2. Layered Architecture

### 2.1 Presentation Layer (`src/app`)
- React Server Components by default.
- Client Components (`'use client'`) only where state, effects, or browser APIs are required.
- Server Actions for mutations; Route Handlers only for webhooks and uploads.
- Tailwind + shadcn/ui for visual system; Framer Motion for micro-interactions.

### 2.2 Application Layer (`src/server/application`)
- Use-case orchestrators (`*Service.ts`).
- Transaction boundaries.
- Authorization checks via `PermissionService`.
- Cross-module coordination via in-process event bus.

### 2.3 Domain Layer (`src/server/domain`)
- Pure TypeScript: entities, value objects, domain events, domain exceptions.
- Zero framework imports. Zero Prisma imports. Zero Next.js imports.
- This is what makes the system portable and testable.

### 2.4 Infrastructure Layer (`src/server/infrastructure`)
- Prisma repositories implementing domain repository interfaces.
- External clients (AI providers, storage drivers, payment gateways, email).
- Background worker stubs.

### 2.5 Cross-Cutting (`src/server/shared`)
- `TenantContext` (AsyncLocalStorage)
- `Logger`, `ErrorHandler`, `validators`, `pagination`, `crypto`
- Feature flag service
- Audit emitter

## 3. Request Lifecycle (Server Action mutation)

1. Edge middleware resolves `tenantId` from subdomain, attaches to request headers.
2. Server Action receives FormData + headers.
3. `withTenant()` async context wrapper sets `TenantContext`.
4. Zod schema validates input.
5. `PermissionService.assert(user, action, resource)` enforces RBAC.
6. Service opens transaction via `UnitOfWork`.
7. Repository persists via Prisma.
8. Domain events emitted → persisted to `domain_events`.
9. Audit log written.
10. Response (revalidated path or JSON) returned.

## 4. Multi-Tenancy Strategy

- **Resolution:** `*.examsphere.com` wildcard DNS; middleware extracts first label as subdomain → `tenants.subdomain`.
- **Isolation:** every tenant-scoped table has `tenant_id` NOT NULL column, indexed and partitioned.
- **Enforcement:** `TenantAwareRepository` base class auto-injects `tenantId` from `TenantContext` into every `where` clause. Prisma extension hard-blocks queries missing `tenantId`.
- **Tenant types:** `INDIVIDUAL`, `INSTITUTE`, `SCHOOL`, `ENTERPRISE`. Behavior differences implemented via strategy classes, not `if/else` sprawl.
- **Global entities** (e.g., `exams`, `subjects`, system-level `users` for super admins) have `tenant_id NULL`.

## 5. Caching Strategy

- **HTTP:** `Cache-Control` headers + Next.js `unstable_cache` for read-heavy pages.
- **Application:** in-memory LRU for feature flags, syllabus tree, hot question metadata.
- **Database:** Oracle result cache for materialized view refreshes.
- **Invalidation:** revalidateTag / revalidatePath on mutations; explicit cache bust on tenant config changes.

## 6. Background Processing

- Vercel Cron for: MV refresh, rank recompute, scheduled test activation, subscription expiry, digest emails.
- Long-running AI jobs run as Route Handlers with `maxDuration` and idempotency keys.

## 7. Observability

- Structured JSON logs (`pino`) shipped to Vercel logs + optional Datadog.
- OpenTelemetry-compatible spans around repository calls and AI calls.
- Synthetic checks via Playwright in CI for critical flows.

## 8. Security Architecture

- Edge middleware: rate limit by IP + tenant, CSRF double-submit cookie, bot heuristics.
- App layer: Auth.js session, RBAC + permission checks, input validation (Zod), output encoding (React auto-escaping), parameterized SQL (Prisma).
- Data layer: row-level tenant scoping, encrypted PII columns (Oracle TDE), audit triggers.
- Secrets: Vercel env vars; Oracle wallet stored as encrypted base64 env.

## 9. Extensibility Points

- New exam type: add row to `exams` + seed syllabus tree. No code changes.
- New AI provider: implement `LlmProvider` interface, register in `providerRegistry`.
- New payment gateway: implement `PaymentGateway` interface.
- New tenant type: extend `TenantStrategy` abstract class.
- New test type: add enum value + handler in `TestEngine`.
