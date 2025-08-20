import { describe, it, expect, beforeEach } from "vitest"
import {
  generateToken,
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  generateVerificationToken,
  isTokenExpired
} from "../jwt"

describe("JWT utilities", () => {
  const userId = "test-user-id"
  const email = "test@example.com"

  describe("generateToken and verifyToken", () => {
    it("should generate and verify a valid token", () => {
      const token = generateToken(
        { userId, email, type: "access" },
        "1h"
      )
      
      expect(token).toBeDefined()
      expect(typeof token).toBe("string")
      
      const decoded = verifyToken(token)
      expect(decoded).toBeDefined()
      expect(decoded?.userId).toBe(userId)
      expect(decoded?.email).toBe(email)
      expect(decoded?.type).toBe("access")
    })

    it("should return null for invalid token", () => {
      const invalidToken = "invalid.token.here"
      const decoded = verifyToken(invalidToken)
      
      expect(decoded).toBeNull()
    })
  })

  describe("generateAccessToken", () => {
    it("should generate an access token", () => {
      const token = generateAccessToken(userId, email)
      const decoded = verifyToken(token)
      
      expect(decoded?.type).toBe("access")
      expect(decoded?.userId).toBe(userId)
      expect(decoded?.email).toBe(email)
    })
  })

  describe("generateRefreshToken", () => {
    it("should generate a refresh token", () => {
      const token = generateRefreshToken(userId, email)
      const decoded = verifyToken(token)
      
      expect(decoded?.type).toBe("refresh")
      expect(decoded?.userId).toBe(userId)
      expect(decoded?.email).toBe(email)
    })
  })

  describe("generateResetToken", () => {
    it("should generate a reset token", () => {
      const token = generateResetToken(userId, email)
      const decoded = verifyToken(token)
      
      expect(decoded?.type).toBe("reset")
      expect(decoded?.userId).toBe(userId)
      expect(decoded?.email).toBe(email)
    })
  })

  describe("generateVerificationToken", () => {
    it("should generate a verification token", () => {
      const token = generateVerificationToken(userId, email)
      const decoded = verifyToken(token)
      
      expect(decoded?.type).toBe("verification")
      expect(decoded?.userId).toBe(userId)
      expect(decoded?.email).toBe(email)
    })
  })

  describe("isTokenExpired", () => {
    it("should return false for valid token", () => {
      const token = generateToken(
        { userId, email, type: "access" },
        "1h"
      )
      
      expect(isTokenExpired(token)).toBe(false)
    })

    it("should return true for invalid token", () => {
      const invalidToken = "invalid.token"
      expect(isTokenExpired(invalidToken)).toBe(true)
    })
  })
})