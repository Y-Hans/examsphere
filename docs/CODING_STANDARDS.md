ExamSphere — Coding Standards
1. TypeScript
strict: true, noUncheckedIndexedAccess: true, exactOptionalPropertyTypes: true.
Never use any. Use unknown + narrow, or define a proper type.
Prefer interface for object shapes; type for unions/intersections/mapped types.
All exported functions have explicit return types.
All function parameters have explicit types.
Use as const for literal arrays/objects that should not be widened.
2. File Organization
Max 300 lines per file. Split if exceeded.
Max 5 levels of nesting in functions. Extract helpers.
One default export per file (React components); everything else named.
3. Imports
Order: Node built-ins → external packages → @/server → @/client → @/lib → relative.
Use import type for type-only imports.
No barrel imports inside a module (causes circular deps); barrels only for cross-module consumption.
4. Error Handling
Throw typed domain errors: NotFoundError, AuthorizationError, ValidationError, ConflictError, TenantError.
Never swallow errors. Always log + rethrow or convert to a known error type.
Server Actions return { data, error } discriminated unions, never throw to the client.
All errors include code, message, optional field (for validation), and traceId.
5. Async
Always async/await; no raw .then() chains.
Parallelize independent awaits via Promise.all.
Never await inside a loop. Map to promises then Promise.all.
6. React
Server Components by default. Add 'use client' only when needed.
Co-locate state as low as possible. Lift to Zustand only when crossing many components.
Use React Query for server state. Use Zustand only for ephemeral UI state.
useEffect only for syncing with external systems; prefer derived state.
Keys: stable IDs, never array indices for dynamic lists.
Memoization (useMemo, useCallback) only when measured bottleneck exists.
7. Styling
Tailwind utility-first. No custom CSS unless unavoidable.
Reusable patterns extracted to cn()-wrapped components, not Tailwind @apply cascades.
Dark mode via class strategy.
Color tokens from shadcn/ui theme; never raw hex codes.
8. API Conventions (Segment 4 expands)
RESTful verbs; plural nouns.
All routes under /api/v1/.
Request body validated by Zod; response shaped by output DTO.
Pagination: cursor for unbounded, page+pageSize for bounded.
Standard error envelope: { error: { code, message, fields? } }.
9. Database
All writes inside transactions.
Never use findFirst when expecting exactly one — use findUnique or throw.
All tenant-scoped queries pass through TenantAwareRepository.
Raw SQL only via Prisma $queryRaw with tagged templates — never string concat.
N+1 prevention: always include/select planned relations.
10. Testing
Unit tests for services, domain logic, utils.
Integration tests for repositories (against test Oracle schema).
E2E for critical user journeys: signup → onboarding → take test → view analytics.
Test names: should <expected behavior> when <condition>.
No shared state between tests. Each test sets up and tears down its own data.
Use vi.fn() mocks for external dependencies; real DB for integration tests.
11. Comments
Comments explain why, not what.
JSDoc on all exported functions: @param, @returns, @throws.
No commented-out code in committed files.
12. Git
Conventional commits: feat(scope):, fix(scope):, chore:, docs:, refactor:, test:, perf:.
PR title matches commit format.
Squash-merge to main.
Every PR must pass: lint, typecheck, unit, integration, build, Lighthouse.
13. Security
Never log secrets, tokens, passwords, PII.
Validate every external input (Zod) at the boundary.
Escape dynamic SQL via parameterization only.
Sanitize HTML rendered with dangerouslySetInnerHTML (rare) via DOMPurify.
Cookies: HttpOnly, Secure, SameSite=Lax, Path=/.
JWT expiry ≤ 24h; refresh tokens ≤ 30d with rotation.
