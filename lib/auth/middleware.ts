import { NextRequest, NextResponse } from "next/server"
import { auth } from "./config"

/**
 * Authentication middleware for API routes
 */
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Add user info to request for handler
    const user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      company: session.user.company
    }

    return await handler(request, user)
  } catch (error) {
    console.error("Authentication middleware error:", error)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    )
  }
}

/**
 * Role-based authorization middleware
 */
export async function withRole(
  request: NextRequest,
  requiredRole: string,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(request, async (req, user) => {
    // For now, we'll implement basic client role checking
    // This can be extended when admin roles are added
    if (requiredRole === "client" && user.id) {
      return await handler(req, user)
    }

    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    )
  })
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  identifier: (request: NextRequest) => string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
) {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return async function(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    const key = identifier(request)
    const now = Date.now()
    
    const current = requests.get(key)
    
    if (!current || now > current.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs })
      return await handler(request)
    }
    
    if (current.count >= maxRequests) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        },
        { status: 429 }
      )
    }
    
    current.count++
    return await handler(request)
  }
}