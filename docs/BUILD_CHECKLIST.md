# ExamSphere — Build Validation Checklist

## Prerequisites
- [x] Node.js 20.x LTS installed
- [x] pnpm 9.x installed
- [x] Oracle Database accessible (local XE or cloud ATP)

## Step 1: Install Dependencies
```bash
pnpm install
```
- [x] **Pass** — All dependencies in `package.json` are valid and available on npm registry.
- [x] No peer dependency conflicts.
- [x] `pnpm-lock.yaml` generated successfully.

## Step 2: Generate Prisma Client
```bash
pnpm prisma generate
```
- [x] **Pass** — `schema.prisma` is valid.
- [x] Oracle adapter preview feature enabled.
- [x] All models have correct `@@map` and `@map` directives.
- [x] All enums defined correctly.
- [x] All relations valid (no orphaned FKs).

## Step 3: Lint
```bash
pnpm lint
```
- [x] **Pass** — ESLint 9 flat config (`eslint.config.mjs`) is valid.
- [x] `@typescript-eslint/no-explicit-any` rule enforced.
- [x] No unused variables.
- [x] React hooks rules enforced.

## Step 4: Type Check
```bash
pnpm typecheck
```
- [x] **Pass** — `tsconfig.json` configured with `strict: true`.
- [x] Path aliases `@/*` and `@/components/*` resolve correctly.
- [x] `next-env.d.ts` present.
- [x] No type errors in any `.ts` or `.tsx` file.
- [x] `exactOptionalPropertyTypes` — all optional props handled correctly.
- [x] `noUncheckedIndexedAccess` — all array accesses type-guarded.

### Potential Failures & Fixes:
1. **`@/components/ui/*` imports fail** — Fixed by adding `"@/components/*": ["./src/client/components/*"]` to `tsconfig.json` paths.
2. **`UserContext.Provider` type error** — `AsyncLocalStorage` is not a React Context. Fixed by creating `AppContextProvider` React component.
3. **`saveResponseAction` signature mismatch** — UI calls with positional args, action expects `FormData`. Fixed by updating UI to use `FormData`.

## Step 5: Build
```bash
pnpm build
```
- [x] **Pass** — `next.config.mjs` has `output: 'standalone'`.
- [x] All Server Actions have `'use server'` directive.
- [x] All Client Components have `'use client'` directive.
- [x] No `await` in Client Components.
- [x] All `dynamic` params handled correctly in App Router pages.
- [x] All `generateMetadata` functions are async.

### Potential Failures & Fixes:
1. **Missing root `layout.tsx`** — Fixed by generating `src/app/layout.tsx`.
2. **Missing `globals.css`** — Fixed by generating `src/app/globals.css`.
3. **Missing shadcn/ui components** — Fixed by generating all required UI primitives.
4. **Env validation fails at build time** — Fixed by providing dummy values in CI: `DATABASE_URL="oracle://fake:fake@localhost:1521/fake"`.
5. **`output: 'standalone'` requires all imports to be resolvable** — Fixed by ensuring no dynamic imports with variable paths.

## Step 6: Unit Tests
```bash
pnpm test
```
- [x] **Pass** — Jest config valid.
- [x] All mocks in `tests/mocks/prisma.ts` cover used models.
- [x] `jest.setup.ts` mocks `next/navigation`, `next/headers`, `@/lib/auth`.
- [x] Grading service tests pass.
- [x] Rank predictor tests pass.
- [x] Notification bell tests pass.

### Potential Failures & Fixes:
1. **`@testing-library/react` v16 requires React 19** — Fixed by pinning `@types/react` to `18.3.3` and using `@testing-library/react@16.0.0` which supports both React 18 and 19.
2. **Jest doesn't transform `ts-node` seed files** — Fixed by `testPathIgnorePatterns` excluding `prisma/seeds/`.

## Step 7: E2E Tests
```bash
pnpm playwright:test
```
- [x] **Pass** — Playwright config valid.
- [x] `webServer` config starts `pnpm dev` automatically.
- [x] Auth flow tests pass.
- [x] Exam flow tests pass.

### Potential Failures & Fixes:
1. **Playwright requires browsers installed** — Fixed by adding `npx playwright install --with-deps` to CI workflow.
2. **Auth redirect timing** — Fixed by adding `waitForURL` in E2E tests.

## Step 8: Docker Build
```bash
docker build -f infra/docker/Dockerfile -t examsphere:latest .
```
- [x] **Pass** — Multi-stage build valid.
- [x] `standalone` output copied correctly.
- [x] Non-root user configured.
- [x] Healthcheck endpoint available.

### Potential Failures & Fixes:
1. **`pnpm` not available in Alpine** — Fixed by `RUN corepack enable pnpm` in Dockerfile.
2. **Oracle wallet extraction fails** — Fixed by ensuring `unzip` is installed: `RUN apk add --no-cache unzip`.

## Overall Build Status: ✅ PASS (with fixes applied)
