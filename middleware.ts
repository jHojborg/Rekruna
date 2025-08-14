import { NextRequest, NextResponse } from 'next/server'

// Server-side guard for protected routes like /dashboard
// Tjekker Supabase auth cookies (sb-access-token/sb-refresh-token) som indikator.
// Hvis ingen cookies → redirect til /login på serversiden.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Kun beskyt /dashboard (og evt. undertinge)
  if (pathname.startsWith('/dashboard')) {
    const hasAccess = req.cookies.has('sb-access-token') || req.cookies.has('sb-refresh-token')
    if (!hasAccess) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}


