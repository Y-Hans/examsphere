ExamSphere — Module Design
Module Catalogue
Module	Responsibility	Public Surface (via index.ts)
identity	Users, auth sessions, profile, onboarding	AuthService, UserService, OnboardingService, SessionService
tenant	Tenant CRUD, branding, config, strategies	TenantService, TenantStrategy, BrandingService
rbac	Roles, permissions, role hierarchy	PermissionService, RoleService, rbacChecks
question-bank	Questions, versions, syllabus tree, review	QuestionService, SyllabusService, ReviewService
exam-engine	Test templates, sessions, responses, grading	TestService, TestSessionService, GradingService
practice-engine	Practice sessions, adaptive logic, feedback	PracticeService, AdaptiveEngine
analytics	Snapshots, rank prediction, dashboards	AnalyticsService, RankPredictor, ReportService
ai	Provider abstraction, tutor, planner, gen tests	LlmOrchestrator, AiTutorService, AiPlannerService, AiTestGenerator
doubt	Doubt threads, teacher responses	DoubtService, DoubtResponseService
subscription	Plans, subscriptions, feature flags, usage	SubscriptionService, UsageService, PlanService
notification	In-app, email digests, preferences	NotificationService, EmailService
institute	Batches, teachers, attendance, assignments	InstituteService, BatchService, AssignmentService, AttendanceService
content	Study material, notes, video metadata	ContentService, ContentVersioningService
billing	Payment gateway abstraction, invoices	BillingService, InvoiceService
Module Anatomy (canonical example: question-bank)
src/modules/question-bank/
├─ actions/
│ ├─ create-question.action.ts
│ ├─ update-question.action.ts
│ ├─ submit-review.action.ts
│ └─ list-questions.action.ts
├─ api/
│ └─ upload-question-image/route.ts # Route Handler (multipart)
├─ components/
│ ├─ question-editor.tsx
│ ├─ question-list.tsx
│ ├─ question-preview.tsx
│ ├─ syllabus-tree.tsx
│ └─ review-queue.tsx
├─ hooks/
│ ├─ use-questions.ts
│ └─ use-syllabus-tree.ts
├─ stores/
│ └─ question-editor-store.ts
├─ dto/
│ ├─ create-question.dto.ts
│ ├─ update-question.dto.ts
│ ├─ question-output.dto.ts
│ └─ review-action.dto.ts
├─ domain/
│ ├─ entities/
│ │ ├─ question.entity.ts
│ │ ├─ question-version.entity.ts
│ │ └─ syllabus-node.entity.ts
│ ├─ value-objects/
│ │ ├─ difficulty.ts
│ │ ├─ question-type.ts
│ │ └─ pyq-metadata.ts
│ ├─ events/
│ │ ├─ question-created.event.ts
│ │ ├─ question-published.event.ts
│ │ └─ question-flagged.event.ts
│ └─ exceptions/
│ └─ question-exceptions.ts
├─ services/
│ ├─ question.service.ts
│ ├─ syllabus.service.ts
│ ├─ review.service.ts
│ └─ question-versioning.service.ts
├─ repositories/
│ ├─ question.repository.ts # interface
│ ├─ prisma-question.repository.ts # impl
│ ├─ syllabus.repository.ts
│ └─ prisma-syllabus.repository.ts
├─ lib/
│ ├─ question-mapper.ts
│ └─ search-filter-builder.ts
├─ constants.ts
├─ index.ts
└─ README.md


## Inter-Module Communication

- **Synchronous (preferred for reads):** call exported service from another module's barrel.
- **Asynchronous (preferred for cross-cutting writes):** emit domain event via `EventBus`; consumers subscribe in their own module.
- **Forbidden:** direct repository access across module boundaries; direct Prisma calls from services of other modules.

## Domain Event Examples

| Event | Emitted By | Consumed By |
|-------|------------|-------------|
| `QuestionPublished` | question-bank | analytics (recompute weights), notification (notify subscribed teachers) |
| `TestSessionSubmitted` | exam-engine | analytics (snapshot), notification (email report), subscription (usage+) |
| `DoubtResolved` | doubt | notification (notify student), analytics (response time) |
| `SubscriptionUpgraded` | subscription | tenant (unlock features), notification (receipt) |
| `TenantCreated` | tenant | identity (create owner user), subscription (init Free plan) |
| `WeakTopicDetected` | analytics | ai (queue recommendation), practice (queue adaptive set) |

## Module Maturity Checklist

Each module ships only when:
- [ ] Public barrel exports only services + DTOs
- [ ] All repositories interface-backed
- [ ] Domain layer has zero framework imports
- [ ] At least one integration test per service
- [ ] README.md documents public API
- [ ] No TODO / placeholder code