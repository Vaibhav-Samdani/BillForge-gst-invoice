/**
 * Environment variables for authentication
 */
export const authEnv = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "development-secret-key",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
} as const

/**
 * Validate required environment variables
 */
export function validateAuthEnv() {
  const required = ["NEXTAUTH_SECRET"] as const
  const missing: string[] = []

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    )
  }
}

/**
 * Check if we're in production
 */
export const isProduction = process.env.NODE_ENV === "production"

/**
 * Get the base URL for the application
 */
export function getBaseUrl() {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  return "http://localhost:3000"
}