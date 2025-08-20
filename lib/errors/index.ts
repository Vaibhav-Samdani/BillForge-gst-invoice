// Base error class for all application errors
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(message: string, public readonly context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack
    };
  }
}

// Currency-related errors
export class CurrencyError extends AppError {
  readonly isOperational = true;
  readonly statusCode = 400;

  constructor(message: string, public readonly code: CurrencyErrorCode, context?: Record<string, any>) {
    super(message, context);
  }
}

export enum CurrencyErrorCode {
  API_UNAVAILABLE = 'CURRENCY_API_UNAVAILABLE',
  INVALID_CURRENCY_CODE = 'INVALID_CURRENCY_CODE',
  EXCHANGE_RATE_STALE = 'EXCHANGE_RATE_STALE',
  CONVERSION_FAILED = 'CONVERSION_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNSUPPORTED_CONVERSION = 'UNSUPPORTED_CONVERSION'
}

// Authentication-related errors
export class AuthError extends AppError {
  readonly isOperational = true;

  constructor(message: string, public readonly code: AuthErrorCode, context?: Record<string, any>) {
    super(message, context);
  }

  get statusCode(): number {
    switch (this.code) {
      case AuthErrorCode.INVALID_CREDENTIALS:
      case AuthErrorCode.EMAIL_NOT_VERIFIED:
      case AuthErrorCode.WEAK_PASSWORD:
        return 400;
      case AuthErrorCode.UNAUTHORIZED:
      case AuthErrorCode.TOKEN_EXPIRED:
      case AuthErrorCode.INVALID_TOKEN:
        return 401;
      case AuthErrorCode.ACCOUNT_LOCKED:
      case AuthErrorCode.ACCESS_DENIED:
        return 403;
      case AuthErrorCode.USER_NOT_FOUND:
        return 404;
      case AuthErrorCode.RATE_LIMITED:
        return 429;
      default:
        return 500;
    }
  }
}

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  RATE_LIMITED = 'RATE_LIMITED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  ACCESS_DENIED = 'ACCESS_DENIED',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS'
}

// Payment-related errors
export class PaymentError extends AppError {
  readonly isOperational = true;

  constructor(
    message: string, 
    public readonly code: PaymentErrorCode, 
    public readonly retryable: boolean = false,
    context?: Record<string, any>
  ) {
    super(message, context);
  }

  get statusCode(): number {
    switch (this.code) {
      case PaymentErrorCode.INVALID_PAYMENT_METHOD:
      case PaymentErrorCode.INVALID_AMOUNT:
      case PaymentErrorCode.CURRENCY_MISMATCH:
        return 400;
      case PaymentErrorCode.INSUFFICIENT_FUNDS:
      case PaymentErrorCode.PAYMENT_DECLINED:
        return 402;
      case PaymentErrorCode.INVOICE_NOT_FOUND:
        return 404;
      case PaymentErrorCode.INVOICE_ALREADY_PAID:
        return 409;
      case PaymentErrorCode.RATE_LIMITED:
        return 429;
      case PaymentErrorCode.PAYMENT_PROCESSOR_ERROR:
      case PaymentErrorCode.REFUND_FAILED:
      default:
        return 500;
    }
  }
}

export enum PaymentErrorCode {
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  PAYMENT_PROCESSOR_ERROR = 'PAYMENT_PROCESSOR_ERROR',
  INVALID_PAYMENT_METHOD = 'INVALID_PAYMENT_METHOD',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVOICE_NOT_FOUND = 'INVOICE_NOT_FOUND',
  INVOICE_ALREADY_PAID = 'INVOICE_ALREADY_PAID',
  REFUND_FAILED = 'REFUND_FAILED',
  CURRENCY_MISMATCH = 'CURRENCY_MISMATCH',
  RATE_LIMITED = 'RATE_LIMITED'
}

// Recurring invoice errors
export class RecurringError extends AppError {
  readonly isOperational = true;
  readonly statusCode = 400;

  constructor(message: string, public readonly code: RecurringErrorCode, context?: Record<string, any>) {
    super(message, context);
  }
}

export enum RecurringErrorCode {
  INVALID_SCHEDULE = 'INVALID_SCHEDULE',
  GENERATION_FAILED = 'GENERATION_FAILED',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  SCHEDULE_CONFLICT = 'SCHEDULE_CONFLICT',
  MAX_OCCURRENCES_REACHED = 'MAX_OCCURRENCES_REACHED'
}

// Validation errors
export class ValidationError extends AppError {
  readonly isOperational = true;
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';

  constructor(message: string, public readonly field?: string, context?: Record<string, any>) {
    super(message, context);
  }
}

// Database errors
export class DatabaseError extends AppError {
  readonly isOperational = false;
  readonly statusCode = 500;
  readonly code = 'DATABASE_ERROR';

  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
  }
}

// External service errors
export class ExternalServiceError extends AppError {
  readonly isOperational = true;
  readonly statusCode = 503;

  constructor(
    message: string, 
    public readonly service: string,
    public readonly code: string = 'EXTERNAL_SERVICE_ERROR',
    context?: Record<string, any>
  ) {
    super(message, context);
  }
}