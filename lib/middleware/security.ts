import { NextRequest, NextResponse } from 'next/server'
import {
  SecurityMonitor,
  CSRFProtection,
  InputValidator,
  authRateLimiter,
  paymentRateLimiter,
  apiRateLimiter
} from '@/lib/utils/security'
import { createValidationMiddleware, detectSQLInjection, detectXSS } from './validation'
import { auth } from '@/lib/auth/config'

// Security middleware configuration
interface SecurityConfig {
  requireAuth?: boolean
  requireCSRF?: boolean
  rateLimit?: 'auth' | 'payment' | 'api'
  validation?: keyof typeof import('./validation').validationSchemas
  maxRequestSize?: number
  allowedMethods?: string[]
}

// Main security middleware factory
export function withSecurity(config: SecurityConfig = {}) {
  return function securityMiddleware(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse>
  ) {
    return async function securedHandler(request: NextRequest, context?: any): Promise<NextResponse> {
      try {
        // Get client IP from headers
        const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          request.headers.get('x-real-ip') ||
          request.headers.get('cf-connecting-ip') ||
          'unknown'

        // Method validation
        if (config.allowedMethods && !config.allowedMethods.includes(request.method)) {
          SecurityMonitor.logSecurityEvent(
            'method_not_allowed',
            'medium',
            { method: request.method, allowed: config.allowedMethods },
            request
          )
          return NextResponse.json(
            { error: 'Method not allowed' },
            { status: 405, headers: { 'Allow': config.allowedMethods.join(', ') } }
          )
        }

        // Request size validation
        if (config.maxRequestSize) {
          const contentLength = request.headers.get('content-length')
          if (contentLength && parseInt(contentLength) > config.maxRequestSize) {
            SecurityMonitor.logSecurityEvent(
              'request_size_exceeded',
              'medium',
              { size: contentLength, limit: config.maxRequestSize },
              request
            )
            return NextResponse.json(
              { error: 'Request too large' },
              { status: 413 }
            )
          }
        }

        // Rate limiting
        if (config.rateLimit) {
          let rateLimiter
          let limitName = ''

          switch (config.rateLimit) {
            case 'auth':
              rateLimiter = authRateLimiter
              limitName = 'Authentication'
              break
            case 'payment':
              rateLimiter = paymentRateLimiter
              limitName = 'Payment'
              break
            case 'api':
            default:
              rateLimiter = apiRateLimiter
              limitName = 'API'
              break
          }

          const rateLimitResult = rateLimiter.isAllowed(clientIP)
          if (!rateLimitResult.allowed) {
            SecurityMonitor.logSecurityEvent(
              'rate_limit_exceeded',
              config.rateLimit === 'payment' ? 'high' : 'medium',
              { type: config.rateLimit, ip: clientIP },
              request
            )
            return NextResponse.json(
              { error: `${limitName} rate limit exceeded` },
              {
                status: 429,
                headers: {
                  'Retry-After': Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000).toString(),
                  'X-RateLimit-Remaining': '0'
                }
              }
            )
          }
        }

        // CSRF protection for state-changing operations
        if (config.requireCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
          const csrfToken = request.headers.get('x-csrf-token')
          const sessionId = request.headers.get('x-session-id') || clientIP

          if (!csrfToken || !CSRFProtection.validateToken(sessionId, csrfToken)) {
            SecurityMonitor.logSecurityEvent(
              'csrf_validation_failed',
              'high',
              { hasToken: !!csrfToken, sessionId },
              request
            )
            return NextResponse.json(
              { error: 'Invalid CSRF token' },
              { status: 403 }
            )
          }
        }

        // Authentication check
        if (config.requireAuth) {
          const session = await auth()
          if (!session?.user) {
            SecurityMonitor.logSecurityEvent(
              'unauthorized_access_attempt',
              'medium',
              { path: request.nextUrl.pathname, ip: clientIP },
              request
            )
            return NextResponse.json(
              { error: 'Authentication required' },
              { status: 401 }
            )
          }

          // Add user context to request
          context = { ...context, user: session.user }
        }

        // Input validation and sanitization
        if (config.validation && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          const validationMiddleware = createValidationMiddleware(config.validation)
          const validationResult = await validationMiddleware(request)

          if (validationResult instanceof NextResponse) {
            return validationResult // Validation failed
          }

          // Add validated data to context
          context = { ...context, validatedData: validationResult.validatedData }
        }

        // Additional security checks on request body
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            const body = await request.text()

            // Check for SQL injection attempts
            if (detectSQLInjection(body)) {
              SecurityMonitor.logSecurityEvent(
                'sql_injection_attempt',
                'critical',
                { body: body.substring(0, 200), ip: clientIP },
                request
              )
              return NextResponse.json(
                { error: 'Malicious request detected' },
                { status: 400 }
              )
            }

            // Check for XSS attempts
            if (detectXSS(body)) {
              SecurityMonitor.logSecurityEvent(
                'xss_attempt',
                'high',
                { body: body.substring(0, 200), ip: clientIP },
                request
              )
              return NextResponse.json(
                { error: 'Malicious request detected' },
                { status: 400 }
              )
            }

            // Recreate request with body for handler
            const newRequest = new NextRequest(request.url, {
              method: request.method,
              headers: request.headers,
              body: body
            })

            // Call the actual handler
            const response = await handler(newRequest, context)

            // Add security headers to response
            response.headers.set('X-Content-Type-Options', 'nosniff')
            response.headers.set('X-Frame-Options', 'DENY')
            response.headers.set('X-XSS-Protection', '1; mode=block')

            return response

          } catch (error) {
            SecurityMonitor.logSecurityEvent(
              'request_processing_error',
              'medium',
              { error: error instanceof Error ? error.message : 'Unknown error' },
              request
            )
            return NextResponse.json(
              { error: 'Invalid request format' },
              { status: 400 }
            )
          }
        } else {
          // For GET requests, call handler directly
          const response = await handler(request, context)

          // Add security headers to response
          response.headers.set('X-Content-Type-Options', 'nosniff')
          response.headers.set('X-Frame-Options', 'DENY')
          response.headers.set('X-XSS-Protection', '1; mode=block')

          return response
        }

      } catch (error) {
        SecurityMonitor.logSecurityEvent(
          'security_middleware_error',
          'high',
          { error: error instanceof Error ? error.message : 'Unknown error' },
          request
        )

        return NextResponse.json(
          { error: 'Internal security error' },
          { status: 500 }
        )
      }
    }
  }
}

