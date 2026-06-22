# ExamSphere — Observability Report

## 1. Health Endpoints

### Implemented Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /api/health` | Full health check (DB connectivity) | `{ status: "healthy", database: "connected", timestamp: "..." }` or `503` |
| `GET /api/ready` | Readiness probe (can accept traffic) | `200` if DB connected, `503` otherwise |
| `GET /api/live` | Liveness probe (process is alive) | `200` always (no DB check) |

### Usage:
- **Kubernetes/Docker:** Use `/api/live` for liveness probe, `/api/ready` for readiness probe.
- **Vercel:** No health check needed (platform handles it). Endpoint available for external monitoring.
- **Load Balancer:** Use `/api/ready` to determine if instance can accept traffic.

## 2. Structured Logging

### Implementation: `pino` (JSON format)

Every log entry includes:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "service": "examsphere-api",
  "env": "production",
  "module": "ExamService",
  "tenantId": "uuid-here",
  "userId": "uuid-here",
  "requestId": "req-uuid-here",
  "correlationId": "corr-uuid-here",
  "message": "Test session submitted"
}
```

### Log Levels:
- `trace`: Prisma query logging (dev only)
- `debug`: Domain event emission, cache hits/misses
- `info`: User actions (login, test start, test submit)
- `warn`: Rate limit hits, AI fallbacks, deprecated API usage
- `error`: Failed DB operations, AI failures, webhook failures
- `fatal`: Unhandled exceptions

### Redaction:
All PII and secrets are redacted:
- `req.headers.authorization`
- `req.headers.cookie`
- `*.password`
- `*.passwordHash`
- `*.token`

## 3. Request IDs & Correlation IDs

### Implementation: `src/server/shared/request-context.ts`

Every incoming request is assigned:
- `requestId`: Unique per HTTP request (UUID v4)
- `correlationId`: Inherited from `x-correlation-id` header or generated if absent

These are:
1. Generated in Edge Middleware.
2. Passed to Server Actions via headers.
3. Stored in `RequestContext` (AsyncLocalStorage).
4. Included in every log entry.
5. Returned in response headers (`x-request-id`).

## 4. Tenant & User IDs in Logs

### Implementation:
`TenantContext` and `UserContext` (AsyncLocalStorage) are populated in `withContext()` helper. The `pino` logger automatically includes `tenantId` and `userId` in every log entry by reading from these contexts.

## 5. Sentry Integration

### Files Generated:
- `sentry.client.config.ts` — Client-side error capturing
- `sentry.server.config.ts` — Server-side error capturing
- `sentry.edge.config.ts` — Edge middleware error capturing

### Features:
- Automatic unhandled exception capture
- Release tracking (Git commit SHA)
- PII scrubbing (emails, passwords)
- Performance monitoring (transaction tracing)
- Source map upload for readable stack traces

## 6. OpenTelemetry Integration

### Files Generated:
- `instrumentation.ts` — Next.js instrumentation hook
- `OTEL_SETUP.md` — Setup guide

### Features:
- Auto-instrumentation for HTTP requests
- Custom spans for DB queries (via Prisma tracing)
- Custom spans for AI provider calls
- Export to OTLP-compatible backend (Jaeger, Honeycomb, Datadog)
- Distributed tracing across Edge → Server Action → DB

## 7. Metrics

### Custom Metrics (emitted via OpenTelemetry):
| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `examsphere_http_requests_total` | Counter | method, route, status | Total HTTP requests |
| `examsphere_http_request_duration_seconds` | Histogram | method, route | Request latency |
| `examsphere_db_query_duration_seconds` | Histogram | model, operation | DB query latency |
| `examsphere_ai_tokens_used_total` | Counter | provider, user_id | AI token consumption |
| `examsphere_ai_cost_inr_total` | Counter | provider, user_id | AI cost in INR |
| `examsphere_test_sessions_active` | Gauge | tenant_id | Active test sessions |
| `examsphere_event_bus_queue_depth` | Gauge | type | Unprocessed domain events |

## 8. Alerting Recommendations

| Alert | Condition | Severity |
|-------|-----------|----------|
| DB connection failures | `examsphere_http_requests_total{status=~"5xx"}` > 10 in 1 min | Critical |
| AI cost spike | `examsphere_ai_cost_inr_total` rate > ₹100/min | High |
| Event bus backlog | `examsphere_event_bus_queue_depth` > 1000 | High |
| High error rate | Error rate > 1% over 5 min | High |
| Slow queries | `examsphere_db_query_duration_seconds` p95 > 1s | Medium |
