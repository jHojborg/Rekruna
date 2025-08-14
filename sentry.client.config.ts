// Sentry browser (client) configuration. Loaded by @sentry/nextjs automatically when present.
// Aktiveres kun hvis SENTRY_DSN er sat.
import * as Sentry from '@sentry/nextjs'

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const debug = process.env.NEXT_PUBLIC_SENTRY_DEBUG === '1'
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    replaysSessionSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE ?? '0.0'),
    replaysOnErrorSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ?? '0.0'),
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'production',
    debug,
  })
}


