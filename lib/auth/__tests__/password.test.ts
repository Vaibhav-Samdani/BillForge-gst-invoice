import { describe, it, expect } from "vitest"
import { hashPassword, verifyPassword, validatePassword } from "../password"

describe("Password utilities", () => {
  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const password = "testpassword123"
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50) // bcrypt hashes are typically 60 chars
    })

    it("should generate different hashes for the same password", async () => {
      const password = "testpassword123"
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).not.toBe(hash2)
    })
  })

  describe("verifyPassword", () => {
    it("should verify a correct password", async () => {
      const password = "testpassword123"
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it("should reject an incorrect password", async () => {
      const password = "testpassword123"
      const wrongPassword = "wrongpassword"
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })
  })

  describe("validatePassword", () => {
    it("should validate a strong password", () => {
      const password = "StrongPass123!"
      const result = validatePassword(password)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should reject a password that's too short", () => {
      const password = "Short1!"
      const result = validatePassword(password)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Password must be at least 8 characters long")
    })

    it("should reject a password without uppercase", () => {
      const password = "lowercase123!"
      const result = validatePassword(password)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Password must contain at least one uppercase letter")
    })

    it("should reject a password without lowercase", () => {
      const password = "UPPERCASE123!"
      const result = validatePassword(password)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Password must contain at least one lowercase letter")
    })

    it("should reject a password without numbers", () => {
      const password = "NoNumbers!"
      const result = validatePassword(password)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Password must contain at least one number")
    })

    it("should reject a password without special characters", () => {
      const password = "NoSpecialChars123"
      const result = validatePassword(password)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Password must contain at least one special character")
    })
  })
})