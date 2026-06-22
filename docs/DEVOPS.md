ExamSphere — DevOps, CI/CD, and Operations
1. Deployment Architecture
ExamSphere utilizes a hybrid deployment strategy optimized for Next.js and Oracle Cloud:

Frontend & API (Next.js): Deployed on Vercel for global Edge distribution, automatic HTTPS, and Serverless scaling.
Database: Oracle Autonomous Database (ATP/ADW) hosted on Oracle Cloud Infrastructure (OCI).
Storage: Oracle Object Storage for user uploads (images, attachments).
AI: External APIs (OpenAI, Gemini, Anthropic, etc.).
2. CI/CD Pipeline
Workflow: ci.yml
Triggers on all PRs and pushes to main/develop.

Checkout & Setup pnpm/Node 20.
Install dependencies (--frozen-lockfile).
Generate Prisma Client.
Lint (ESLint).
Typecheck (tsc --noEmit).
Unit Tests (Jest with Coverage).
Build (Next.js production build).
Workflow: deploy.yml
Triggers on push to main.

Uses Vercel CLI to pull production environment variables.
Builds artifacts locally using Vercel's build system.
Deploys prebuilt artifacts to production.
Rollback: Handled via Vercel Dashboard instant rollback feature.
3. Docker Strategy
While Vercel is the primary deployment target, a production-ready Dockerfile is provided for self-hosting or enterprise on-premise deployments.

Multi-stage Build: Isolates dependencies and build artifacts to minimize final image size.
Non-root User: Runs the Next.js server as a non-root user for security.
Oracle Wallet: The docker-entrypoint.sh script decodes the ORACLE_WALLET_BASE64 environment variable into a local directory and sets TNS_ADMIN automatically.
4. Backup Strategy
Database Backups
Oracle Autonomous Database performs automatic backups every 24 hours.
Retention policy: 30 days of automatic backups.
Manual backups can be triggered via OCI Console before major migrations.
Long-term Retention (PITR): Enabled for point-in-time recovery up to 60 days.
Application Code
All code is version-controlled on GitHub.
Docker images are tagged with Git commit SHA for traceability.
5. Disaster Recovery (DR)
RPO (Recovery Point Objective): 24 hours (based on daily automated DB backups).
RTO (Recovery Time Objective): 4 hours.
Procedure:
Provision new Oracle ADW instance from latest backup.
Update DATABASE_URL in Vercel Environment Variables.
Update Oracle Wallet environment variables if credentials changed.
Trigger redeployment on Vercel.
Run prisma migrate deploy to ensure schema consistency.
Verify application health via /api/health endpoint.
6. Monitoring & Observability
Vercel Analytics: Real User Monitoring (RUM) for Core Web Vitals.
Vercel Logs: Structured JSON logs (pino) captured automatically.
Database Metrics: OCI Cloud Monitoring for DB CPU, storage, and connections.
Alerts: Configured on Vercel for deployment failures and high error rates.
7. Cron Jobs (Vercel Cron)
Configured in vercel.json:

0 * * * * (/api/v1/cron/refresh-analytics): Refreshes materialized views and calculates platform metrics.
*/15 * * * * (/api/v1/cron/scheduled-tests): Activates scheduled mock tests when their start time arrives.