ExamSphere — Conceptual ER Diagram
1. Tenant & Identity
┌──────────────┐ 1..* ┌──────────────┐
│ tenants │────────────│ users │
│──────────────│ │──────────────│
│ id (PK) │ │ id (PK) │
│ name │ │ tenant_id FK │
│ subdomain UQ │ │ email UQ │
│ type │ │ password_h │
│ status │ │ status │
│ branding JSON│ │ last_login │
│ created_at │ │ created_at │
│ deleted_at │ │ deleted_at │
└──────┬───────┘ └──────┬───────┘
│ │
│ 1..* │ 1..*
▼ ▼
┌──────────────┐ ┌──────────────┐
│ tenant_ │ │ user_roles │
│ settings │ │──────────────│
└──────────────┘ │ user_id FK │
│ role_id FK │
└──────────────┘
│
│
┌──────▼───────┐
│ roles │
│──────────────│
│ id (PK) │
│ tenant_id FK │
│ name │
│ scope │
└──────┬───────┘
│ 1..*
┌──────▼───────┐
│ role_perms │
│──────────────│
│ role_id FK │
│ permission_id│
└──────┬───────┘
│
┌──────▼───────┐
│ permissions │
│──────────────│
│ id (PK) │
│ resource │
│ action │
│ constraints │
└──────────────┘

text


## 2. Syllabus Hierarchy

exams (1) ─── subjects (1) ─── units (1) ─── chapters (1) ─── topics (1) ─── concepts (1..*)
│ │ │ │ │ │
│ │ │ │ │ │
└─ exam_targets └──────────────┴───────────────┴────────────────┴──────────────┘
(user_id, (FK on every level)
exam_id)

text


- `exams`: JEE_MAIN, JEE_ADVANCED, NEET, …
- `subjects`: Physics, Chemistry, Mathematics, Biology
- `units → chapters → topics → concepts`: dynamic, tenant-overridable via `tenant_id` (NULL = global).

## 3. Question Bank

┌────────────────┐
│ questions │
│────────────────│
│ id (PK) │
│ tenant_id FK │
│ type │ (SC, MCQ, NUMERICAL, ASSERTION, MATRIX, COMPREHENSION)
│ status │ (DRAFT, IN_REVIEW, PUBLISHED, ARCHIVED, FLAGGED)
│ difficulty │ (EASY, MEDIUM, HARD, VERY_HARD)
│ source_type │ (PYQ, ORIGINAL, INSTITUTE, AI)
│ exam_id FK │
│ subject_id FK │
│ created_by FK │
│ current_version│
│ created_at │
│ updated_at │
│ deleted_at │
└──────┬─────────┘
│ 1..*
▼
┌────────────────────┐ ┌──────────────────┐
│ question_versions │ │ question_topics │
│────────────────────│ │──────────────────│
│ id (PK) │ │ question_id FK │
│ question_id FK │ │ topic_id FK │
│ version_no │ └──────────────────┘
│ statement (CLOB) │
│ option_a,b,c,d │ ┌──────────────────┐
│ correct_options[] │─────│ question_tags │
│ solution (CLOB) │ │ question_id FK │
│ hint_level_1..3 │ │ tag_id FK │
│ marks_correct │ └──────────────────┘
│ marks_wrong │
│ pyq_year │ ┌──────────────────┐
│ pyq_exam_session │ │ question_images │
│ pyq_shift │ │ question_id FK │
│ est_time_sec │ │ url │
│ language │ │ purpose (STATEMENT/OPTION/SOLUTION)
│ change_summary │ └──────────────────┘
│ created_by FK │
│ created_at │ ┌──────────────────────┐
└────────────────────┘ │ question_review_logs │
│──────────────────────│
│ id (PK) │
│ question_id FK │
│ reviewer_id FK │
│ action (APPROVE/REJECT/REQUEST_CHANGES)
│ comment │
│ created_at │
└──────────────────────┘

text


## 4. Exam Engine

