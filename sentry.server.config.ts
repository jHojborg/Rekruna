// Sentry server configuration. Loaded by @sentry/nextjs automatically when present.
// Aktiveres kun hvis SENTRY_DSN er sat.
import * as Sentry from '@sentry/nextjs'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'production',
  })
}


