import { describe, it, expect, beforeEach } from "vitest"
import { hashPassword, verifyPassword } from "../password"
import { generateAccessToken, verifyToken } from "../jwt"
import { createClient, findClientByEmail } from "../../db/client"

describe("Authentication Integration", () => {
  const testEmail = `test-${Date.now()}@example.com` // Use unique email
  const testPassword = "TestPassword123!"
  const testName = "Test User"
  const testCompany = "Test Company"

  describe("End-to-end authentication flow", () => {
    it("should create client, hash password, and verify authentication", async () => {
      // 1. Hash password
      const passwordHash = await hashPassword(testPassword)
      expect(passwordHash).toBeDefined()
      expect(passwordHash).not.toBe(testPassword)

      // 2. Create client (this would normally be done during registration)
      const client = await createClient({
        email: testEmail,
        passwordHash,
        name: testName,
        company: testCompany
      })

      expect(client).toBeDefined()
      expect(client?.email).toBe(testEmail)
      expect(client?.name).toBe(testName)
      expect(client?.company).toBe(testCompany)
      expect(client?.isVerified).toBe(false)

      // 3. Find client by email (this would be done during login)
      const foundClient = await findClientByEmail(testEmail)
      expect(foundClient).toBeDefined()
      expect(foundClient?.id).toBe(client?.id)

      // 4. Verify password (this would be done during login)
      if (foundClient) {
        const isValidPassword = await verifyPassword(testPassword, foundClient.passwordHash)
        expect(isValidPassword).toBe(true)

        // 5. Generate access token (this would be done after successful login)
        const accessToken = generateAccessToken(foundClient.id, foundClient.email)
        expect(accessToken).toBeDefined()

        // 6. Verify token (this would be done on protected routes)
        const tokenPayload = verifyToken(accessToken)
        expect(tokenPayload).toBeDefined()
        expect(tokenPayload?.userId).toBe(foundClient.id)
        expect(tokenPayload?.email).toBe(foundClient.email)
        expect(tokenPayload?.type).toBe("access")
      }
    })

    it("should reject invalid password", async () => {
      const foundClient = await findClientByEmail(testEmail)
      expect(foundClient).toBeDefined()

      if (foundClient) {
        const isValidPassword = await verifyPassword("WrongPassword123!", foundClient.passwordHash)
        expect(isValidPassword).toBe(false)
      }
    })
  })
})