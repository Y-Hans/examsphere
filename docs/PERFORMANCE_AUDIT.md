# ExamSphere — Performance Audit

## 1. Database Queries

### N+1 Queries

#### Issue 1: Exam Grading (HIGH)
**Location:** `src/modules/exam-engine/services/exam.service.ts` → `submitTest()`
**Problem:** Iterates `sessionData.responses` and calls `sessionData.template.sections.find()` inside the loop.
**Fix Applied:** Pre-built `Map<sectionId, section>` before the loop.
```typescript
const sectionMap = new Map(sessionData.template.sections.map(s => [s.id, s]));
// In loop:
const section = sectionMap.get(response.sectionId);
```

#### Issue 2: Weak Topic Updates (HIGH)
**Location:** `src/modules/analytics/services/analytics.service.ts` → `updateWeakTopics()`
**Problem:** Queries `prisma.weakTopic.findFirst()` for each topic in a loop.
**Fix Applied:** Batch query all topics at once.
```typescript
const existingTopics = await prisma.weakTopic.findMany({
  where: { userId, topicId: { in: topicIds } }
});
const topicMap = new Map(existingTopics.map(t => [t.topicId, t]));
```

#### Issue 3: Question List (MEDIUM)
**Location:** `src/modules/question-bank/repositories/question.repository.ts` → `listQuestions()`
**Problem:** Fetches all versions for each question without limiting to the latest.
**Fix Applied:** Added `take: 1` and `orderBy: { versionNo: 'desc' }` to `versions` include.

### Slow Queries

#### Issue 4: Question Search (MEDIUM)
**Location:** `question.repository.ts` → `listQuestions()`
**Problem:** `OR: [{ versions: { some: { statement: { contains: search, insensitive: true } } } }]` performs a full table scan on `CLOB` column.
**Fix:** Documented recommendation for Oracle Text index:
```sql
CREATE INDEX idx_qv_statement_ctx ON question_versions(statement) INDEXTYPE IS CTXSYS.CONTEXT;
```
For v1, the `contains` search is acceptable for < 100K questions.

#### Issue 5: Analytics Dashboard (MEDIUM)
**Location:** `analytics.repository.ts` → `getOverallStats()`
**Problem:** Fetches ALL test and practice responses for a user to compute aggregate stats.
**Fix Applied:** Changed to use `aggregate` queries instead of fetching all records:
```typescript
const [testStats, practiceStats] = await Promise.all([
  prisma.testResponse.aggregate({
    where: { session: { userId } },
    _count: true,
    _sum: { isCorrect: true },
    _avg: { timeSpentSec: true }
  }),
  // Same for practice
]);
```

## 2. API Calls

#### Issue 6: AI Provider Lazy Loading (MEDIUM)
**Location:** `provider-registry.ts`
**Problem:** All 5 AI adapters imported statically, increasing bundle size.
**Fix Applied:** Changed to dynamic `import()`:
```typescript
async getProvider(name?: string): Promise<LlmProvider> {
  this.initialize();
  const providerName = name || this.preferredProvider;
  if (!this.providers.has(providerName)) {
    const adapter = await this.loadAdapter(providerName);
    this.providers.set(providerName, adapter);
  }
  return this.providers.get(providerName)!;
}
```

## 3. Middleware

#### Issue 7: Auth Call on Every Request (LOW)
**Location:** `src/middleware.ts`
**Problem:** `auth()` is called on every request, which decodes JWT on every navigation.
**Fix:** This is necessary for route protection. Auth.js v5 caches the JWT in the cookie, so no DB call is made. Acceptable.

## 4. React Components

#### Issue 8: Notification Bell Polling (MEDIUM)
**Location:** `notification-bell.tsx`
**Problem:** Polls every 60 seconds indefinitely, even when tab is inactive.
**Fix Applied:**
- Changed interval to 120 seconds.
- Added `document.visibilityState` check — only polls when tab is visible.
- Added exponential backoff on error (max 5 min interval).

#### Issue 9: Exam Interface Re-renders (LOW)
**Location:** `src/app/(app)/student/test/[sessionId]/page.tsx`
**Problem:** Zustand store updates cause full re-render of the exam page on every response change.
**Fix:** Zustand is optimized for this. The component uses selector hooks (`useExamStore(s => s.timeRemaining)`) which prevents unnecessary re-renders. Acceptable.

## 5. Server Actions

#### Issue 10: Save Response Auto-save (MEDIUM)
**Location:** Exam UI calls `saveResponseAction` on every option selection.
**Problem:** Creates a Server Action invocation per click. Under poor network, requests queue up.
**Fix Applied:** Added debounce (2 seconds) in the exam UI before calling the Server Action. Also added `AbortController` to cancel in-flight requests.

## 6. Caching

#### Issue 11: No Server-Side Caching (MEDIUM)
**Location:** Dashboard data queries.
**Problem:** Every dashboard load hits the database for stats.
**Fix Applied:** Added `unstable_cache` for read-heavy dashboard data:
```typescript
import { unstable_cache } from 'next/cache';

export const getDashboardData = unstable_cache(
  async (userId: string, examId?: string) => { ... },
  ['dashboard-data'],
  { revalidate: 60, tags: [`dashboard-${userId}`] }
);
```

## 7. Bundle Size

#### Issue 12: Large Dependencies (LOW)
- `recharts`: ~400KB minified. Only used in dashboard pages. Acceptable (loaded only on dashboard route).
- `katex`: ~270KB. Used in exam and AI tutor. Acceptable (loaded only on those routes).
- `framer-motion`: ~100KB. Used sparingly. Acceptable.
- `@aws-sdk/client-s3`: ~200KB. Only loaded when `STORAGE_DRIVER=oracle`. Tree-shakeable.

**Recommendation:** Run `pnpm build && npx @next/bundle-analyzer` to verify bundle sizes.

## 8. Memory Leaks

#### Issue 13: Feature Flag Cache (LOW)
**Location:** `feature-flag.service.ts`
**Problem:** In-memory `Map` cache grows indefinitely.
**Fix Applied:** Added cache invalidation on `setOverride()` and TTL (5 min) via timestamp check.

#### Issue 14: EventBus Listeners (LOW)
**Location:** `event-bus.ts`
**Problem:** `setMaxListeners(50)` prevents warnings but doesn't prevent memory leaks if modules are re-initialized.
**Fix:** In serverless, each cold start creates a new `EventBus` instance. No leak. In self-hosted, `initAnalyticsProcessor()` should only be called once (guarded by `processorsInitialized` flag). Verified.

## 9. Hydration Issues

#### Issue 15: Server/Client Time Mismatch (LOW)
**Location:** Exam timer displays server-provided start time.
**Problem:** Server and client clocks may differ, causing timer to jump.
**Fix Applied:** Timer uses `timeRemaining` (seconds) from Zustand store, initialized from server data, decremented client-side. No server time comparison. No hydration mismatch.

## Summary

| Issue | Severity | Status |
|-------|----------|--------|
| N+1 in exam grading | HIGH | ✅ Fixed |
| N+1 in weak topics | HIGH | ✅ Fixed |
| Question version over-fetch | MEDIUM | ✅ Fixed |
| Question search full scan | MEDIUM | ⚠️ Documented |
| Analytics over-fetch | MEDIUM | ✅ Fixed |
| AI adapter bundle | MEDIUM | ✅ Fixed |
| Notification polling | MEDIUM | ✅ Fixed |
| Auto-save flooding | MEDIUM | ✅ Fixed |
| No server caching | MEDIUM | ✅ Fixed |
| Feature flag cache leak | LOW | ✅ Fixed |
