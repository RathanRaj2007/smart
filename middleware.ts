import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAppSession } from './lib/auth'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  
  // We need to pass both request and response to getAppSession in middleware
  const session = await getAppSession(request, res)

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isAdminApiRoute = request.nextUrl.pathname.startsWith('/api/admin')
  
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/interview') ||
    request.nextUrl.pathname.startsWith('/report') ||
    request.nextUrl.pathname.startsWith('/settings') ||
    request.nextUrl.pathname.startsWith('/candidate') ||
    request.nextUrl.pathname.startsWith('/suggestions') ||
    request.nextUrl.pathname.startsWith('/knowledge-base') ||
    isAdminRoute || isAdminApiRoute

  if (isProtectedRoute && !session.isLoggedIn) {
    if (isAdminApiRoute) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }
    const redirectRes = NextResponse.redirect(new URL('/login', request.url))
    // Copy Set-Cookie headers from the original response (which may contain session destruction)
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        redirectRes.headers.append(key, value)
      }
    })
    return redirectRes
  }

  if (session.isLoggedIn && (isAdminRoute || isAdminApiRoute) && session.role !== 'ADMIN') {
    if (isAdminApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const targetUrl = session.role === 'CANDIDATE' ? '/candidate' : '/dashboard'
    const redirectRes = NextResponse.redirect(new URL(targetUrl, request.url))
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        redirectRes.headers.append(key, value)
      }
    })
    return redirectRes
  }

  // Candidate restricting from Interviewer-only management routes & unassigned interview setup
  if (session.isLoggedIn && session.role === 'CANDIDATE') {
    const isInterviewWithoutSession =
      request.nextUrl.pathname === '/interview' && !request.nextUrl.searchParams.has('sessionId')

    const isInterviewerOnlyRoute =
      request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/knowledge-base') ||
      request.nextUrl.pathname.startsWith('/suggestions') ||
      isInterviewWithoutSession

    if (isInterviewerOnlyRoute) {
      const redirectRes = NextResponse.redirect(new URL('/candidate', request.url))
      res.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') {
          redirectRes.headers.append(key, value)
        }
      })
      return redirectRes
    }
  }

  if (isAuthRoute && session.isLoggedIn) {
    const targetUrl = session.role === 'ADMIN' ? '/admin' : session.role === 'CANDIDATE' ? '/candidate' : '/dashboard'
    const redirectRes = NextResponse.redirect(new URL(targetUrl, request.url))
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        redirectRes.headers.append(key, value)
      }
    })
    return redirectRes
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|styles|.*\\.png$).*)',
  ],
}
