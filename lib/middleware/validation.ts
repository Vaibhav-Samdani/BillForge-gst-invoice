import { NextRequest, NextResponse } from 'next/server'
import { InputValidator, SecurityMonitor } from '@/lib/utils/security'

// Validation result interface
interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
}

// Simple validation functions
export class SimpleValidator {
  static validateLogin(data: any): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.email || !InputValidator.isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Valid email is required' });
    }

    if (!data.password || typeof data.password !== 'string' || data.password.length < 1) {
      errors.push({ field: 'password', message: 'Password is required' });
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateRegister(data: any): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.email || !InputValidator.isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Valid email is required' });
    }

    if (!data.password || typeof data.password !== 'string' || data.password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 1) {
      errors.push({ field: 'name', message: 'Name is required' });
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateInvoice(data: any): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.invoiceNumber || !InputValidator.validateInvoiceNumber(data.invoiceNumber)) {
      errors.push({ field: 'invoiceNumber', message: 'Valid invoice number is required' });
    }

    if (!data.clientData || typeof data.clientData !== 'object') {
      errors.push({ field: 'clientData', message: 'Client data is required' });
    } else {
      if (!data.clientData.name || typeof data.clientData.name !== 'string') {
        errors.push({ field: 'clientData.name', message: 'Client name is required' });
      }
      if (!data.clientData.email || !InputValidator.isValidEmail(data.clientData.email)) {
        errors.push({ field: 'clientData.email', message: 'Valid client email is required' });
      }
    }

    if (!data.businessData || typeof data.businessData !== 'object') {
      errors.push({ field: 'businessData', message: 'Business data is required' });
    } else {
      if (!data.businessData.name || typeof data.businessData.name !== 'string') {
        errors.push({ field: 'businessData.name', message: 'Business name is required' });
      }
      if (!data.businessData.email || !InputValidator.isValidEmail(data.businessData.email)) {
        errors.push({ field: 'businessData.email', message: 'Valid business email is required' });
      }
    }

    if (!Array.isArray(data.lineItems) || data.lineItems.length === 0) {
      errors.push({ field: 'lineItems', message: 'At least one line item is required' });
    }

    return { isValid: errors.length === 0, errors };
  }

  static validatePayment(data: any): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.invoiceId || typeof data.invoiceId !== 'string') {
      errors.push({ field: 'invoiceId', message: 'Invoice ID is required' });
    }

    const amountValidation = InputValidator.validateCurrencyAmount(data.amount);
    if (!amountValidation.valid) {
      errors.push({ field: 'amount', message: amountValidation.error || 'Valid amount is required' });
    }

    if (!data.currency || typeof data.currency !== 'string' || data.currency.length !== 3) {
      errors.push({ field: 'currency', message: 'Valid 3-letter currency code is required' });
    }

    const validPaymentMethods = ['card', 'bank_transfer', 'paypal'];
    if (!data.paymentMethod || !validPaymentMethods.includes(data.paymentMethod)) {
      errors.push({ field: 'paymentMethod', message: 'Valid payment method is required' });
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateRecurringInvoice(data: any): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    const validFrequencies = ['weekly', 'monthly', 'quarterly', 'yearly'];
    if (!data.frequency || !validFrequencies.includes(data.frequency)) {
      errors.push({ field: 'frequency', message: 'Valid frequency is required' });
    }

    if (!data.interval || typeof data.interval !== 'number' || data.interval < 1 || data.interval > 12) {
      errors.push({ field: 'interval', message: 'Interval must be between 1 and 12' });
    }

    if (!data.startDate || typeof data.startDate !== 'string') {
      errors.push({ field: 'startDate', message: 'Start date is required' });
    }

    return { isValid: errors.length === 0, errors };
  }
}

// Validation schemas mapping
export const validationSchemas = {
  login: SimpleValidator.validateLogin,
  register: SimpleValidator.validateRegister,
  resetPassword: SimpleValidator.validateRegister, // Reuse register validation
  invoice: SimpleValidator.validateInvoice,
  payment: SimpleValidator.validatePayment,
  recurringInvoice: SimpleValidator.validateRecurringInvoice,
}

// Input sanitization functions
export class InputSanitizer {
  // Sanitize string inputs to prevent XSS
  static sanitizeString(input: string): string {
    return InputValidator.sanitizeHtml(input.trim())
  }

