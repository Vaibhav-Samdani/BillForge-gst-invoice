import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { 
  authRateLimiter, 
  paymentRateLimiter, 
  apiRateLimiter,
  securityHeaders,
  SecurityAuditor,
  SecurityMonitor,
  CSRFProtection
} from "@/lib/utils/security"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Get client IP for rate limiting
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
    request.headers.get('x-real-ip') || 
    request.headers.get('cf-connecting-ip') || // Cloudflare
    request.headers.get('x-client-ip') ||
    'unknown'

  // Security audit for suspicious requests
  const auditResult = SecurityAuditor.auditRequest(request)
  if (!auditResult.passed) {
    SecurityMonitor.logSecurityEvent(
      'suspicious_request',
      'high',
      { issues: auditResult.issues, path: pathname },
      request
    )
    
    // Block obviously malicious requests
    const criticalIssues = auditResult.issues.filter(issue => 
      issue.includes('SQL injection') || 
      issue.includes('XSS attempt') ||
      issue.includes('Suspicious user agent')
    )
    
    if (criticalIssues.length > 0) {
      SecurityMonitor.logSecurityEvent(
        'blocked_malicious_request',
        'critical',
        { issues: criticalIssues, path: pathname, ip: clientIP },
        request
      )
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // Apply rate limiting based on endpoint type
  let rateLimitResult: { allowed: boolean; resetTime?: number; remaining?: number } | null = null

  if (pathname.startsWith('/api/auth/')) {
    rateLimitResult = authRateLimiter.isAllowed(clientIP)
    if (!rateLimitResult.allowed) {
      SecurityMonitor.logSecurityEvent(
        'auth_rate_limit_exceeded',
        'medium',
        { ip: clientIP, path: pathname },
        request
      )
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime!).toISOString()
        }
      })
    }
  } else if (pathname.startsWith('/api/payments/')) {
    rateLimitResult = paymentRateLimiter.isAllowed(clientIP)
    if (!rateLimitResult.allowed) {
      SecurityMonitor.logSecurityEvent(
        'payment_rate_limit_exceeded',
        'high',
        { ip: clientIP, path: pathname },
        request
      )
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime!).toISOString()
        }
      })
    }
  } else if (pathname.startsWith('/api/')) {
    rateLimitResult = apiRateLimiter.isAllowed(clientIP)
    if (!rateLimitResult.allowed) {
      SecurityMonitor.logSecurityEvent(
        'api_rate_limit_exceeded',
        'low',
        { ip: clientIP, path: pathname },
        request
      )
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime!).toISOString()
        }
      })
    }
  }

  // Add rate limit headers for successful requests
  if (rateLimitResult?.allowed) {
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining?.toString() || '0')
  }

  // CSRF protection for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method) && pathname.startsWith('/api/')) {
    const csrfToken = request.headers.get('x-csrf-token')
    const sessionId = request.headers.get('x-session-id') || clientIP
    
    if (!csrfToken || !CSRFProtection.validateToken(sessionId, csrfToken)) {
      SecurityMonitor.logSecurityEvent(
        'csrf_token_invalid',
        'high',
        { path: pathname, method: request.method, hasToken: !!csrfToken },
        request
      )
      return new NextResponse('Invalid CSRF Token', { status: 403 })
    }
  }

  // Get session for authentication checks
  const session = await auth()

  // Protect client portal routes
  if (pathname.startsWith("/client")) {
    if (!session?.user) {
      SecurityMonitor.logSecurityEvent(
        'unauthorized_client_access',
        'medium',
        { path: pathname, ip: clientIP },
        request
      )
      // Redirect to login page
      const loginUrl = new URL("/auth/signin", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protect API routes that require authentication
  const protectedApiRoutes = ['/api/client/', '/api/payments/', '/api/invoices/', '/api/recurring-invoices/']
  if (protectedApiRoutes.some(route => pathname.startsWith(route))) {
    if (!session?.user) {
      SecurityMonitor.logSecurityEvent(
        'unauthorized_api_access',
        'high',
        { path: pathname, ip: clientIP },
        request
      )
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  // Protect auth pages from authenticated users
  if (pathname.startsWith("/auth/signin") || pathname.startsWith("/auth/register")) {
    if (session?.user) {
      // Redirect authenticated users to client portal
      return NextResponse.redirect(new URL("/client", request.url))
    }
  }

  // Log successful authenticated requests
  if (session?.user && pathname.startsWith('/api/')) {
    SecurityMonitor.logSecurityEvent(
      'authenticated_api_access',
      'low',
      { path: pathname, userId: session.user.id, ip: clientIP },
      request
    )
  }

  return response
}

export const config = {
  matcher: [
    "/client/:path*",
    "/auth/signin",
    "/auth/register"
  ]
}