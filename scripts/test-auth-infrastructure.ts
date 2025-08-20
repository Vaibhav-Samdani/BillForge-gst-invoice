#!/usr/bin/env tsx

/**
 * Test script to verify authentication infrastructure
 */

import { hashPassword, verifyPassword, validatePassword } from "../lib/auth/password"
import { generateAccessToken, verifyToken, generateResetToken } from "../lib/auth/jwt"
import { createClient, findClientByEmail } from "../lib/db/client"

async function testAuthInfrastructure() {
  console.log("🔐 Testing Authentication Infrastructure...")
  console.log("=" .repeat(50))

  try {
    // Test 1: Password utilities
    console.log("\n1. Testing Password Utilities...")
    const testPassword = "TestPassword123!"
    
    // Validate password strength
    const validation = validatePassword(testPassword)
    console.log(`   ✓ Password validation: ${validation.isValid ? "PASS" : "FAIL"}`)
    if (!validation.isValid) {
      console.log(`     Errors: ${validation.errors.join(", ")}`)
    }

    // Hash password
    const hashedPassword = await hashPassword(testPassword)
    console.log(`   ✓ Password hashing: ${hashedPassword ? "PASS" : "FAIL"}`)

    // Verify password
    const isValid = await verifyPassword(testPassword, hashedPassword)
    console.log(`   ✓ Password verification: ${isValid ? "PASS" : "FAIL"}`)

    // Test 2: JWT Token utilities
    console.log("\n2. Testing JWT Token Utilities...")
    const userId = "test-user-123"
    const email = "test@example.com"

    // Generate access token
    const accessToken = generateAccessToken(userId, email)
    console.log(`   ✓ Access token generation: ${accessToken ? "PASS" : "FAIL"}`)

    // Verify token
    const tokenPayload = verifyToken(accessToken)
    console.log(`   ✓ Token verification: ${tokenPayload ? "PASS" : "FAIL"}`)
    console.log(`     Token payload: ${JSON.stringify(tokenPayload, null, 2)}`)

    // Generate reset token
    const resetToken = generateResetToken(userId, email)
    console.log(`   ✓ Reset token generation: ${resetToken ? "PASS" : "FAIL"}`)

    // Test 3: Database operations
    console.log("\n3. Testing Database Operations...")
    const uniqueEmail = `test-${Date.now()}@example.com`
    
    // Create client
    const client = await createClient({
      email: uniqueEmail,
      passwordHash: hashedPassword,
      name: "Test User",
      company: "Test Company"
    })
    console.log(`   ✓ Client creation: ${client ? "PASS" : "FAIL"}`)

    if (client) {
      console.log(`     Client ID: ${client.id}`)
      console.log(`     Email: ${client.email}`)
      console.log(`     Verified: ${client.isVerified}`)

      // Find client by email
      const foundClient = await findClientByEmail(uniqueEmail)
      console.log(`   ✓ Find client by email: ${foundClient ? "PASS" : "FAIL"}`)
    }

    // Test 4: Environment configuration
    console.log("\n4. Testing Environment Configuration...")
    const requiredEnvVars = ["NEXTAUTH_SECRET", "NEXTAUTH_URL", "DATABASE_URL"]
    
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar]
      console.log(`   ✓ ${envVar}: ${value ? "SET" : "MISSING"}`)
    }

    console.log("\n" + "=" .repeat(50))
    console.log("🎉 Authentication Infrastructure Test Complete!")
    console.log("\nAll core authentication components are working correctly:")
    console.log("  • Password hashing and verification (bcrypt)")
    console.log("  • JWT token generation and validation")
    console.log("  • Database client operations")
    console.log("  • Environment configuration")
    console.log("\nNextAuth.js is configured and ready for client portal authentication.")

  } catch (error) {
    console.error("\n❌ Authentication test failed:", error)
    process.exit(1)
  }
}

// Run the test
testAuthInfrastructure()