// Security utilities and audit functions
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

// Rate limiting implementation
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): { allowed: boolean; resetTime?: number; remaining?: number } {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    if (record.count >= this.maxRequests) {
      return {
        allowed: false,
        resetTime: record.resetTime,
        remaining: 0
      };
    }

    record.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - record.count
    };
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Global rate limiters for different endpoints
export const authRateLimiter = new RateLimiter(900000, 5); // 5 attempts per 15 minutes
export const paymentRateLimiter = new RateLimiter(60000, 10); // 10 attempts per minute
export const apiRateLimiter = new RateLimiter(60000, 100); // 100 requests per minute

// Input validation and sanitization
export class InputValidator {
  // Email validation
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Password strength validation
  static isStrongPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { valid: errors.length === 0, errors };
  }

  // Sanitize HTML input to prevent XSS
  static sanitizeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Validate and sanitize currency amounts
  static validateCurrencyAmount(amount: any): { valid: boolean; value?: number; error?: string } {
    if (typeof amount === 'string') {
      amount = parseFloat(amount);
    }

    if (typeof amount !== 'number' || isNaN(amount)) {
      return { valid: false, error: 'Invalid amount format' };
    }

    if (amount < 0) {
      return { valid: false, error: 'Amount cannot be negative' };
    }

    if (amount > 999999999.99) {
      return { valid: false, error: 'Amount exceeds maximum limit' };
    }

    // Round to 2 decimal places
    const roundedAmount = Math.round(amount * 100) / 100;

    return { valid: true, value: roundedAmount };
  }

  // Validate invoice number format
  static validateInvoiceNumber(invoiceNumber: string): boolean {
    // Allow alphanumeric characters, hyphens, and underscores
    const invoiceRegex = /^[a-zA-Z0-9\-_]{1,50}$/;
    return invoiceRegex.test(invoiceNumber);
  }

  // Validate GST number format (Indian GST)
  static validateGSTNumber(gstin: string): boolean {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstin);
  }
}

// CSRF protection utilities
export class CSRFProtection {
  private static tokens = new Map<string, { token: string; expires: number }>();

  static generateToken(sessionId: string): string {
    const token = crypto.randomUUID();
    const expires = Date.now() + 3600000; // 1 hour expiry

    this.tokens.set(sessionId, { token, expires });
    return token;
  }

  static validateToken(sessionId: string, token: string): boolean {
    const record = this.tokens.get(sessionId);

    if (!record) {
      return false;
    }

    if (Date.now() > record.expires) {
      this.tokens.delete(sessionId);
      return false;
    }

    return record.token === token;
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [sessionId, record] of this.tokens.entries()) {
      if (now > record.expires) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

// Security headers configuration
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.exchangerate-api.com",
    "frame-ancestors 'none'"
  ].join('; ')
};

// Security audit functions
export class SecurityAuditor {
  // Check for common security vulnerabilities
  static auditRequest(request: NextRequest): {
    passed: boolean;
    issues: string[];
    recommendations: string[]
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for HTTPS
    if (!request.url.startsWith('https://') && process.env.NODE_ENV === 'production') {
      issues.push('Request not using HTTPS in production');
      recommendations.push('Enforce HTTPS for all requests');
    }

    // Check for suspicious user agents
    const userAgent = request.headers.get('user-agent') || '';
    const suspiciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /nessus/i,
      /burp/i,
      /nmap/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      issues.push('Suspicious user agent detected');
      recommendations.push('Monitor and potentially block suspicious requests');
    }

    // Check for SQL injection patterns in query parameters
    const url = new URL(request.url);
    const queryString = url.search;
    const sqlInjectionPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
      /(\'|\"|;|--|\*|\/\*|\*\/)/,
      /(\b(or|and)\b\s*\d+\s*=\s*\d+)/i
    ];

    if (sqlInjectionPatterns.some(pattern => pattern.test(queryString))) {
      issues.push('Potential SQL injection attempt detected');
      recommendations.push('Implement parameterized queries and input validation');
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi
    ];

    if (xssPatterns.some(pattern => pattern.test(queryString))) {
      issues.push('Potential XSS attempt detected');
      recommendations.push('Implement proper input sanitization and CSP headers');
    }

