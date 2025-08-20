import crypto from 'crypto'
import { EncryptionUtils } from '@/lib/utils/security'

// Environment variables for encryption keys
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || EncryptionUtils.generateKey()
const HASH_SALT_ROUNDS = parseInt(process.env.HASH_SALT_ROUNDS || '12')

// Data encryption service for sensitive information
export class DataEncryptionService {
  private static readonly algorithm = 'aes-256-gcm'
  private static readonly keyLength = 32
  private static readonly ivLength = 16
  private static readonly tagLength = 16

  // Encrypt sensitive data with authenticated encryption
  static encrypt(plaintext: string): string {
    try {
      const iv = crypto.randomBytes(this.ivLength)
      const cipher = crypto.createCipher(this.algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'))
      cipher.setAAD(Buffer.from('invoice-app', 'utf8')) // Additional authenticated data
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const tag = cipher.getAuthTag()
      
      // Combine IV + encrypted data + auth tag
      const combined = iv.toString('hex') + ':' + encrypted + ':' + tag.toString('hex')
      
      return Buffer.from(combined).toString('base64')
    } catch (error) {
      throw new Error('Encryption failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // Decrypt sensitive data with authentication verification
  static decrypt(encryptedData: string): string {
    try {
      const combined = Buffer.from(encryptedData, 'base64').toString('utf8')
      const parts = combined.split(':')
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format')
      }
      
      const iv = Buffer.from(parts[0], 'hex')
      const encrypted = parts[1]
      const tag = Buffer.from(parts[2], 'hex')
      
      const decipher = crypto.createDecipher(this.algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'))
      decipher.setAAD(Buffer.from('invoice-app', 'utf8'))
      decipher.setAuthTag(tag)
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      throw new Error('Decryption failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // Hash passwords securely
  static async hashPassword(password: string): Promise<string> {
    try {
      const bcrypt = await import('bcryptjs')
      return await bcrypt.hash(password, HASH_SALT_ROUNDS)
    } catch (error) {
      throw new Error('Password hashing failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // Verify password against hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const bcrypt = await import('bcryptjs')
      return await bcrypt.compare(password, hash)
    } catch (error) {
      throw new Error('Password verification failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // Generate secure random tokens
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  // Generate UUID v4
  static generateUUID(): string {
    return crypto.randomUUID()
  }

  // Hash sensitive data for indexing (one-way)
  static hashForIndex(data: string): string {
    return crypto.createHash('sha256').update(data + ENCRYPTION_KEY).digest('hex')
  }

  // Create HMAC for data integrity verification
  static createHMAC(data: string): string {
    return crypto.createHmac('sha256', ENCRYPTION_KEY).update(data).digest('hex')
  }

  // Verify HMAC
  static verifyHMAC(data: string, hmac: string): boolean {
    const expectedHmac = this.createHMAC(data)
    return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'))
  }
}

// Specific encryption utilities for different data types
export class SensitiveDataEncryption {
  // Encrypt payment information
  static encryptPaymentData(paymentData: {
    cardNumber?: string
    expiryDate?: string
    cvv?: string
    bankAccount?: string
    routingNumber?: string
  }): {
    encryptedCardNumber?: string
    encryptedExpiryDate?: string
    encryptedCvv?: string
    encryptedBankAccount?: string
    encryptedRoutingNumber?: string
  } {
    const encrypted: any = {}
    
    if (paymentData.cardNumber) {
      // Only encrypt last 4 digits, mask the rest
      const last4 = paymentData.cardNumber.slice(-4)
      const masked = '*'.repeat(paymentData.cardNumber.length - 4) + last4
      encrypted.encryptedCardNumber = DataEncryptionService.encrypt(masked)
    }
    
    if (paymentData.expiryDate) {
      encrypted.encryptedExpiryDate = DataEncryptionService.encrypt(paymentData.expiryDate)
    }
    
    // Never store CVV - this is just for demonstration
    if (paymentData.cvv) {
      encrypted.encryptedCvv = DataEncryptionService.encrypt('***') // Masked
    }
    
    if (paymentData.bankAccount) {
      const last4 = paymentData.bankAccount.slice(-4)
      const masked = '*'.repeat(paymentData.bankAccount.length - 4) + last4
      encrypted.encryptedBankAccount = DataEncryptionService.encrypt(masked)
    }
    
    if (paymentData.routingNumber) {
      encrypted.encryptedRoutingNumber = DataEncryptionService.encrypt(paymentData.routingNumber)
    }
    
    return encrypted
  }

  // Encrypt personal information
  static encryptPersonalData(personalData: {
    email?: string
    phone?: string
    address?: string
    gstin?: string
  }): {
    encryptedEmail?: string
    encryptedPhone?: string
    encryptedAddress?: string
    encryptedGstin?: string
    emailHash?: string
  } {
    const encrypted: any = {}
    
    if (personalData.email) {
      encrypted.encryptedEmail = DataEncryptionService.encrypt(personalData.email)
      encrypted.emailHash = DataEncryptionService.hashForIndex(personalData.email.toLowerCase())
    }
    
    if (personalData.phone) {
      encrypted.encryptedPhone = DataEncryptionService.encrypt(personalData.phone)
    }
    
    if (personalData.address) {
      encrypted.encryptedAddress = DataEncryptionService.encrypt(personalData.address)
    }
    
    if (personalData.gstin) {
      encrypted.encryptedGstin = DataEncryptionService.encrypt(personalData.gstin)
    }
    
    return encrypted
  }

  // Decrypt payment information
  static decryptPaymentData(encryptedData: {
    encryptedCardNumber?: string
    encryptedExpiryDate?: string
    encryptedBankAccount?: string
    encryptedRoutingNumber?: string
  }): {
    cardNumber?: string
    expiryDate?: string
    bankAccount?: string
    routingNumber?: string
  } {
    const decrypted: any = {}
    
    try {
      if (encryptedData.encryptedCardNumber) {
        decrypted.cardNumber = DataEncryptionService.decrypt(encryptedData.encryptedCardNumber)
      }
      
      if (encryptedData.encryptedExpiryDate) {
        decrypted.expiryDate = DataEncryptionService.decrypt(encryptedData.encryptedExpiryDate)
      }
      
      if (encryptedData.encryptedBankAccount) {
        decrypted.bankAccount = DataEncryptionService.decrypt(encryptedData.encryptedBankAccount)
      }
      
      if (encryptedData.encryptedRoutingNumber) {
        decrypted.routingNumber = DataEncryptionService.decrypt(encryptedData.encryptedRoutingNumber)
      }
    } catch (error) {
      throw new Error('Failed to decrypt payment data: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
    
    return decrypted
  }

  // Decrypt personal information
  static decryptPersonalData(encryptedData: {
    encryptedEmail?: string
    encryptedPhone?: string
    encryptedAddress?: string
    encryptedGstin?: string
  }): {
    email?: string
    phone?: string
    address?: string
    gstin?: string
  } {
    const decrypted: any = {}
    
    try {
      if (encryptedData.encryptedEmail) {
        decrypted.email = DataEncryptionService.decrypt(encryptedData.encryptedEmail)
      }
      
      if (encryptedData.encryptedPhone) {
        decrypted.phone = DataEncryptionService.decrypt(encryptedData.encryptedPhone)
      }
      
      if (encryptedData.encryptedAddress) {
        decrypted.address = DataEncryptionService.decrypt(encryptedData.encryptedAddress)
      }
      
      if (encryptedData.encryptedGstin) {
        decrypted.gstin = DataEncryptionService.decrypt(encryptedData.encryptedGstin)
      }
    } catch (error) {
      throw new Error('Failed to decrypt personal data: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
    
    return decrypted
  }
}

// Key rotation utilities
export class KeyRotationService {
  private static readonly keyHistory: Array<{ key: string; createdAt: Date; rotatedAt?: Date }> = []

  // Rotate encryption key (for production use)
  static rotateKey(): string {
    const oldKey = ENCRYPTION_KEY
    const newKey = EncryptionUtils.generateKey()
    
    // In production, this would update environment variables and re-encrypt data
    this.keyHistory.push({
      key: oldKey,
      createdAt: new Date(),
      rotatedAt: new Date()
    })
    
    console.warn('Key rotation initiated. All encrypted data needs to be re-encrypted with new key.')
    
    return newKey
  }

  // Get key history for audit purposes
  static getKeyHistory(): Array<{ keyId: string; createdAt: Date; rotatedAt?: Date }> {
    return this.keyHistory.map((entry, index) => ({
      keyId: `key-${index + 1}`,
      createdAt: entry.createdAt,
      rotatedAt: entry.rotatedAt
    }))
  }

  // Check if key rotation is needed (every 90 days recommended)
  static isRotationNeeded(): boolean {
    if (this.keyHistory.length === 0) return false
    
    const lastRotation = this.keyHistory[this.keyHistory.length - 1]?.rotatedAt || new Date(0)
    const daysSinceRotation = (Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24)
    
    return daysSinceRotation > 90
  }
}

// Secure data deletion utilities
export class SecureDataDeletion {
  // Securely delete sensitive data from memory
  static secureDelete(data: string | Buffer): void {
    if (typeof data === 'string') {
      // Overwrite string memory (limited effectiveness in JavaScript)
      const buffer = Buffer.from(data, 'utf8')
      buffer.fill(0)
    } else {
      // Overwrite buffer
      data.fill(0)
    }
  }

  // Create secure temporary storage for sensitive operations
  static createSecureContext<T>(operation: () => T): T {
    try {
      return operation()
    } finally {
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
    }
  }
}

// All classes are already exported above