┌────────────────────┐ ┌──────────────────────┐
│ test_templates │────────<│ test_sections │
│────────────────────│ │──────────────────────│
│ id (PK) │ │ id (PK) │
│ tenant_id FK │ │ template_id FK │
│ name │ │ subject_id FK │
│ type (CHAPTER/...) │ │ name │
│ exam_id FK │ │ question_count │
│ configuration JSON │ │ marks_correct │
│ duration_min │ │ marks_wrong │
│ total_marks │ │ duration_min │
│ scheduled_start │ │ order_no │
│ scheduled_end │ └──────────────────────┘
│ status │
│ created_by FK │ ┌──────────────────────┐
└─────────┬──────────┘ │ test_section_qs │
│ 1..* │──────────────────────│
▼ │ section_id FK │
┌────────────────────┐ │ question_id FK │
│ test_sessions │ │ order_no │
│────────────────────│ └──────────────────────┘
│ id (PK) │
│ template_id FK │
│ user_id FK │
│ tenant_id FK │
│ status (NOT_STARTED/IN_PROGRESS/SUBMITTED/ABORTED/EXPIRED)
│ started_at │ ┌──────────────────────┐
│ submitted_at │────────<│ test_responses │
│ time_spent_sec │ │──────────────────────│
│ total_score │ │ id (PK) │
│ rank_estimate │ │ session_id FK │
│ percentile_estimate│ │ question_id FK │
│ device_info JSON │ │ section_id FK │
│ ip_address │ │ response_value │
│ user_agent │ │ status (NOT_VISITED/ │
│ fullscreen_violations│ │ VISITED/ANSWERED/ │
│ tab_switches │ │ MARKED_REVIEW/ │
│ window_blurs │ │ ANSWERED_REVIEW) │
└────────────────────┘ │ time_spent_sec │
│ is_correct │
│ marks_awarded │
│ visited_at │
│ answered_at │
└──────────────────────┘

text


## 5. Practice & Analytics (condensed)

practice_sessions (id, user_id, tenant_id, type, target_topic_id, started_at, ended_at)
practice_responses (id, session_id, question_id, response, is_correct, time_spent_sec, hint_used, explanation_viewed)

analytics_snapshots (id, user_id, tenant_id, period_type, period_start, period_end, metrics JSON)
weak_topics (id, user_id, tenant_id, topic_id, weakness_score, last_assessed_at)
rank_predictions (id, user_id, exam_id, predicted_rank, predicted_percentile, computed_at, model_version)

text


## 6. AI, Doubt, Subscription, Notification

ai_conversations (id, user_id, tenant_id, type, created_at)
ai_messages (id, conversation_id, role, content, provider, tokens_in, tokens_out, cost_inr, latency_ms)
ai_recommendations (id, user_id, tenant_id, type, payload JSON, status, expires_at)
ai_generated_tests (id, user_id, tenant_id, template_id FK, prompt, model, created_at)

doubts (id, user_id, tenant_id, question_id NULL, title, body, status, priority, created_at)
doubt_attachments (id, doubt_id, url, mime_type)
doubt_responses (id, doubt_id, author_id, body, created_at)
doubt_status_history (id, doubt_id, from_status, to_status, changed_by, changed_at)

plans (id, code, name, price_inr, billing_cycle, features JSON, is_active)
subscriptions (id, user_id, tenant_id, plan_id, status, started_at, ends_at, cancelled_at)
usage_records (id, user_id, tenant_id, metric, period, count, limit, overage)
feature_flags (id, key, default_enabled, description)
tenant_feature_overrides (tenant_id, flag_id, enabled)

notifications (id, user_id, tenant_id, type, title, body, payload JSON, channel, status, read_at, created_at)
notification_preferences (user_id, channel, type, enabled)

audit_logs (id, tenant_id, actor_id, action, resource_type, resource_id, before JSON, after JSON, ip, user_agent, created_at)
domain_events (id, tenant_id, type, payload JSON, occurred_at, processed_at)

text


## 7. Cardinality Summary

- Tenant → Users (1:N)
- User → Roles (N:M via user_roles)
- Role → Permissions (N:M)
- Exam → Subjects (1:N)
- Subject → Units → Chapters → Topics → Concepts (1:N chain)
- Question → Versions (1:N), Topics (N:M), Tags (N:M), Images (1:N), Review Logs (1:N)
- TestTemplate → Sections → Section Questions (1:N chains)
- TestSession → Responses (1:N)
- User → Subscriptions (1:N), Analytics Snapshots (1:N), Doubts (1:N)

## 8. Partitioning Plan

| Table | Strategy |
|-------|----------|
| `test_responses` | RANGE on `answered_at` (monthly) |
| `practice_responses` | RANGE on `created_at` (monthly) |
| `analytics_snapshots` | LIST on `tenant_id` |
| `audit_logs` | RANGE on `created_at` (monthly) |
| `domain_events` | RANGE on `occurred_at` (daily) |
| `notifications` | LIST on `tenant_id` + RANGE on `created_at` (composite) |

## 9. Materialized Views

| MV | Refresh | Used By |
|----|---------|---------|
| `mv_user_topic_accuracy` | ON COMMIT | Analytics dashboards |
| `mv_question_usage_stats` | EVERY 15 MIN | Question bank dashboard |
| `mv_tenant_daily_active` | EVERY 1 HOUR | Super admin |
| `mv_rank_prediction_basis` | EVERY 6 HOURS | Rank predictor |
1.