  // Sanitize and validate email
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim()
  }

  // Sanitize phone numbers
  static sanitizePhone(phone: string): string {
    return phone.replace(/[^\+0-9\s\-\(\)]/g, '').trim()
  }

  // Sanitize currency amounts
  static sanitizeCurrencyAmount(amount: any): number {
    const result = InputValidator.validateCurrencyAmount(amount)
    if (!result.valid) {
      throw new Error(result.error || 'Invalid amount')
    }
    return result.value!
  }

  // Sanitize invoice number
  static sanitizeInvoiceNumber(invoiceNumber: string): string {
    return invoiceNumber.replace(/[^a-zA-Z0-9\-_]/g, '').trim()
  }

  // Deep sanitize object recursively
  static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj)
    }

    if (typeof obj === 'number') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item))
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value)
      }
      return sanitized
    }

    return obj
  }
}

// Validation middleware factory
export function createValidationMiddleware(schemaName: keyof typeof validationSchemas) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json()
      const validator = validationSchemas[schemaName]

      // Sanitize input first
      const sanitizedBody = InputSanitizer.sanitizeObject(body)

      // Validate against schema
      const validationResult = validator(sanitizedBody)

      if (!validationResult.isValid) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validationResult.errors
          },
          { status: 400 }
        )
      }

      // Additional custom validations
      if (schemaName === 'register' || schemaName === 'resetPassword') {
        const passwordValidation = InputValidator.isStrongPassword(sanitizedBody.password)
        if (!passwordValidation.valid) {
          SecurityMonitor.logSecurityEvent(
            'weak_password_attempt',
            'medium',
            { errors: passwordValidation.errors },
            request
          )
          return NextResponse.json(
            { error: 'Password does not meet security requirements', details: passwordValidation.errors },
            { status: 400 }
          )
        }
      }

      if (schemaName === 'invoice') {
        // Validate GST numbers if provided
        if (sanitizedBody.clientData?.gstin && !InputValidator.validateGSTNumber(sanitizedBody.clientData.gstin)) {
          return NextResponse.json(
            { error: 'Invalid client GST number format' },
            { status: 400 }
          )
        }

        if (sanitizedBody.businessData?.gstin && !InputValidator.validateGSTNumber(sanitizedBody.businessData.gstin)) {
          return NextResponse.json(
            { error: 'Invalid business GST number format' },
            { status: 400 }
          )
        }
      }

      // Return validated and sanitized data
      return { validatedData: sanitizedBody, error: null }

    } catch (error: unknown) {
      SecurityMonitor.logSecurityEvent(
        'validation_error',
        'low',
        { schema: schemaName, error: error instanceof Error ? error.message : 'Unknown error' },
        request
      )

      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }
  }
}

// File upload validation
export class FileUploadValidator {
  private static readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]

  private static readonly maxFileSize = 10 * 1024 * 1024 // 10MB

  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.maxFileSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' }
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' }
    }

    // Check file name for suspicious patterns
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i
    ]

    if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
      return { valid: false, error: 'File type not allowed' }
    }

    return { valid: true }
  }

  static sanitizeFileName(fileName: string): string {
    // Remove or replace dangerous characters
    return fileName
      .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100) // Limit length
  }
}

// Request size limiter
export function createRequestSizeLimiter(maxSize: number = 1024 * 1024) { // 1MB default
  return async (request: NextRequest) => {
    const contentLength = request.headers.get('content-length')

    if (contentLength && parseInt(contentLength) > maxSize) {
      SecurityMonitor.logSecurityEvent(
        'request_size_exceeded',
        'medium',
        { size: contentLength, limit: maxSize },
        request
      )
      return NextResponse.json(
        { error: 'Request size too large' },
        { status: 413 }
      )
    }

    return null
  }
}

// SQL injection detection
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /(\'|\"|;|--|\*|\/\*|\*\/)/,
    /(\b(or|and)\b\s*\d+\s*=\s*\d+)/i,
    /(\b(or|and)\b\s*\'\w*\'\s*=\s*\'\w*\')/i,
    /(benchmark|sleep|waitfor|delay)\s*\(/i
  ]

  return sqlPatterns.some(pattern => pattern.test(input))
}

// XSS detection
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi
  ]

  return xssPatterns.some(pattern => pattern.test(input))
}