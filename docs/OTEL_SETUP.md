# OpenTelemetry Setup Guide

## Overview
ExamSphere uses OpenTelemetry (OTEL) for distributed tracing and performance monitoring. The instrumentation is initialized via Next.js's `instrumentation.ts` hook, which runs once on server startup.

## Prerequisites
1. An OTLP-compatible backend (e.g., Jaeger, Honeycomb, Datadog, Grafana Tempo).
2. Environment variables configured (see `.env.example`).

## Environment Variables
```env
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-otlp-backend.com/v1/traces
OTEL_SERVICE_NAME=examsphere-api
```

## How It Works

### 1. Instrumentation Hook (`instrumentation.ts`)
Next.js calls `register()` once when the server starts. This:
- Initializes the OpenTelemetry SDK
- Configures the OTLP exporter
- Registers auto-instrumentations for `http`, `fetch`, `next`, and `prisma`
- Sets up custom span enrichment with `tenantId` and `userId`

### 2. Request Tracing
Every HTTP request automatically gets a span:
```
GET /student/dashboard
  ├── middleware (2ms)
  ├── auth() (15ms)
  ├── getDashboardDataAction (120ms)
  │   ├── prisma.testResponse.aggregate (45ms)
  │   ├── prisma.practiceResponse.aggregate (30ms)
  │   └── prisma.weakTopic.findMany (25ms)
  └── render (20ms)
```

### 3. AI Call Tracing
Every AI provider call gets a custom span:
```
sendTutorMessageAction (3500ms)
  ├── prisma.aiConversation.findUnique (15ms)
  ├── prisma.aiMessage.aggregate (10ms)
  ├── openai.generate (3200ms)
  │   ├── fetch POST https://api.openai.com/v1/chat/completions (3180ms)
  │   └── calculateCost (1ms)
  ├── prisma.aiMessage.create (20ms)
  └── prisma.aiMessage.create (15ms)
```

### 4. Distributed Tracing
The Edge middleware propagates trace context via `traceparent` header. Server Actions inherit the trace context, allowing end-to-end tracing from browser → Edge → Server Action → DB → AI provider.

## Local Development

### Option 1: Jaeger (Docker)
```bash
docker run -d --name jaeger -p 16686:16686 -p 4318:4318 jaegertracing/all-in-one:latest
```
Set `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces`

### Option 2: Console Exporter (for debugging)
Set `OTEL_EXPORTER_OTLP_ENDPOINT=` (empty) to log spans to console.

## Production Setup

### Vercel
1. Set `OTEL_EXPORTER_OTLP_ENDPOINT` in Vercel env vars.
2. Set `OTEL_SERVICE_NAME=examsphere-api`.
3. Vercel automatically propagates trace context.

### Self-Hosted (Docker)
1. Set env vars in `docker-compose.yml`.
2. Ensure the OTLP backend is reachable from the container network.

## Verification
1. Start the app with OTEL configured.
2. Make a request to any endpoint.
3. Check the tracing backend for the trace.
4. Verify spans include `tenantId` and `userId` attributes.
