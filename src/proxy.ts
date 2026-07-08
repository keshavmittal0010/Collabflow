import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'

// Protected page routes (frontend)
const PROTECTED_PAGES = ['/workspace', '/dashboard', '/settings', '/profile']

// Auth page routes (frontend) - redirect to dashboard if already logged in
const AUTH_PAGES = ['/login', '/register', '/forgot-password']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets, Next.js internals, and public root/landing assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/register') ||
    pathname.startsWith('/api/auth/refresh') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Get token from Authorization header or cookies
  const authHeader = request.headers.get('Authorization')
  let token: string | null = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else {
    // Standard page transitions / document requests carry cookies automatically
    token = request.cookies.get('accessToken')?.value || null
  }

  let userPayload = null
  if (token) {
    try {
      userPayload = await verifyAccessToken(token)
    } catch (err) {
      // Invalid or expired token, ignore and proceed as unauthenticated
    }
  }

  const isApiRoute = pathname.startsWith('/api')

  // Clone headers to pass user info to API handlers
  const requestHeaders = new Headers(request.headers)
  if (userPayload) {
    requestHeaders.set('x-user-id', userPayload.sub)
    requestHeaders.set('x-user-email', userPayload.email)
    requestHeaders.set('x-user-name', userPayload.name)
  }

  // 1. API Route Protection
  if (isApiRoute) {
    // me route requires auth
    if (pathname === '/api/auth/me') {
      if (!userPayload) {
        return NextResponse.json(
          { success: false, error: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        )
      }
    }
    
    // Future API routes under /api/ (except auth exclusions handled above) will require auth
    const isPublicApi = pathname.startsWith('/api/auth/')
    if (!isPublicApi && !userPayload) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  }

  // 2. Frontend Page Protection
  const isProtectedPage = PROTECTED_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`)
  )
  const isAuthPage = AUTH_PAGES.some((page) => pathname === page)

  if (isProtectedPage && !userPayload) {
    const url = new URL('/login', request.url)
    // Add redirect parameter to redirect back after login
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthPage && userPayload) {
    // If logged in, redirect to workspace or dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  })
}

export const config = {
  matcher: [
    // Apply proxy to all paths except static, image optimization, favicon
    '/((?!_next/static|_next/image|favicon.ico|public/).*)'
  ]
}
