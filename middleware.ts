import { NextRequest, NextResponse } from 'next/server'

// Midlertidigt: bypass serverside guard.
// Årsag: Vores nuværende Supabase-klient bruger localStorage (ingen auth-cookies),
// så en cookie-baseret middleware kan ikke se login-status og laver redirect-loop.
// Vi bevarer filen for senere opgradering til cookie-baseret SSR via @supabase/ssr.

export function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}


