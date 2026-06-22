ExamSphere — Development Standards
1. Local Environment
Node: 20.x LTS (enforced via .nvmrc)
Package Manager: pnpm 9.x (enforced via packageManager field)
OS: macOS / Linux / WSL2
Editor: VS Code with workspace recommended extensions (ESLint, Prettier, Tailwind IntelliSense, Prisma, Playwright)
2. Required Tooling
Tool	Purpose	Config File
TypeScript 5.x	Type system	tsconfig.json
ESLint 9 (flat config)	Linting	eslint.config.mjs
Prettier 3	Formatting	.prettierrc
EditorConfig	Cross-editor style	.editorconfig
Husky + lint-staged	Pre-commit hooks	.husky/
commitlint	Commit format	commitlint.config.cjs
Vitest / Jest	Unit + integration	jest.config.ts
Playwright	E2E	playwright.config.ts
Knip	Dead code detection	knip.json
3. Pre-Commit Hooks
Run on staged files:

prettier --write
eslint --fix
tsc --noEmit (whole project, fast with --incremental)
knip (no unused exports)
Relevant unit tests (changed files only via jest --findRelatedTests)
4. Branching
main — always deployable to production.
develop — integration branch for staging.
Feature branches: feat/<scope>-<short-desc> (e.g., feat/question-bank-review-workflow).
Hotfix branches: hotfix/<issue-id> from main, merged back to main and develop.
5. Pull Request Rules
Linked issue required.
PR description template enforced (what / why / how / risks / screenshots).
At least one reviewer approval.
All CI checks green.
Lighthouse diff ≤ 5 points regression.
Coverage diff ≤ 2 points regression.
6. Commit Message Format
<type>(<scope>): <imperative summary in ≤ 72 chars>

<optional body, wrapped at 100 chars>

<optional footer with BREAKING CHANGE: ...>

text



- Bundle: first-load JS ≤ 200 KB on student dashboard
- LCP ≤ 2.5s on 4G
- TTI ≤ 3.5s on 4G
- API p95 ≤ 300 ms (excluding AI endpoints)
- AI endpoint p95 ≤ 8 s with streaming
- DB query count per request ≤ 10 (warn), ≤ 20 (error)

## 9. Dependency Policy

- New deps require: rationale, license check (MIT/Apache-2.0 preferred), bundle size impact, security audit pass.
- Monthly `pnpm audit` + Dependabot for patch updates.
- Major version bumps require dedicated PR with regression tests.

## 10. Secrets Management

- Local: `.env.local` (gitignored), template `.env.example` committed.
- CI: GitHub Actions secrets.
- Production: Vercel env vars (encrypted at rest).
- Oracle wallet: stored as base64 in env var `ORACLE_WALLET_BASE64`, decoded at container start.
- Never commit: `.env*`, `*.pem`, `*.key`, wallet zips.

## 11. Logging Standards

- Structured JSON via `pino`.
- Levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`.
- Every log entry includes: `timestamp`, `level`, `tenantId`, `userId`, `requestId`, `module`, `message`.
- No PII at `info` or below. PII allowed at `debug` in non-prod only.
- Errors include stack trace and `cause` chain.

## 12. Observability Checklist per Module

- [ ] Logger instance with module name
- [ ] Metrics emitted for: request count, latency, error rate
- [ ] Health check endpoint covers external deps
- [ ] Alerts defined for error rate > 1% and p95 > 500 ms

## 13. Release Process

1. PR merged to `develop` → CI builds → auto-deploy to staging.
2. Smoke tests on staging (Playwright smoke suite).
3. PR from `develop` → `main` titled `release: vX.Y.Z`.
4. Approval → merge → tag → auto-deploy to production.
5. Post-deploy: synthetic checks, error rate watch for 30 minutes.
6. Rollback: Vercel instant rollback + Prisma migration down (if schema changed).

## 14. Incident Response

- Sev1 (outage): acknowledge ≤ 15 min, comms every 30 min, postmortem ≤ 48 h.
- Sev2 (degraded): acknowledge ≤ 1 h, comms every 2 h, postmortem ≤ 5 days.
- Sev3 (minor): next business day.
- Postmortems: blameless, root-cause focused, action items tracked to closure.

## 15. Documentation Requirements

- Every module has `README.md` with: purpose, public API, dependencies, testing notes.
- Every non-trivial service function has JSDoc.
- Architecture decisions recorded in `PROJECT_STATE.md → Architectural Decisions`.
- API changes update `docs/API_CONVENTIONS.md` (created in Segment 4).