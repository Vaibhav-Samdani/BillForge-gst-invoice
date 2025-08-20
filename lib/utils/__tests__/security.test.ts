import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  apiRateLimiter,
  InputValidator,
  CSRFProtection,
  SecurityAuditor,
  SecurityMonitor,
  EncryptionUtils
} from '../security';
import { NextRequest } from 'next/server';

describe('Security Utilities', () => {
  describe('apiRateLimiter', () => {
    beforeEach(() => {
      // Reset the rate limiter before each test
      apiRateLimiter.reset('test-ip');
      apiRateLimiter.cleanup();
    });

    it('should allow requests within limit', () => {
      const result = apiRateLimiter.isAllowed('test-ip');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99); // apiRateLimiter allows 100 requests per minute
    });

    it('should block requests exceeding limit', () => {
      // Make 100 requests (the limit for apiRateLimiter)
      for (let i = 0; i < 100; i++) {
        apiRateLimiter.isAllowed('test-ip');
      }

      // 101st request should be blocked
      const result = apiRateLimiter.isAllowed('test-ip');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after window expires', () => {
      // Mock Date.now to simulate time passage
      const originalNow = Date.now;
      let currentTime = 1000000;
      Date.now = vi.fn(() => currentTime);

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        apiRateLimiter.isAllowed('test-ip');
      }

      // Should be blocked
      expect(apiRateLimiter.isAllowed('test-ip').allowed).toBe(false);

      // Advance time beyond window (60 seconds + 1)
      currentTime += 61000;

      // Should be allowed again
      expect(apiRateLimiter.isAllowed('test-ip').allowed).toBe(true);

      // Restore original Date.now
      Date.now = originalNow;
    });
  });

  describe('InputValidator', () => {
    describe('isValidEmail', () => {
      it('should validate correct email addresses', () => {
        expect(InputValidator.isValidEmail('test@example.com')).toBe(true);
        expect(InputValidator.isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      });

      it('should reject invalid email addresses', () => {
        expect(InputValidator.isValidEmail('invalid-email')).toBe(false);
        expect(InputValidator.isValidEmail('@domain.com')).toBe(false);
        expect(InputValidator.isValidEmail('user@')).toBe(false);
        expect(InputValidator.isValidEmail('')).toBe(false);
      });

      it('should reject emails that are too long', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        expect(InputValidator.isValidEmail(longEmail)).toBe(false);
      });
    });

    describe('isStrongPassword', () => {
      it('should validate strong passwords', () => {
        const result = InputValidator.isStrongPassword('StrongPass123!');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject weak passwords', () => {
        const result = InputValidator.isStrongPassword('weak');
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should require minimum length', () => {
        const result = InputValidator.isStrongPassword('Sh0rt!');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
      });

      it('should require uppercase letters', () => {
        const result = InputValidator.isStrongPassword('lowercase123!');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
      });

      it('should require lowercase letters', () => {
        const result = InputValidator.isStrongPassword('UPPERCASE123!');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
      });

      it('should require numbers', () => {
        const result = InputValidator.isStrongPassword('NoNumbers!');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one number');
      });

      it('should require special characters', () => {
        const result = InputValidator.isStrongPassword('NoSpecialChars123');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one special character');
      });
    });

    describe('sanitizeHtml', () => {
      it('should escape HTML characters', () => {
        const input = '<script>alert("xss")</script>';
        const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
        expect(InputValidator.sanitizeHtml(input)).toBe(expected);
      });

      it('should escape ampersands', () => {
        expect(InputValidator.sanitizeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
      });

      it('should escape quotes', () => {
        expect(InputValidator.sanitizeHtml('Say "hello"')).toBe('Say &quot;hello&quot;');
        expect(InputValidator.sanitizeHtml("Say 'hello'")).toBe('Say &#x27;hello&#x27;');
      });
    });

    describe('validateCurrencyAmount', () => {
      it('should validate positive numbers', () => {
        const result = InputValidator.validateCurrencyAmount(123.45);
        expect(result.valid).toBe(true);
        expect(result.value).toBe(123.45);
      });

      it('should validate string numbers', () => {
        const result = InputValidator.validateCurrencyAmount('123.45');
        expect(result.valid).toBe(true);
        expect(result.value).toBe(123.45);
      });

      it('should reject negative amounts', () => {
        const result = InputValidator.validateCurrencyAmount(-10);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Amount cannot be negative');
      });

      it('should reject invalid formats', () => {
        const result = InputValidator.validateCurrencyAmount('not-a-number');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid amount format');
      });

      it('should reject amounts exceeding maximum', () => {
        const result = InputValidator.validateCurrencyAmount(1000000000);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Amount exceeds maximum limit');
      });

      it('should round to 2 decimal places', () => {
        const result = InputValidator.validateCurrencyAmount(123.456);
        expect(result.valid).toBe(true);
        expect(result.value).toBe(123.46);
      });
    });

    describe('validateInvoiceNumber', () => {
      it('should validate alphanumeric invoice numbers', () => {
        expect(InputValidator.validateInvoiceNumber('INV-001')).toBe(true);
        expect(InputValidator.validateInvoiceNumber('INVOICE_2023_001')).toBe(true);
        expect(InputValidator.validateInvoiceNumber('ABC123')).toBe(true);
      });

      it('should reject invalid characters', () => {
        expect(InputValidator.validateInvoiceNumber('INV@001')).toBe(false);
        expect(InputValidator.validateInvoiceNumber('INV 001')).toBe(false);
        expect(InputValidator.validateInvoiceNumber('INV#001')).toBe(false);
      });

      it('should reject empty or too long invoice numbers', () => {
        expect(InputValidator.validateInvoiceNumber('')).toBe(false);
        expect(InputValidator.validateInvoiceNumber('A'.repeat(51))).toBe(false);
      });
    });

    describe('validateGSTNumber', () => {
      it('should validate correct GST format', () => {
        expect(InputValidator.validateGSTNumber('22AAAAA0000A1Z5')).toBe(true);
        expect(InputValidator.validateGSTNumber('09ABCDE1234F1Z8')).toBe(true);
      });

      it('should reject incorrect GST format', () => {
        expect(InputValidator.validateGSTNumber('INVALID')).toBe(false);
        expect(InputValidator.validateGSTNumber('22AAAAA0000A1Z')).toBe(false); // Too short
        expect(InputValidator.validateGSTNumber('22AAAAA0000A1Z55')).toBe(false); // Too long
        expect(InputValidator.validateGSTNumber('22aaaaa0000a1z5')).toBe(false); // Lowercase
      });
    });
  });

  describe('CSRFProtection', () => {
    beforeEach(() => {
      // Clear tokens before each test
      CSRFProtection.cleanup();
    });

    it('should generate and validate CSRF tokens', () => {
      const sessionId = 'test-session';
      const token = CSRFProtection.generateToken(sessionId);
      
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(CSRFProtection.validateToken(sessionId, token)).toBe(true);
    });

    it('should reject invalid tokens', () => {
      const sessionId = 'test-session';
      CSRFProtection.generateToken(sessionId);
      
      expect(CSRFProtection.validateToken(sessionId, 'invalid-token')).toBe(false);
    });

    it('should reject tokens for different sessions', () => {
      const token = CSRFProtection.generateToken('session-1');
      expect(CSRFProtection.validateToken('session-2', token)).toBe(false);
    });

    it('should expire tokens after timeout', () => {
      const originalNow = Date.now;
      let currentTime = 1000000;
      Date.now = vi.fn(() => currentTime);

      const sessionId = 'test-session';
      const token = CSRFProtection.generateToken(sessionId);
      
      // Should be valid initially
      expect(CSRFProtection.validateToken(sessionId, token)).toBe(true);
      
      // Advance time beyond expiry (1 hour + 1 second)
      currentTime += 3601000;
      
      // Should be invalid after expiry
      expect(CSRFProtection.validateToken(sessionId, token)).toBe(false);

      Date.now = originalNow;
    });
  });

  describe('SecurityAuditor', () => {
    describe('auditRequest', () => {
      it('should pass clean requests', () => {
        const request = new NextRequest('https://example.com/api/test', {
          method: 'GET',
          headers: {
            'user-agent': 'Mozilla/5.0 (compatible browser)'
          }
        });

        const result = SecurityAuditor.auditRequest(request);
        expect(result.passed).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it('should detect suspicious user agents', () => {
        const request = new NextRequest('https://example.com/api/test', {
          method: 'GET',
          headers: {
            'user-agent': 'sqlmap/1.0'
          }
        });

        const result = SecurityAuditor.auditRequest(request);
        expect(result.passed).toBe(false);
        expect(result.issues).toContain('Suspicious user agent detected');
      });

      it('should detect SQL injection patterns', () => {
        const request = new NextRequest('https://example.com/api/test?id=1 UNION SELECT * FROM users', {
          method: 'GET'
        });

        const result = SecurityAuditor.auditRequest(request);
        expect(result.passed).toBe(false);
        expect(result.issues).toContain('Potential SQL injection attempt detected');
      });

      it('should detect XSS patterns', () => {
        const request = new NextRequest('https://example.com/api/test?data=<script>alert(1)</script>', {
          method: 'GET'
        });

        const result = SecurityAuditor.auditRequest(request);
        expect(result.passed).toBe(false);
        expect(result.issues).toContain('Potential XSS attempt detected');
      });
    });

    describe('auditPasswordPolicy', () => {
      it('should identify weak passwords', () => {
        const passwords = ['password123', 'qwerty', 'StrongPass123!', 'admin'];
        const result = SecurityAuditor.auditPasswordPolicy(passwords);
        
        expect(result.weakPasswords).toBe(3); // Only 'StrongPass123!' is strong
        expect(result.commonPatterns.length).toBeGreaterThan(0);
        expect(result.recommendations.length).toBeGreaterThan(0);
      });
    });

    describe('auditAPIEndpoint', () => {
      it('should flag sensitive endpoints', () => {
        const result = SecurityAuditor.auditAPIEndpoint('/api/admin/users', 'GET');
        expect(result.securityScore).toBeLessThan(100);
        expect(result.issues).toContain('Sensitive endpoint may lack proper authentication');
      });

      it('should flag unsafe HTTP methods', () => {
        const result = SecurityAuditor.auditAPIEndpoint('/api/delete-user', 'GET');
        expect(result.securityScore).toBeLessThan(100);
        expect(result.issues).toContain('Potentially unsafe HTTP method for destructive operation');
      });
    });
  });

  describe('SecurityMonitor', () => {
    beforeEach(() => {
      // Clear events before each test
      SecurityMonitor.getSecurityEvents().length = 0;
    });

    it('should log security events', () => {
      SecurityMonitor.logSecurityEvent('test_event', 'medium', { test: 'data' });
      
      const events = SecurityMonitor.getSecurityEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('test_event');
      expect(events[0].severity).toBe('medium');
      expect(events[0].details).toEqual({ test: 'data' });
    });

    it('should filter events by severity', () => {
      SecurityMonitor.logSecurityEvent('low_event', 'low', {});
      SecurityMonitor.logSecurityEvent('high_event', 'high', {});
      SecurityMonitor.logSecurityEvent('critical_event', 'critical', {});
      
      const highEvents = SecurityMonitor.getSecurityEvents('high');
      expect(highEvents).toHaveLength(1);
      expect(highEvents[0].type).toBe('high_event');
    });

    it('should provide security summary', () => {
      SecurityMonitor.logSecurityEvent('event1', 'low', {});
      SecurityMonitor.logSecurityEvent('event2', 'high', {});
      SecurityMonitor.logSecurityEvent('event3', 'critical', {});
      
      const summary = SecurityMonitor.getSecuritySummary();
      expect(summary.totalEvents).toBe(3);
      expect(summary.eventsBySeverity.low).toBe(1);
      expect(summary.eventsBySeverity.high).toBe(1);
      expect(summary.eventsBySeverity.critical).toBe(1);
    });
  });

  describe('EncryptionUtils', () => {
    it('should generate secure keys', () => {
      const key = EncryptionUtils.generateKey();
      expect(typeof key).toBe('string');
      expect(key.length).toBe(64); // 32 bytes * 2 (hex encoding)
    });

    it('should encrypt and decrypt data', () => {
      const key = EncryptionUtils.generateKey();
      const plaintext = 'sensitive data';
      
      const encrypted = EncryptionUtils.encrypt(plaintext, key);
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      
      const decrypted = EncryptionUtils.decrypt(encrypted, key);
      expect(decrypted).toBe(plaintext);
    });

    it('should fail to decrypt with wrong key', () => {
      const key1 = EncryptionUtils.generateKey();
      const key2 = EncryptionUtils.generateKey();
      const plaintext = 'sensitive data';
      
      const encrypted = EncryptionUtils.encrypt(plaintext, key1);
      
      expect(() => {
        EncryptionUtils.decrypt(encrypted, key2);
      }).toThrow();
    });
  });
});