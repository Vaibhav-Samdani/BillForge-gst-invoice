import { describe, it, expect } from 'vitest';
import {
  AppError,
  CurrencyError,
  CurrencyErrorCode,
  AuthError,
  AuthErrorCode,
  PaymentError,
  PaymentErrorCode,
  RecurringError,
  RecurringErrorCode,
  ValidationError,
  DatabaseError,
  ExternalServiceError
} from '../index';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with proper properties', () => {
      class TestError extends AppError {
        readonly code = 'TEST_ERROR';
        readonly statusCode = 400;
        readonly isOperational = true;
      }

      const error = new TestError('Test message', { key: 'value' });
      
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.context).toEqual({ key: 'value' });
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.name).toBe('TestError');
    });

    it('should serialize to JSON properly', () => {
      class TestError extends AppError {
        readonly code = 'TEST_ERROR';
        readonly statusCode = 400;
        readonly isOperational = true;
      }

      const error = new TestError('Test message', { key: 'value' });
      const json = error.toJSON();
      
      expect(json).toMatchObject({
        name: 'TestError',
        message: 'Test message',
        code: 'TEST_ERROR',
        statusCode: 400,
        context: { key: 'value' }
      });
      expect(json.timestamp).toBeInstanceOf(Date);
      expect(json.stack).toBeDefined();
    });
  });

  describe('CurrencyError', () => {
    it('should create currency error with correct properties', () => {
      const error = new CurrencyError(
        'API unavailable',
        CurrencyErrorCode.API_UNAVAILABLE,
        { service: 'ExchangeRate-API' }
      );
      
      expect(error.message).toBe('API unavailable');
      expect(error.code).toBe('CURRENCY_API_UNAVAILABLE');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.context).toEqual({ service: 'ExchangeRate-API' });
    });

    it('should handle all currency error codes', () => {
      const codes = Object.values(CurrencyErrorCode);
      
      codes.forEach(code => {
        const error = new CurrencyError('Test message', code);
        expect(error.code).toBe(code);
        expect(error.statusCode).toBe(400);
      });
    });
  });

  describe('AuthError', () => {
    it('should create auth error with correct status codes', () => {
      const testCases = [
        { code: AuthErrorCode.INVALID_CREDENTIALS, expectedStatus: 400 },
        { code: AuthErrorCode.UNAUTHORIZED, expectedStatus: 401 },
        { code: AuthErrorCode.TOKEN_EXPIRED, expectedStatus: 401 },
        { code: AuthErrorCode.ACCOUNT_LOCKED, expectedStatus: 403 },
        { code: AuthErrorCode.USER_NOT_FOUND, expectedStatus: 404 },
        { code: AuthErrorCode.RATE_LIMITED, expectedStatus: 429 }
      ];

      testCases.forEach(({ code, expectedStatus }) => {
        const error = new AuthError('Test message', code);
        expect(error.statusCode).toBe(expectedStatus);
        expect(error.code).toBe(code);
        expect(error.isOperational).toBe(true);
      });
    });
  });

  describe('PaymentError', () => {
    it('should create payment error with retryable flag', () => {
      const error = new PaymentError(
        'Payment failed',
        PaymentErrorCode.PAYMENT_PROCESSOR_ERROR,
        true,
        { transactionId: '123' }
      );
      
      expect(error.message).toBe('Payment failed');
      expect(error.code).toBe('PAYMENT_PROCESSOR_ERROR');
      expect(error.retryable).toBe(true);
      expect(error.statusCode).toBe(500);
      expect(error.context).toEqual({ transactionId: '123' });
    });

    it('should have correct status codes for different payment errors', () => {
      const testCases = [
        { code: PaymentErrorCode.INVALID_PAYMENT_METHOD, expectedStatus: 400 },
        { code: PaymentErrorCode.INSUFFICIENT_FUNDS, expectedStatus: 402 },
        { code: PaymentErrorCode.PAYMENT_DECLINED, expectedStatus: 402 },
        { code: PaymentErrorCode.INVOICE_NOT_FOUND, expectedStatus: 404 },
        { code: PaymentErrorCode.INVOICE_ALREADY_PAID, expectedStatus: 409 },
        { code: PaymentErrorCode.RATE_LIMITED, expectedStatus: 429 },
        { code: PaymentErrorCode.PAYMENT_PROCESSOR_ERROR, expectedStatus: 500 }
      ];

      testCases.forEach(({ code, expectedStatus }) => {
        const error = new PaymentError('Test message', code);
        expect(error.statusCode).toBe(expectedStatus);
      });
    });
  });

  describe('RecurringError', () => {
    it('should create recurring error with correct properties', () => {
      const error = new RecurringError(
        'Invalid schedule',
        RecurringErrorCode.INVALID_SCHEDULE,
        { frequency: 'invalid' }
      );
      
      expect(error.message).toBe('Invalid schedule');
      expect(error.code).toBe('INVALID_SCHEDULE');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field information', () => {
      const error = new ValidationError('Invalid email', 'email', { value: 'invalid-email' });
      
      expect(error.message).toBe('Invalid email');
      expect(error.field).toBe('email');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });
  });

  describe('DatabaseError', () => {
    it('should create database error as non-operational', () => {
      const error = new DatabaseError('Connection failed', { host: 'localhost' });
      
      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
    });
  });

  describe('ExternalServiceError', () => {
    it('should create external service error with service name', () => {
      const error = new ExternalServiceError(
        'Service unavailable',
        'payment-processor',
        'SERVICE_DOWN',
        { endpoint: '/api/charge' }
      );
      
      expect(error.message).toBe('Service unavailable');
      expect(error.service).toBe('payment-processor');
      expect(error.code).toBe('SERVICE_DOWN');
      expect(error.statusCode).toBe(503);
      expect(error.isOperational).toBe(true);
    });
  });
});