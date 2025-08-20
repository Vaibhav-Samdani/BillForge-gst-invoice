import { NextRequest, NextResponse } from "next/server"
import { hashPassword, validatePassword } from "@/lib/auth"
import { updateClientPassword, clearResetToken } from "@/lib/auth"
import { verifyResetToken } from "@/lib/auth"
import { withRateLimit } from "@/lib/auth/middleware"

async function resetPasswordHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    // Validate required fields
    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: "Password does not meet requirements",
          details: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Verify reset token
    const tokenData = verifyResetToken(token)
    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await hashPassword(password)

    // Update password in database
    const success = await updateClientPassword(tokenData.clientId, passwordHash)
    if (!success) {
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      )
    }

    // Clear reset token
    await clearResetToken(tokenData.clientId)

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Apply rate limiting: 5 reset attempts per 15 minutes per IP
const rateLimitedHandler = withRateLimit(
  (request: NextRequest) => {
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : "unknown"
    return `reset-password:${ip}`
  },
  5,
  15 * 60 * 1000 // 15 minutes
)

export async function POST(request: NextRequest) {
  return rateLimitedHandler(request, resetPasswordHandler)
}