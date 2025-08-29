import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Basic authentication middleware to protect the site during development
// This will prompt for username/password on all pages except API routes and static files
export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get('authorization')
  
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')
    
    // ↓ HER sætter du dit username og password
    if (user === 'bluebanana' && pwd === '/Z7Y4#D@4UQP$=u2//') {
      return NextResponse.next()
    }
  }

  // Hvis ikke logget ind, vis login-prompt
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


