import { NextRequest, NextResponse } from "next/server"
import { hashPassword, validatePassword } from "@/lib/auth"
import { createClient, findClientByEmail } from "@/lib/auth"
import { generateVerificationToken } from "@/lib/auth"
import { withSecurity, withSecurityAudit } from "@/lib/middleware/security"
import { SecurityMonitor } from "@/lib/utils/security"
import { DataEncryptionService, SensitiveDataEncryption } from "@/lib/services/encryption"

async function registerHandler(request: NextRequest, context?: any) {
  try {
    // Get validated data from security middleware
    const { name, email, company, password } = context?.validatedData || {}

    // Check if user already exists
    const existingClient = await findClientByEmail(email.toLowerCase())
    if (existingClient) {
      SecurityMonitor.logSecurityEvent(
        'registration_duplicate_email',
        'medium',
        { email: email.toLowerCase() },
        request
      )
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password securely
    const passwordHash = await DataEncryptionService.hashPassword(password)

    // Generate secure verification token
    const verificationToken = DataEncryptionService.generateSecureToken()

    // Encrypt sensitive personal data
    const encryptedData = SensitiveDataEncryption.encryptPersonalData({
      email: email.toLowerCase(),
      phone: undefined, // Not provided in registration
      address: undefined, // Not provided in registration
    })

    // Create client with encrypted data
    const client = await createClient({
      name: name.trim(),
      email: email.toLowerCase(),
      company: company?.trim() || undefined,
      passwordHash,
      verificationToken,
      encryptedEmail: encryptedData.encryptedEmail,
      emailHash: encryptedData.emailHash,
    })

    if (!client) {
      SecurityMonitor.logSecurityEvent(
        'registration_failed',
        'high',
        { email: email.toLowerCase(), reason: 'database_error' },
        request
      )
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      )
    }

    // Log successful registration
    SecurityMonitor.logSecurityEvent(
      'registration_success',
      'low',
      { clientId: client.id, email: email.toLowerCase() },
      request
    )

    // TODO: Send verification email
    // For now, we'll just return success
    // In a real implementation, you would send an email with the verification token

    return NextResponse.json(
      {
        message: "Account created successfully",
        clientId: client.id,
        // In development, include the verification token for testing
        ...(process.env.NODE_ENV === "development" && {
          verificationToken: verificationToken
        })
      },
      { status: 201 }
    )
  } catch (error) {
    SecurityMonitor.logSecurityEvent(
      'registration_error',
      'high',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      request
    )
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Apply comprehensive security middleware
const securedHandler = withSecurity({
  rateLimit: 'auth',
  validation: 'register',
  maxRequestSize: 1024, // 1KB for registration
  allowedMethods: ['POST']
})(registerHandler)

// Add security audit logging
const auditedHandler = withSecurityAudit()(securedHandler)

export async function POST(request: NextRequest) {
  return auditedHandler(request)
}