    return {
      passed: issues.length === 0,
      issues,
      recommendations
    };
  }

  // Audit password policies
  static auditPasswordPolicy(passwords: string[]): {
    weakPasswords: number;
    commonPatterns: string[];
    recommendations: string[];
  } {
    const commonPatterns: string[] = [];
    let weakPasswords = 0;

    const commonWeakPatterns = [
      /^password/i,
      /^123456/,
      /^qwerty/i,
      /^admin/i,
      /^letmein/i
    ];

    passwords.forEach(password => {
      const { valid } = InputValidator.isStrongPassword(password);
      if (!valid) {
        weakPasswords++;
      }

      commonWeakPatterns.forEach(pattern => {
        if (pattern.test(password)) {
          commonPatterns.push(pattern.source);
        }
      });
    });

    const recommendations = [
      'Enforce strong password policies',
      'Implement password complexity requirements',
      'Use password strength meters',
      'Encourage use of password managers',
      'Implement account lockout after failed attempts'
    ];

    return {
      weakPasswords,
      commonPatterns: [...new Set(commonPatterns)],
      recommendations
    };
  }

  // Audit API endpoints for security issues
  static auditAPIEndpoint(endpoint: string, method: string): {
    securityScore: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let securityScore = 100;

    // Check for sensitive endpoints without authentication
    const sensitiveEndpoints = ['/api/admin', '/api/payments', '/api/users'];
    if (sensitiveEndpoints.some(sensitive => endpoint.includes(sensitive))) {
      issues.push('Sensitive endpoint may lack proper authentication');
      recommendations.push('Implement proper authentication and authorization');
      securityScore -= 30;
    }

    // Check for endpoints that should use POST instead of GET
    if (method === 'GET' && (endpoint.includes('delete') || endpoint.includes('update'))) {
      issues.push('Potentially unsafe HTTP method for destructive operation');
      recommendations.push('Use POST/PUT/DELETE for state-changing operations');
      securityScore -= 20;
    }

    // Check for missing rate limiting indicators
    if (endpoint.includes('/api/auth/') || endpoint.includes('/api/payment')) {
      recommendations.push('Implement rate limiting for authentication and payment endpoints');
    }

    return {
      securityScore: Math.max(0, securityScore),
      issues,
      recommendations
    };
  }
}

// Encryption utilities for sensitive data
export class EncryptionUtils {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32;

  // Generate a secure random key
  static generateKey(): string {
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
      const array = new Uint8Array(this.keyLength);
      globalThis.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Fallback for Node.js environment
    const nodeCrypto = require('crypto');
    return nodeCrypto.randomBytes(this.keyLength).toString('hex');
  }

  // Encrypt sensitive data
  static encrypt(text: string, key: string): { encrypted: string; iv: string; tag: string } {
    const nodeCrypto = require('crypto');
    const iv = nodeCrypto.randomBytes(16);
    const cipher = nodeCrypto.createCipher(this.algorithm, Buffer.from(key, 'hex'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  // Decrypt sensitive data
  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }, key: string): string {
    const nodeCrypto = require('crypto');
    const decipher = nodeCrypto.createDecipher(this.algorithm, Buffer.from(key, 'hex'));

    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Security monitoring and logging
export class SecurityMonitor {
  private static securityEvents: Array<{
    timestamp: Date;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: any;
    ip?: string;
    userAgent?: string;
  }> = [];

  static logSecurityEvent(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any,
    request?: NextRequest
  ): void {
    // Extract IP address from headers (common proxy headers)
    const getClientIP = (req: NextRequest): string => {
      const forwarded = req.headers.get('x-forwarded-for');
      const realIP = req.headers.get('x-real-ip');
      const cfConnectingIP = req.headers.get('cf-connecting-ip');

      if (forwarded) {
        return forwarded.split(',')[0].trim();
      }
      if (realIP) {
        return realIP;
      }
      if (cfConnectingIP) {
        return cfConnectingIP;
      }

      return 'unknown';
    };

    const event = {
      timestamp: new Date(),
      type,
      severity,
      details,
      ip: request ? getClientIP(request) : 'unknown',
      userAgent: request?.headers.get('user-agent') || 'unknown'
    };

    this.securityEvents.push(event);

    // Log critical events immediately
    if (severity === 'critical') {
      console.error('CRITICAL SECURITY EVENT:', event);
      // In production, this would trigger alerts
    }

    // Keep only last 1000 events to prevent memory issues
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }
  }

  static getSecurityEvents(
    severity?: 'low' | 'medium' | 'high' | 'critical',
    limit: number = 100
  ): typeof SecurityMonitor.securityEvents {
    let events = this.securityEvents;

    if (severity) {
      events = events.filter(event => event.severity === severity);
    }

    return events.slice(-limit);
  }

  static getSecuritySummary(): {
    totalEvents: number;
    eventsBySeverity: Record<string, number>;
    recentEvents: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    const eventsBySeverity = this.securityEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentEvents = this.securityEvents.filter(
      event => event.timestamp.getTime() > oneHourAgo
    ).length;

    return {
      totalEvents: this.securityEvents.length,
      eventsBySeverity,
      recentEvents
    };
  }
}

// All classes are already exported above