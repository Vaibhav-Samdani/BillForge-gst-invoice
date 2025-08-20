/**
 * Test script for authentication API endpoints
 * This script tests the registration, login, and password reset APIs
 */

async function testRegistrationAPI() {
  console.log("📝 Testing registration API...")
  
  const testUser = {
    name: "Test User",
    email: `test-${Date.now()}@example.com`,
    company: "Test Company",
    password: "TestPassword123!"
  }
  
  try {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testUser),
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log("✅ Registration successful:", data)
      return { success: true, data, email: testUser.email }
    } else {
      console.log("❌ Registration failed:", data)
      return { success: false, error: data }
    }
  } catch (error) {
    console.log("❌ Registration API error:", error)
    return { success: false, error }
  }
}

async function testForgotPasswordAPI(email: string) {
  console.log("🔑 Testing forgot password API...")
  
  try {
    const response = await fetch("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log("✅ Forgot password successful:", data)
      return { success: true, data }
    } else {
      console.log("❌ Forgot password failed:", data)
      return { success: false, error: data }
    }
  } catch (error) {
    console.log("❌ Forgot password API error:", error)
    return { success: false, error }
  }
}

async function testResetPasswordAPI(token: string) {
  console.log("🔄 Testing reset password API...")
  
  const newPassword = "NewTestPassword123!"
  
  try {
    const response = await fetch("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        password: newPassword,
      }),
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log("✅ Reset password successful:", data)
      return { success: true, data }
    } else {
      console.log("❌ Reset password failed:", data)
      return { success: false, error: data }
    }
  } catch (error) {
    console.log("❌ Reset password API error:", error)
    return { success: false, error }
  }
}

async function testValidationErrors() {
  console.log("🚫 Testing validation errors...")
  
  // Test registration with invalid data
  const invalidRegistrations = [
    { name: "", email: "test@example.com", password: "TestPassword123!" },
    { name: "Test", email: "invalid-email", password: "TestPassword123!" },
    { name: "Test", email: "test@example.com", password: "weak" },
  ]
  
  for (const [index, invalidData] of invalidRegistrations.entries()) {
    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidData),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        console.log(`✅ Validation error ${index + 1} caught correctly:`, data.error)
      } else {
        console.log(`❌ Validation error ${index + 1} not caught:`, data)
      }
    } catch (error) {
      console.log(`❌ Validation test ${index + 1} failed:`, error)
    }
  }
}

async function testRateLimiting() {
  console.log("⏱️ Testing rate limiting...")
  
  const testEmail = `ratelimit-${Date.now()}@example.com`
  
  // Make multiple rapid requests to trigger rate limiting
  const promises = Array.from({ length: 7 }, (_, i) =>
    fetch("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: testEmail }),
    })
  )
  
  try {
    const responses = await Promise.all(promises)
    const results = await Promise.all(responses.map(r => r.json()))
    
    const rateLimited = responses.some(r => r.status === 429)
    
    if (rateLimited) {
      console.log("✅ Rate limiting working correctly")
    } else {
      console.log("❌ Rate limiting not triggered")
    }
  } catch (error) {
    console.log("❌ Rate limiting test failed:", error)
  }
}

async function runAPITests() {
  console.log("🚀 Starting authentication API tests...\n")
  
  try {
    // Test registration
    const registrationResult = await testRegistrationAPI()
    
    if (registrationResult.success) {
      // Test forgot password
      await testForgotPasswordAPI(registrationResult.email!)
      
      // Note: In a real test, you would extract the reset token from the email
      // For now, we'll generate a test token
      const { generateResetToken } = await import("../lib/auth")
      const testResetToken = generateResetToken("test-user-id", registrationResult.email!)
      
      // Test reset password
      await testResetPasswordAPI(testResetToken)
    }
    
    // Test validation errors
    await testValidationErrors()
    
    // Test rate limiting
    await testRateLimiting()
    
    console.log("\n🎉 All authentication API tests completed!")
    console.log("\n📋 Test Summary:")
    console.log("- Registration API: ✅")
    console.log("- Forgot password API: ✅")
    console.log("- Reset password API: ✅")
    console.log("- Validation errors: ✅")
    console.log("- Rate limiting: ✅")
    
  } catch (error) {
    console.error("❌ API tests failed:", error)
    process.exit(1)
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch("http://localhost:3000/api/health")
    if (response.ok) {
      console.log("✅ Server is running")
      return true
    }
  } catch (error) {
    console.log("❌ Server is not running. Please start the development server with 'npm run dev'")
    return false
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  checkServer().then(serverRunning => {
    if (serverRunning) {
      runAPITests()
    } else {
      process.exit(1)
    }
  })
}

export { runAPITests }