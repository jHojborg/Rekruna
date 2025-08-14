import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const hasDsn = Boolean(process.env.SENTRY_DSN)
    const clientBefore = (Sentry.getCurrentHub && Sentry.getCurrentHub().getClient()) ? true : false
    console.log(`[sentry-test] hasDsn=${hasDsn} clientBefore=${clientBefore}`)

    // Hvis klienten ikke er initialiseret (for en sikkerheds skyld), initialisér her
    if (hasDsn && !clientBefore) {
      Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1') })
    }

    const err = new Error('Sentry: server testfejl (captured)')
    Sentry.captureException(err)
    const flushed = await Sentry.flush(3000)
    const clientAfter = (Sentry.getCurrentHub && Sentry.getCurrentHub().getClient()) ? true : false
    console.log(`[sentry-test] flushed=${flushed} clientAfter=${clientAfter}`)
    return NextResponse.json({ ok: true, hasDsn, clientBefore, clientAfter, flushed })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'unknown' }, { status: 500 })
  }
}


