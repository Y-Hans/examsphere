examsphere/
├─ .github/
│ └─ workflows/
│ ├─ ci.yml
│ ├─ deploy-staging.yml
│ └─ deploy-production.yml
├─ .vscode/
│ ├─ settings.json
│ └─ extensions.json
├─ docs/
│ ├─ PROJECT_PLAN.md
│ ├─ ARCHITECTURE.md
│ ├─ FOLDER_STRUCTURE.md
│ ├─ CODING_STANDARDS.md
│ ├─ MODULE_DESIGN.md
│ ├─ ER_DIAGRAM.md
│ ├─ DEVELOPMENT_STANDARDS.md
│ ├─ API_CONVENTIONS.md (Segment 4)
│ ├─ SECURITY.md (Segment 5)
│ └─ DEPLOYMENT.md (Segment 22)
├─ prisma/
│ ├─ schema.prisma (Segment 3)
│ ├─ migrations/ (Segment 3)
│ ├─ seeds/ (Segment 3)
│ └─ oracle/
│ ├─ 01_schema.sql (Segment 2)
│ ├─ 02_partitions.sql (Segment 2)
│ ├─ 03_indexes.sql (Segment 2)
│ ├─ 04_constraints.sql (Segment 2)
│ ├─ 05_triggers.sql (Segment 2)
│ ├─ 06_materialized_views.sql (Segment 2)
│ └─ 07_seed_syllabus.sql (Segment 3)
├─ public/
│ ├─ brand/
│ └─ illustrations/
├─ scripts/
│ ├─ oracle-wallet-setup.sh
│ ├─ seed.ts
│ └─ healthcheck.ts
├─ src/
│ ├─ app/
│ │ ├─ (marketing)/ # Public landing
│ │ ├─ (auth)/ # Login, register, forgot
│ │ ├─ (app)/ # Tenant-scoped app
│ │ │ ├─ student/
│ │ │ ├─ teacher/
│ │ │ ├─ institute/
│ │ │ ├─ parent/
│ │ │ └─ super-admin/
│ │ ├─ api/
│ │ │ └─ v1/
│ │ ├─ layout.tsx
│ │ ├─ error.tsx
│ │ ├─ not-found.tsx
│ │ └─ globals.css
│ ├─ modules/
│ │ ├─ identity/ # auth, users, sessions
│ │ ├─ tenant/ # multi-tenancy
│ │ ├─ rbac/ # roles, permissions
│ │ ├─ question-bank/
│ │ ├─ exam-engine/
│ │ ├─ practice-engine/
│ │ ├─ analytics/
│ │ ├─ ai/
│ │ ├─ doubt/
│ │ ├─ subscription/
│ │ ├─ notification/
│ │ ├─ institute/ # enterprise management
│ │ ├─ content/ # study material
│ │ └─ billing/ # payment abstraction
│ │
│ │ # Each module follows the same internal layout:
│ │ └─ <module>/
│ │ ├─ actions/ # Server Actions
│ │ ├─ api/ # Route Handlers (if any)
│ │ ├─ components/ # React components
│ │ ├─ hooks/ # Client hooks (React Query)
│ │ ├─ stores/ # Zustand stores
│ │ ├─ dto/ # Input/Output DTOs + Zod
│ │ ├─ domain/ # Entities, value objects, events
│ │ ├─ services/ # Use-case services
│ │ ├─ repositories/ # Repository interfaces + Prisma impl
│ │ ├─ lib/ # Module-private utilities
│ │ ├─ constants.ts
│ │ ├─ index.ts # Public barrel
│ │ └─ README.md
│ │
│ ├─ server/
│ │ ├─ shared/
│ │ │ ├─ tenant-context.ts
│ │ │ ├─ user-context.ts
│ │ │ ├─ logger.ts
│ │ │ ├─ errors.ts
│ │ │ ├─ pagination.ts
│ │ │ ├─ crypto.ts
│ │ │ ├─ audit.ts
│ │ │ ├─ feature-flags.ts
│ │ │ ├─ event-bus.ts
│ │ │ └─ unit-of-work.ts
│ │ ├─ infrastructure/
│ │ │ ├─ prisma/
│ │ │ │ ├─ client.ts
│ │ │ │ ├─ extensions/
│ │ │ │ │ ├─ tenant-scoping.ts
│ │ │ │ │ └─ soft-delete.ts
│ │ │ │ └─ base-repository.ts
│ │ │ ├─ storage/
│ │ │ │ ├─ storage-driver.ts
│ │ │ │ ├─ local-storage-driver.ts
│ │ │ │ └─ oracle-object-storage-driver.ts
│ │ │ ├─ ai/
│ │ │ │ ├─ llm-provider.ts
│ │ │ │ ├─ openai-adapter.ts
│ │ │ │ ├─ gemini-adapter.ts
│ │ │ │ ├─ anthropic-adapter.ts
│ │ │ │ ├─ glm-adapter.ts
│ │ │ │ ├─ deepseek-adapter.ts
│ │ │ │ └─ provider-registry.ts
│ │ │ ├─ payment/
│ │ │ │ ├─ payment-gateway.ts
│ │ │ │ ├─ razorpay-adapter.ts
│ │ │ │ ├─ stripe-adapter.ts
│ │ │ │ └─ cashfree-adapter.ts
│ │ │ └─ email/
│ │ │ ├─ email-provider.ts
│ │ │ └─ resend-adapter.ts
│ │ └─ middleware-stubs/
│ │ ├─ rate-limit.ts
│ │ ├─ csrf.ts
│ │ └─ tenant-resolver.ts
│ │
│ ├─ client/
│ │ ├─ components/ # Shared UI (shadcn/ui)
│ │ ├─ providers/
│ │ │ ├─ query-provider.tsx
│ │ │ ├─ theme-provider.tsx
│ │ │ └─ auth-provider.tsx
│ │ ├─ hooks/
│ │ └─ lib/
│ │ ├─ utils.ts # cn(), formatters
│ │ └─ constants.ts
│ │
│ ├─ lib/
│ │ ├─ auth.ts # Auth.js config
│ │ ├─ auth.config.ts # Edge-safe config
│ │ └─ env.ts # Zod-validated env
│ │
│ └─ middleware.ts # Edge middleware
│
├─ tests/
│ ├─ unit/
│ ├─ integration/
│ ├─ e2e/ # Playwright
│ ├─ load/ # k6 scripts
│ └─ fixtures/
│
├─ infra/
│ ├─ docker/
│ │ ├─ Dockerfile
│ │ ├─ Dockerfile.dev
│ │ └─ docker-entrypoint.sh
│ ├─ docker-compose.yml
│ ├─ docker-compose.dev.yml
│ └─ oracle/
│ └─ wallet/ # gitignored
│
├─ .env.example
├─ .env.local # gitignored
├─ .eslintrc.cjs
├─ .prettierrc
├─ .editorconfig
├─ tsconfig.json
├─ next.config.mjs
├─ tailwind.config.ts
├─ postcss.config.mjs
├─ jest.config.ts
├─ playwright.config.ts
├─ package.json
├─ pnpm-lock.yaml
├─ PROJECT_STATE.md
└─ README.md


## Module Independence Rules

- A module may import from `src/server/shared`, `src/server/infrastructure`, `src/client`, `src/lib` only.
- A module **may not** import from another module's internal folders (`domain`, `repositories`, `services`). Cross-module calls go through the other module's `index.ts` barrel, which exports only services and DTOs.
- Circular module imports are blocked by an ESLint rule.

## File Naming

- One component per `.tsx` file.
- One service per file in `services/`.
- One repository per file in `repositories/`.
- Tests live next to source: `user-service.ts` ↔ `user-service.test.ts`.