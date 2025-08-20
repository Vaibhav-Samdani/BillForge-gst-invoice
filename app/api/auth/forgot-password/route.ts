import { NextRequest, NextResponse } from "next/server"
import { findClientByEmail, setResetToken } from "@/lib/auth"
import { generateResetToken } from "@/lib/auth"
import { withRateLimit } from "@/lib/auth/middleware"

async function forgotPasswordHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Find client by email
    const client = await findClientByEmail(email.toLowerCase())
    
    // Always return success to prevent email enumeration attacks
    // But only send email if client exists
    if (client) {
      // Generate reset token (valid for 1 hour)
      const resetToken = generateResetToken()
      const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

      // Save reset token to database
      const success = await setResetToken(email.toLowerCase(), resetToken, expiry)
      
      if (success) {
        // TODO: Send password reset email
        // For now, we'll just log it in development
        if (process.env.NODE_ENV === "development") {
          console.log(`Password reset token for ${email}: ${resetToken}`)
          console.log(`Reset URL: ${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`)
        }
      }
    }

    // Always return success message to prevent email enumeration
    return NextResponse.json(
      {
        message: "If an account with that email exists, a password reset link has been sent."
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Apply rate limiting: 3 forgot password attempts per 15 minutes per IP
const rateLimitedHandler = withRateLimit(
  (request: NextRequest) => {
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : "unknown"
    return `forgot-password:${ip}`
  },
  3,
  15 * 60 * 1000 // 15 minutes
)

export async function POST(request: NextRequest) {
  return rateLimitedHandler(request, forgotPasswordHandler)
}