// Specific security middleware presets
export const authSecurityMiddleware = withSecurity({
  requireCSRF: true,
  rateLimit: 'auth',
  maxRequestSize: 1024, // 1KB for auth requests
  allowedMethods: ['POST']
})

export const paymentSecurityMiddleware = withSecurity({
  requireAuth: true,
  requireCSRF: true,
  rateLimit: 'payment',
  maxRequestSize: 10240, // 10KB for payment requests
  allowedMethods: ['POST', 'GET']
})

export const apiSecurityMiddleware = withSecurity({
  requireAuth: true,
  requireCSRF: true,
  rateLimit: 'api',
  maxRequestSize: 102400, // 100KB for general API requests
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
})

export const publicApiSecurityMiddleware = withSecurity({
  rateLimit: 'api',
  maxRequestSize: 10240, // 10KB for public API requests
  allowedMethods: ['GET', 'POST']
})

// Security audit middleware
export function withSecurityAudit() {
  return function auditMiddleware(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse>
  ) {
    return async function auditedHandler(request: NextRequest, context?: any): Promise<NextResponse> {
      const startTime = Date.now()

      try {
        const response = await handler(request, context)
        const duration = Date.now() - startTime

        // Log successful requests
        SecurityMonitor.logSecurityEvent(
          'api_request_completed',
          'low',
          {
            path: request.nextUrl.pathname,
            method: request.method,
            status: response.status,
            duration,
            userAgent: request.headers.get('user-agent')
          },
          request
        )

        return response

      } catch (error) {
        const duration = Date.now() - startTime

        // Log failed requests
        SecurityMonitor.logSecurityEvent(
          'api_request_failed',
          'medium',
          {
            path: request.nextUrl.pathname,
            method: request.method,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration
          },
          request
        )

        throw error
      }
    }
  }
}

// CORS security middleware
export function withCORS(allowedOrigins: string[] = []) {
  return function corsMiddleware(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse>
  ) {
    return async function corsHandler(request: NextRequest, context?: any): Promise<NextResponse> {
      const origin = request.headers.get('origin')

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 200 })

        if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
          response.headers.set('Access-Control-Allow-Origin', origin)
        }

        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Session-ID')
        response.headers.set('Access-Control-Max-Age', '86400')

        return response
      }

      const response = await handler(request, context)

      // Add CORS headers to actual response
      if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
        response.headers.set('Access-Control-Allow-Origin', origin)
      }

      response.headers.set('Access-Control-Allow-Credentials', 'true')

      return response
    }
  }
}

export type { SecurityConfig }