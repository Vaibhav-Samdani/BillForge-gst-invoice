import jwt, { SignOptions } from "jsonwebtoken"

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-key"

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required")
}

export interface TokenPayload {
  userId: string
  email: string
  type: "access" | "refresh" | "reset" | "verification"
  exp?: number
  iat?: number
}

/**
 * Generate a JWT token
 */
export function generateToken(
  payload: Omit<TokenPayload, "exp" | "iat">,
  expiresIn: string | number = "24h"
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any })
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

/**
 * Generate an access token (24 hours)
 */
export function generateAccessToken(userId: string, email: string): string {
  return generateToken(
    { userId, email, type: "access" },
    "24h"
  )
}

/**
 * Generate a refresh token (7 days)
 */
export function generateRefreshToken(userId: string, email: string): string {
  return generateToken(
    { userId, email, type: "refresh" },
    "7d"
  )
}

/**
 * Generate a password reset token (1 hour)
 */
export function generateResetToken(userId?: string, email?: string): string {
  // For simple reset tokens, we can generate without user data
  const payload = userId && email 
    ? { userId, email, type: "reset" as const }
    : { userId: "temp", email: "temp", type: "reset" as const }
  
  return generateToken(payload, "1h")
}

/**
 * Generate an email verification token (24 hours)
 */
export function generateVerificationToken(userId?: string, email?: string): string {
  // For simple verification tokens, we can generate without user data
  const payload = userId && email 
    ? { userId, email, type: "verification" as const }
    : { userId: "temp", email: "temp", type: "verification" as const }
  
  return generateToken(payload, "24h")
}

/**
 * Verify a reset token and return client data
 */
export function verifyResetToken(token: string): { clientId: string; email: string } | null {
  const decoded = verifyToken(token)
  if (!decoded || decoded.type !== "reset") {
    return null
  }
  
  return {
    clientId: decoded.userId,
    email: decoded.email
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as TokenPayload
    if (!decoded || !decoded.exp) return true
    
    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch {
    return true
  }
}