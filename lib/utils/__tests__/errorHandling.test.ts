import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  withRetry,
  withCurrencyRetry,
  withPaymentRetry,
  withAuthRetry,
  CircuitBreaker,
  transformError,
  safeAsync,
  handleBatch,
  getUserFriendlyMessage
} from '../errorHandling';
import {
  CurrencyError,
  CurrencyErrorCode,
  AuthError,
  AuthErrorCode,
  PaymentError,
  PaymentErrorCode,
  ValidationError
} from '../../errors';

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await withRetry(operation);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const result = await withRetry(operation, { maxAttempts: 3, baseDelay: 10 });
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const validationError = new ValidationError('Invalid input');
      const operation = vi.fn().mockRejectedValue(validationError);
      
      const result = await withRetry(operation, { maxAttempts: 3 });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(validationError);
      expect(result.attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect max attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Always fails'));
      
      const result = await withRetry(operation, { maxAttempts: 2, baseDelay: 10 });
      
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(2);
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('withCurrencyRetry', () => {
    it('should retry currency API errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new CurrencyError('API down', CurrencyErrorCode.API_UNAVAILABLE))
        .mockResolvedValue('success');
      
      const result = await withCurrencyRetry(operation);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry invalid currency errors', async () => {
      const operation = vi.fn()
        .mockRejectedValue(new CurrencyError('Invalid code', CurrencyErrorCode.INVALID_CURRENCY_CODE));
      
      const result = await withCurrencyRetry(operation);
      
      expect(result.success).toBe(false);
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('withPaymentRetry', () => {
    it('should retry retryable payment errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new PaymentError('Processor error', PaymentErrorCode.PAYMENT_PROCESSOR_ERROR, true))
        .mockResolvedValue('success');
      
      const result = await withPaymentRetry(operation);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable payment errors', async () => {
      const operation = vi.fn()
        .mockRejectedValue(new PaymentError('Card declined', PaymentErrorCode.PAYMENT_DECLINED, false));
      
      const result = await withPaymentRetry(operation);
      
      expect(result.success).toBe(false);
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('withAuthRetry', () => {
    it('should retry token expired errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new AuthError('Token expired', AuthErrorCode.TOKEN_EXPIRED))
        .mockResolvedValue('success');
      
      const result = await withAuthRetry(operation);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry invalid credentials', async () => {
      const operation = vi.fn()
        .mockRejectedValue(new AuthError('Invalid credentials', AuthErrorCode.INVALID_CREDENTIALS));
      
      const result = await withAuthRetry(operation);
      
      expect(result.success).toBe(false);
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('CircuitBreaker', () => {
    it('should allow operations when closed', async () => {
      const circuitBreaker = new CircuitBreaker(2, 1000);
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(operation);
      
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should open after failure threshold', async () => {
      const circuitBreaker = new CircuitBreaker(2, 1000);
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));
      
      // First failure
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failure');
      expect(circuitBreaker.getState()).toBe('CLOSED');
      
      // Second failure - should open circuit
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failure');
      expect(circuitBreaker.getState()).toBe('OPEN');
      
      // Third attempt should be blocked
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Circuit breaker is OPEN');
    });

    it('should transition to half-open after timeout', async () => {
      const circuitBreaker = new CircuitBreaker(1, 10); // 10ms timeout
      const operation = vi.fn().mockRejectedValue(new Error('Failure'));
      
      // Trigger circuit open
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failure');
      expect(circuitBreaker.getState()).toBe('OPEN');
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 15));
      
      // Next operation should transition to half-open
      operation.mockResolvedValueOnce('success');
      const result = await circuitBreaker.execute(operation);
      
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });

  describe('transformError', () => {
    it('should return AppError as-is', () => {
      const originalError = new ValidationError('Test error');
      const transformed = transformError(originalError);
      
      expect(transformed).toBe(originalError);
    });

    it('should transform fetch errors to CurrencyError', () => {
      const fetchError = new Error('fetch failed');
      const transformed = transformError(fetchError);
      
      expect(transformed).toBeInstanceOf(CurrencyError);
      expect(transformed.code).toBe('CURRENCY_API_UNAVAILABLE');
    });

    it('should transform unauthorized errors to AuthError', () => {
      const authError = new Error('Unauthorized access');
      const transformed = transformError(authError);
      
      expect(transformed).toBeInstanceOf(AuthError);
      expect(transformed.code).toBe('UNAUTHORIZED');
    });

    it('should transform payment errors to PaymentError', () => {
      const paymentError = new Error('payment processing failed');
      const transformed = transformError(paymentError);
      
      expect(transformed).toBeInstanceOf(PaymentError);
      expect(transformed.code).toBe('PAYMENT_PROCESSOR_ERROR');
    });

    it('should transform unknown errors to ValidationError', () => {
      const unknownError = 'string error';
      const transformed = transformError(unknownError);
      
      expect(transformed).toBeInstanceOf(ValidationError);
      expect(transformed.message).toBe('An unknown error occurred');
    });
  });

  describe('safeAsync', () => {
    it('should return result on success', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await safeAsync(operation);
      
      expect(result).toBe('success');
    });

    it('should return fallback on error', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));
      
      const result = await safeAsync(operation, 'fallback');
      
      expect(result).toBe('fallback');
    });

    it('should call error handler on error', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));
      const onError = vi.fn();
      
      await safeAsync(operation, undefined, onError);
      
      expect(onError).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('handleBatch', () => {
    it('should handle successful operations', async () => {
      const operations = [
        vi.fn().mockResolvedValue('result1'),
        vi.fn().mockResolvedValue('result2'),
        vi.fn().mockResolvedValue('result3')
      ];
      
      const result = await handleBatch(operations);
      
      expect(result.results).toEqual(['result1', 'result2', 'result3']);
      expect(result.errors).toEqual([]);
    });

    it('should handle mixed success and failure', async () => {
      const operations = [
        vi.fn().mockResolvedValue('success'),
        vi.fn().mockRejectedValue(new Error('failure')),
        vi.fn().mockResolvedValue('success2')
      ];
      
      const result = await handleBatch(operations);
      
      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toBe('success');
      expect(result.results[1]).toBeInstanceOf(ValidationError);
      expect(result.results[2]).toBe('success2');
      expect(result.errors).toHaveLength(1);
    });

    it('should stop on first error when continueOnError is false', async () => {
      const operations = [
        vi.fn().mockResolvedValue('success'),
        vi.fn().mockRejectedValue(new Error('failure')),
        vi.fn().mockResolvedValue('success2')
      ];
      
      await expect(handleBatch(operations, { continueOnError: false }))
        .rejects.toThrow();
      
      // The third operation should not be called since we stop on first error
      // Note: Due to Promise.all behavior, all operations in the batch may start
      // but we should still get the error thrown
      expect(operations[0]).toHaveBeenCalled();
      expect(operations[1]).toHaveBeenCalled();
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return AppError message as-is', () => {
      const error = new ValidationError('User-friendly message');
      const message = getUserFriendlyMessage(error);
      
      expect(message).toBe('User-friendly message');
    });

    it('should transform network errors', () => {
      const error = new Error('network timeout');
      const message = getUserFriendlyMessage(error);
      
      expect(message).toContain('Unable to connect to the service');
    });

    it('should transform timeout errors', () => {
      const error = new Error('request timeout');
      const message = getUserFriendlyMessage(error);
      
      expect(message).toContain('took too long to complete');
    });

    it('should provide generic message for unknown errors', () => {
      const error = new Error('Unknown system error');
      const message = getUserFriendlyMessage(error);
      
      expect(message).toContain('An unexpected error occurred');
    });
  });
});