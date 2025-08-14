import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const err = new Error('Sentry: server testfejl (captured)')
    Sentry.captureException(err)
    // Sørg for at eventet bliver sendt, inden funktionen afsluttes (vigtigt i serverless)
    await Sentry.flush(2000)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'unknown' }, { status: 500 })
  }
}


