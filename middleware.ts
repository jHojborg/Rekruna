import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Basic authentication middleware to protect the site during development
// This will prompt for username/password on all pages except API routes and static files
// 
// IMPORTANT: Set these environment variables:
// - BASIC_AUTH_USER (username for basic auth)
// - BASIC_AUTH_PASSWORD (password for basic auth)
// - BASIC_AUTH_ENABLED (set to "true" to enable, "false" to disable)
export function middleware(request: NextRequest) {
  // Skip authentication for API routes completely - they handle their own auth
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // Check if basic auth is enabled (useful for disabling in production)
  const authEnabled = process.env.BASIC_AUTH_ENABLED === 'true'
  
  if (!authEnabled) {
    // Basic auth is disabled - allow access
    return NextResponse.next()
  }
  
  // Get credentials from environment variables
  const expectedUser = process.env.BASIC_AUTH_USER
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD
  
  // If env variables are not set, log error and deny access
  if (!expectedUser || !expectedPassword) {
    console.error('❌ BASIC_AUTH_ENABLED is true but BASIC_AUTH_USER or BASIC_AUTH_PASSWORD is not set!')
    return new NextResponse('Authentication configuration error', {
      status: 500,
    })
  }
  
  const basicAuth = request.headers.get('authorization')
  
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')
    
    // Compare with environment variables
    if (user === expectedUser && pwd === expectedPassword) {
      return NextResponse.next()
    }
  }

  // If not logged in or wrong credentials, show login prompt
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}


