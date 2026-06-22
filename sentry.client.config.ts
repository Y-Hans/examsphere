import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  beforeSend(event) {
    // Scrub PII
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});
