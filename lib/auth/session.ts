import { NextRequest, NextResponse } from "next/server"
import { auth } from "./config"
import { cookies } from "next/headers"

export interface SessionUser {
  id: string
  email: string
  name: string
  company?: string
}

/**
 * Get the current session on the server side
 */
export async function getSession() {
  return await auth()
}

/**
 * Get the current user from session
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession()
  
  if (!session?.user) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name!,
    company: session.user.company
  }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error("Authentication required")
  }
  
  return user
}

/**
 * Set secure cookie options
 */
export function getSecureCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production"
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  }
}

/**
 * Set a secure cookie
 */
export function setSecureCookie(
  response: NextResponse,
  name: string,
  value: string,
  options?: Partial<ReturnType<typeof getSecureCookieOptions>>
) {
  const cookieOptions = { ...getSecureCookieOptions(), ...options }
  
  response.cookies.set(name, value, cookieOptions)
}

/**
 * Clear a cookie
 */
export function clearCookie(response: NextResponse, name: string) {
  response.cookies.set(name, "", {
    ...getSecureCookieOptions(),
    maxAge: 0,
  })
}

/**
 * Rate limiting for authentication attempts
 */
const attemptCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string, maxAttempts: number = 5): {
  allowed: boolean
  remainingAttempts: number
  resetTime: number
} {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  
  const current = attemptCounts.get(identifier)
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    attemptCounts.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remainingAttempts: maxAttempts - 1, resetTime: now + windowMs }
  }
  
  if (current.count >= maxAttempts) {
    return { allowed: false, remainingAttempts: 0, resetTime: current.resetTime }
  }
  
  current.count++
  return { 
    allowed: true, 
    remainingAttempts: maxAttempts - current.count, 
    resetTime: current.resetTime 
  }
}

/**
 * Clear rate limit for an identifier (on successful login)
 */
export function clearRateLimit(identifier: string) {
  attemptCounts.delete(identifier)
}