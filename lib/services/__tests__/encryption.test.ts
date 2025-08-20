import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DataEncryptionService,
  SensitiveDataEncryption,
  KeyRotationService,
  SecureDataDeletion
} from '../encryption';

// Mock bcryptjs for testing
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockResolvedValue(true),
}));

describe('Encryption Services', () => {
  describe('DataEncryptionService', () => {
    describe('encrypt and decrypt', () => {
      it('should encrypt and decrypt data successfully', () => {
        const plaintext = 'sensitive information';
        const encrypted = DataEncryptionService.encrypt(plaintext);
        const decrypted = DataEncryptionService.decrypt(encrypted);
        
        expect(encrypted).not.toBe(plaintext);
        expect(decrypted).toBe(plaintext);
      });

      it('should produce different encrypted values for same input', () => {
        const plaintext = 'test data';
        const encrypted1 = DataEncryptionService.encrypt(plaintext);
        const encrypted2 = DataEncryptionService.encrypt(plaintext);
        
        expect(encrypted1).not.toBe(encrypted2);
        
        // But both should decrypt to the same value
        expect(DataEncryptionService.decrypt(encrypted1)).toBe(plaintext);
        expect(DataEncryptionService.decrypt(encrypted2)).toBe(plaintext);
      });

      it('should fail to decrypt tampered data', () => {
        const plaintext = 'test data';
        const encrypted = DataEncryptionService.encrypt(plaintext);
        
        // Tamper with the encrypted data
        const tamperedEncrypted = encrypted.slice(0, -5) + 'XXXXX';
        
        expect(() => {
          DataEncryptionService.decrypt(tamperedEncrypted);
        }).toThrow();
      });

      it('should fail to decrypt with invalid format', () => {
        expect(() => {
          DataEncryptionService.decrypt('invalid_format');
        }).toThrow('Invalid encrypted data format');
      });
    });

    describe('password hashing', () => {
      it('should hash passwords', async () => {
        const password = 'testPassword123!';
        const hash = await DataEncryptionService.hashPassword(password);
        
        expect(hash).toBe('hashed_password');
        expect(hash).not.toBe(password);
      });

      it('should verify passwords', async () => {
        const password = 'testPassword123!';
        const hash = 'hashed_password';
        
        const isValid = await DataEncryptionService.verifyPassword(password, hash);
        expect(isValid).toBe(true);
      });
    });

    describe('token generation', () => {
      it('should generate secure tokens', () => {
        const token = DataEncryptionService.generateSecureToken();
        expect(typeof token).toBe('string');
        expect(token.length).toBe(64); // 32 bytes * 2 (hex)
      });

      it('should generate tokens of specified length', () => {
        const token = DataEncryptionService.generateSecureToken(16);
        expect(token.length).toBe(32); // 16 bytes * 2 (hex)
      });

      it('should generate different tokens each time', () => {
        const token1 = DataEncryptionService.generateSecureToken();
        const token2 = DataEncryptionService.generateSecureToken();
        expect(token1).not.toBe(token2);
      });
    });

    describe('UUID generation', () => {
      it('should generate valid UUIDs', () => {
        const uuid = DataEncryptionService.generateUUID();
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(uuidRegex.test(uuid)).toBe(true);
      });

      it('should generate different UUIDs each time', () => {
        const uuid1 = DataEncryptionService.generateUUID();
        const uuid2 = DataEncryptionService.generateUUID();
        expect(uuid1).not.toBe(uuid2);
      });
    });

    describe('hash for index', () => {
      it('should create consistent hashes for indexing', () => {
        const data = 'test@example.com';
        const hash1 = DataEncryptionService.hashForIndex(data);
        const hash2 = DataEncryptionService.hashForIndex(data);
        
        expect(hash1).toBe(hash2);
        expect(hash1).not.toBe(data);
        expect(hash1.length).toBe(64); // SHA-256 hex output
      });

      it('should create different hashes for different data', () => {
        const hash1 = DataEncryptionService.hashForIndex('data1');
        const hash2 = DataEncryptionService.hashForIndex('data2');
        
        expect(hash1).not.toBe(hash2);
      });
    });

    describe('HMAC operations', () => {
      it('should create and verify HMAC', () => {
        const data = 'important data';
        const hmac = DataEncryptionService.createHMAC(data);
        
        expect(typeof hmac).toBe('string');
        expect(hmac.length).toBe(64); // SHA-256 hex output
        
        const isValid = DataEncryptionService.verifyHMAC(data, hmac);
        expect(isValid).toBe(true);
      });

      it('should fail verification with tampered data', () => {
        const data = 'important data';
        const hmac = DataEncryptionService.createHMAC(data);
        
        const tamperedData = 'tampered data';
        const isValid = DataEncryptionService.verifyHMAC(tamperedData, hmac);
        expect(isValid).toBe(false);
      });

      it('should fail verification with tampered HMAC', () => {
        const data = 'important data';
        const hmac = DataEncryptionService.createHMAC(data);
        
        const tamperedHmac = hmac.slice(0, -2) + 'XX';
        const isValid = DataEncryptionService.verifyHMAC(data, tamperedHmac);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('SensitiveDataEncryption', () => {
    describe('payment data encryption', () => {
      it('should encrypt payment data', () => {
        const paymentData = {
          cardNumber: '4111111111111111',
          expiryDate: '12/25',
          cvv: '123',
          bankAccount: '1234567890',
          routingNumber: '021000021'
        };

        const encrypted = SensitiveDataEncryption.encryptPaymentData(paymentData);
        
        expect(encrypted.encryptedCardNumber).toBeDefined();
        expect(encrypted.encryptedExpiryDate).toBeDefined();
        expect(encrypted.encryptedCvv).toBeDefined();
        expect(encrypted.encryptedBankAccount).toBeDefined();
        expect(encrypted.encryptedRoutingNumber).toBeDefined();
        
        // Verify card number is masked
        const decryptedCard = DataEncryptionService.decrypt(encrypted.encryptedCardNumber!);
        expect(decryptedCard).toBe('************1111');
      });

      it('should decrypt payment data', () => {
        const paymentData = {
          cardNumber: '4111111111111111',
          expiryDate: '12/25',
          bankAccount: '1234567890',
          routingNumber: '021000021'
        };

        const encrypted = SensitiveDataEncryption.encryptPaymentData(paymentData);
        const decrypted = SensitiveDataEncryption.decryptPaymentData(encrypted);
        
        expect(decrypted.cardNumber).toBe('************1111'); // Masked
        expect(decrypted.expiryDate).toBe('12/25');
        expect(decrypted.bankAccount).toBe('******7890'); // Masked
        expect(decrypted.routingNumber).toBe('021000021');
      });

      it('should handle partial payment data', () => {
        const paymentData = {
          cardNumber: '4111111111111111'
        };

        const encrypted = SensitiveDataEncryption.encryptPaymentData(paymentData);
        
        expect(encrypted.encryptedCardNumber).toBeDefined();
        expect(encrypted.encryptedExpiryDate).toBeUndefined();
        expect(encrypted.encryptedBankAccount).toBeUndefined();
      });
    });

    describe('personal data encryption', () => {
      it('should encrypt personal data', () => {
        const personalData = {
          email: 'test@example.com',
          phone: '+1234567890',
          address: '123 Main St, City, State',
          gstin: '22AAAAA0000A1Z5'
        };

        const encrypted = SensitiveDataEncryption.encryptPersonalData(personalData);
        
        expect(encrypted.encryptedEmail).toBeDefined();
        expect(encrypted.encryptedPhone).toBeDefined();
        expect(encrypted.encryptedAddress).toBeDefined();
        expect(encrypted.encryptedGstin).toBeDefined();
        expect(encrypted.emailHash).toBeDefined();
        
        // Verify email hash is consistent
        const hash1 = DataEncryptionService.hashForIndex('test@example.com');
        expect(encrypted.emailHash).toBe(hash1);
      });

      it('should decrypt personal data', () => {
        const personalData = {
          email: 'test@example.com',
          phone: '+1234567890',
          address: '123 Main St, City, State',
          gstin: '22AAAAA0000A1Z5'
        };

        const encrypted = SensitiveDataEncryption.encryptPersonalData(personalData);
        const decrypted = SensitiveDataEncryption.decryptPersonalData(encrypted);
        
        expect(decrypted.email).toBe('test@example.com');
        expect(decrypted.phone).toBe('+1234567890');
        expect(decrypted.address).toBe('123 Main St, City, State');
        expect(decrypted.gstin).toBe('22AAAAA0000A1Z5');
      });

      it('should handle partial personal data', () => {
        const personalData = {
          email: 'test@example.com'
        };

        const encrypted = SensitiveDataEncryption.encryptPersonalData(personalData);
        
        expect(encrypted.encryptedEmail).toBeDefined();
        expect(encrypted.emailHash).toBeDefined();
        expect(encrypted.encryptedPhone).toBeUndefined();
        expect(encrypted.encryptedAddress).toBeUndefined();
      });
    });
  });

  describe('KeyRotationService', () => {
    beforeEach(() => {
      // Clear key history before each test
      KeyRotationService.getKeyHistory().length = 0;
    });

    it('should rotate keys', () => {
      const newKey = KeyRotationService.rotateKey();
      
      expect(typeof newKey).toBe('string');
      expect(newKey.length).toBe(64); // 32 bytes * 2 (hex)
      
      const history = KeyRotationService.getKeyHistory();
      expect(history.length).toBe(1);
      expect(history[0].rotatedAt).toBeDefined();
    });

    it('should track key history', () => {
      KeyRotationService.rotateKey();
      KeyRotationService.rotateKey();
      
      const history = KeyRotationService.getKeyHistory();
      expect(history.length).toBe(2);
      expect(history[0].keyId).toBe('key-1');
      expect(history[1].keyId).toBe('key-2');
    });

    it('should check if rotation is needed', () => {
      // Initially no rotation needed (no history)
      expect(KeyRotationService.isRotationNeeded()).toBe(false);
      
      // Mock old rotation date
      const originalNow = Date.now;
      Date.now = vi.fn(() => 1000000);
      
      KeyRotationService.rotateKey();
      
      // Advance time by 91 days
      Date.now = vi.fn(() => 1000000 + (91 * 24 * 60 * 60 * 1000));
      
      expect(KeyRotationService.isRotationNeeded()).toBe(true);
      
      Date.now = originalNow;
    });
  });

  describe('SecureDataDeletion', () => {
    it('should securely delete string data', () => {
      const sensitiveData = 'sensitive information';
      
      // This test mainly ensures the function doesn't throw
      expect(() => {
        SecureDataDeletion.secureDelete(sensitiveData);
      }).not.toThrow();
    });

    it('should securely delete buffer data', () => {
      const buffer = Buffer.from('sensitive data', 'utf8');
      const originalData = buffer.toString();
      
      SecureDataDeletion.secureDelete(buffer);
      
      // Buffer should be zeroed out
      expect(buffer.toString()).not.toBe(originalData);
      expect(buffer.every(byte => byte === 0)).toBe(true);
    });

    it('should create secure context for operations', () => {
      const result = SecureDataDeletion.createSecureContext(() => {
        return 'operation result';
      });
      
      expect(result).toBe('operation result');
    });

    it('should handle errors in secure context', () => {
      expect(() => {
        SecureDataDeletion.createSecureContext(() => {
          throw new Error('test error');
        });
      }).toThrow('test error');
    });
  });
});