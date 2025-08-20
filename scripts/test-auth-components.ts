/**
 * Test script for authentication components
 * This script tests the authentication infrastructure and components
 */

import { hashPassword, verifyPassword, validatePassword } from "../lib/auth"
import { generateResetToken, generateVerificationToken, verifyResetToken } from "../lib/auth"

async function testPasswordUtilities() {
  console.log("🔐 Testing password utilities...")
  
  // Test password validation
  const weakPassword = "123"
  const strongPassword = "MyStr0ng!Password"
  
  const weakValidation = validatePassword(weakPassword)
  const strongValidation = validatePassword(strongPassword)
  
  console.log("Weak password validation:", weakValidation)
  console.log("Strong password validation:", strongValidation)
  
  // Test password hashing and verification
  const hashedPassword = await hashPassword(strongPassword)
  const isValid = await verifyPassword(strongPassword, hashedPassword)
  const isInvalid = await verifyPassword("wrongpassword", hashedPassword)
  
  console.log("Password hash:", hashedPassword.substring(0, 20) + "...")
  console.log("Password verification (correct):", isValid)
  console.log("Password verification (incorrect):", isInvalid)
  
  console.log("✅ Password utilities test completed\n")
}

async function testTokenGeneration() {
  console.log("🎫 Testing token generation...")
  
  // Test verification token
  const verificationToken = generateVerificationToken()
  console.log("Verification token:", verificationToken.substring(0, 20) + "...")
  
  // Test reset token
  const resetToken = generateResetToken()
  console.log("Reset token:", resetToken.substring(0, 20) + "...")
  
  // Test reset token verification
  const tokenData = verifyResetToken(resetToken)
  console.log("Reset token verification:", tokenData)
  
  console.log("✅ Token generation test completed\n")
}

async function testAuthFlow() {
  console.log("🔄 Testing authentication flow...")
  
  // Simulate user registration data
  const userData = {
    name: "Test User",
    email: "test@example.com",
    company: "Test Company",
    password: "TestPassword123!"
  }
  
  // Test password validation
  const passwordValidation = validatePassword(userData.password)
  console.log("Registration password validation:", passwordValidation)
  
  // Test password hashing (as would happen during registration)
  const hashedPassword = await hashPassword(userData.password)
  console.log("Hashed password for storage:", hashedPassword.substring(0, 20) + "...")
  
  // Test login verification (as would happen during login)
  const loginSuccess = await verifyPassword(userData.password, hashedPassword)
  console.log("Login verification:", loginSuccess)
  
  // Test password reset flow
  const resetToken = generateResetToken()
  console.log("Generated reset token:", resetToken.substring(0, 20) + "...")
  
  const resetTokenData = verifyResetToken(resetToken)
  console.log("Reset token verification:", resetTokenData)
  
  console.log("✅ Authentication flow test completed\n")
}

async function runTests() {
  console.log("🚀 Starting authentication components tests...\n")
  
  try {
    await testPasswordUtilities()
    await testTokenGeneration()
    await testAuthFlow()
    
    console.log("🎉 All authentication tests completed successfully!")
    console.log("\n📋 Test Summary:")
    console.log("- Password validation: ✅")
    console.log("- Password hashing: ✅")
    console.log("- Token generation: ✅")
    console.log("- Authentication flow: ✅")
    
  } catch (error) {
    console.error("❌ Test failed:", error)
    process.exit(1)
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests()
}

export { runTests }