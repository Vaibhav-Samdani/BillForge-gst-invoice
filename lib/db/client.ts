import { PrismaClient } from "../generated/prisma"

const prisma = new PrismaClient()

export { prisma }

export interface ClientUser {
  id: string
  email: string
  passwordHash: string
  name: string
  company?: string | null
  isVerified: boolean
  verificationToken?: string | null
  resetToken?: string | null
  resetTokenExpiry?: Date | null
  createdAt: Date
  lastLoginAt?: Date | null
}

/**
 * Find a client by email
 */
export async function findClientByEmail(email: string): Promise<ClientUser | null> {
  try {
    const client = await prisma.clientUser.findUnique({
      where: { email }
    })
    return client
  } catch (error) {
    console.error("Error finding client by email:", error)
    return null
  }
}

/**
 * Find a client by ID
 */
export async function findClientById(id: string): Promise<ClientUser | null> {
  try {
    const client = await prisma.clientUser.findUnique({
      where: { id }
    })
    return client
  } catch (error) {
    console.error("Error finding client by ID:", error)
    return null
  }
}

/**
 * Create a new client user
 */
export async function createClient(data: {
  email: string
  passwordHash: string
  name: string
  company?: string
  verificationToken?: string
  encryptedEmail?: string
  emailHash?: string
}): Promise<ClientUser | null> {
  try {
    const client = await prisma.clientUser.create({
      data: {
        ...data,
        isVerified: false,
        createdAt: new Date()
      }
    })
    return client
  } catch (error) {
    console.error("Error creating client:", error)
    return null
  }
}

/**
 * Update client verification status
 */
export async function verifyClient(id: string): Promise<boolean> {
  try {
    await prisma.clientUser.update({
      where: { id },
      data: {
        isVerified: true,
        verificationToken: null
      }
    })
    return true
  } catch (error) {
    console.error("Error verifying client:", error)
    return false
  }
}

/**
 * Update client's last login time
 */
export async function updateLastLogin(id: string): Promise<boolean> {
  try {
    await prisma.clientUser.update({
      where: { id },
      data: {
        lastLoginAt: new Date()
      }
    })
    return true
  } catch (error) {
    console.error("Error updating last login:", error)
    return false
  }
}

/**
 * Set password reset token
 */
export async function setResetToken(
  email: string,
  token: string,
  expiry: Date
): Promise<boolean> {
  try {
    await prisma.clientUser.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry
      }
    })
    return true
  } catch (error) {
    console.error("Error setting reset token:", error)
    return false
  }
}

/**
 * Clear password reset token
 */
export async function clearResetToken(id: string): Promise<boolean> {
  try {
    await prisma.clientUser.update({
      where: { id },
      data: {
        resetToken: null,
        resetTokenExpiry: null
      }
    })
    return true
  } catch (error) {
    console.error("Error clearing reset token:", error)
    return false
  }
}

/**
 * Update client password
 */
export async function updateClientPassword(
  id: string,
  passwordHash: string
): Promise<boolean> {
  try {
    await prisma.clientUser.update({
      where: { id },
      data: {
        passwordHash
      }
    })
    return true
  } catch (error) {
    console.error("Error updating password:", error)
    return false
  }
}