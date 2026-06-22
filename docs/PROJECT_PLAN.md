ExamSphere — Project Plan
1. Vision
ExamSphere is a multi-tenant SaaS examination ecosystem that prepares students for India's most competitive engineering and medical entrance exams (JEE Main, JEE Advanced, NEET) with future extensibility to CUET, BITSAT, NDA, and Olympiads. It serves four customer segments — individual students, coaching institutes, schools, and enterprises — from a single, isolated, brandable tenant per customer.

2. Goals
Goal	Metric
Production-ready release	Deployable on Vercel + Oracle ADW after env config
Scale	1M+ questions, 100k+ concurrent exam sessions
Performance	95+ Lighthouse, p95 API latency < 300 ms
Reliability	99.9% monthly uptime
Security	OWASP ASVS L2 compliant
Test coverage	≥ 80% line coverage on src/server
3. Customer Segments
Individual Students — self-paced learning, mock tests, analytics, AI tutor.
Coaching Institutes — branded tenant, batches, teachers, assignments, institute-wide analytics, white-label.
Schools — class-level cohorts, teacher-led assignments, parent reports.
Enterprises — bulk licensing, SSO-ready, custom contracts, dedicated support.
4. Scope (MVP → v1 → v2)
v1.0 (this build)
Auth + RBAC + multi-tenancy
Question bank with review workflow
Exam engine (real-exam UI, scheduled tests, PYQ)
Practice engine (subject/chapter/topic/concept/adaptive)
Analytics with rank prediction
AI tutor, planner, recommendations, explanations
Doubt management
Student / Teacher / Institute / Super Admin dashboards
Subscription system (Free, Premium, Premium Plus, Enterprise)
Notifications (in-app + email)
Full DevOps + deployment
v1.1 (planned, not built)
Razorpay + Stripe live integration
Parent dashboard
Live class / video module
v2.0 (planned)
CUET, BITSAT, NDA, Olympiad syllabi
Mobile apps (React Native)
5. Build Order (23 Segments)
Documented in PROJECT_STATE.md. Each segment is independently verifiable and committed as a unit.

6. Team Roles (assumed)
Principal Architect — overall design, code review gatekeeper
Backend Lead — src/server, API, services, repositories
Frontend Lead — src/app, UI components, dashboards
DB Architect — Oracle schema, migrations, performance
DevOps Lead — Docker, CI/CD, observability, deploy
Security Lead — Auth.js, RBAC, OWASP compliance
QA Lead — Jest, Playwright, load tests
Docs Lead — READMEs, architecture docs
7. Definition of Done (per segment)
All files compile (TypeScript tsc --noEmit passes)
All new endpoints have at least one integration test
No TODOs, no placeholders, no pseudo-code
PROJECT_STATE.md updated
ER / API changes reflected in docs
Security-sensitive changes flagged for review
8. Risks & Mitigations
See PROJECT_STATE.md → Risks.