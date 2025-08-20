import { AppError, CurrencyError, AuthError, PaymentError, RecurringError, ValidationError } from '@/lib/errors';
import { logError } from './errorLogger';

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number; // in milliseconds
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: Error) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

// Default retry configuration
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: (error) => {
    // Retry on network errors, temporary service errors, etc.
    if (error instanceof AppError) {
      // Don't retry validation errors or permanent failures
      if (error instanceof ValidationError) return false;
      if (error instanceof AuthError && ['INVALID_CREDENTIALS', 'ACCOUNT_LOCKED'].includes(error.code)) return false;
      if (error instanceof PaymentError && !error.retryable) return false;
      
      // Retry on temporary errors
      return error.statusCode >= 500 || 
             (error instanceof CurrencyError && ['CURRENCY_API_UNAVAILABLE', 'EXCHANGE_RATE_STALE'].includes(error.code)) ||
             (error instanceof PaymentError && error.retryable);
    }
    
    // Retry on generic network errors
    return true;
  }
};

// Exponential backoff with jitter
function calculateDelay(attempt: number, options: RetryOptions): number {
  const exponentialDelay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay);
  
  // Add jitter to prevent thundering herd
  const jitter = cappedDelay * 0.1 * Math.random();
  return cappedDelay + jitter;
}

// Generic retry function with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await operation();
      return {
        success: true,
        data: result,
        attempts: attempt
      };
    } catch (error) {
      lastError = error as Error;
      
      // Log the error
      logError(lastError, {
        attempt,
        maxAttempts: config.maxAttempts,
        operation: operation.name || 'anonymous'
      });
      
      // Check if we should retry
      if (attempt === config.maxAttempts || !config.retryCondition!(lastError)) {
        break;
      }
      
      // Wait before retrying
      const delay = calculateDelay(attempt, config);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return {
    success: false,
    error: lastError!,
    attempts: config.maxAttempts
  };
}

// Specialized retry functions for different operations
export async function withCurrencyRetry<T>(operation: () => Promise<T>): Promise<RetryResult<T>> {
  return withRetry(operation, {
    maxAttempts: 3,
    baseDelay: 2000,
    retryCondition: (error) => {
      if (error instanceof CurrencyError) {
        return ['CURRENCY_API_UNAVAILABLE', 'EXCHANGE_RATE_STALE', 'CONVERSION_FAILED'].includes(error.code);
      }
      return false;
    }
  });
}

export async function withPaymentRetry<T>(operation: () => Promise<T>): Promise<RetryResult<T>> {
  return withRetry(operation, {
    maxAttempts: 2, // Be conservative with payment retries
    baseDelay: 3000,
    retryCondition: (error) => {
      if (error instanceof PaymentError) {
        return error.retryable && ['PAYMENT_PROCESSOR_ERROR'].includes(error.code);
      }
      return false;
    }
  });
}

export async function withAuthRetry<T>(operation: () => Promise<T>): Promise<RetryResult<T>> {
  return withRetry(operation, {
    maxAttempts: 2,
    baseDelay: 1000,
    retryCondition: (error) => {
      if (error instanceof AuthError) {
        return ['TOKEN_EXPIRED'].includes(error.code);
      }
      return false;
    }
  });
}

// Circuit breaker pattern for external services
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000, // 1 minute
    private successThreshold: number = 2
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.recoveryTimeout) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return this.state;
  }

  reset() {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}

// Global circuit breakers for external services
export const currencyApiCircuitBreaker = new CircuitBreaker(3, 30000, 1);
export const paymentProcessorCircuitBreaker = new CircuitBreaker(5, 60000, 2);

// Error transformation utilities
export function transformError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Transform common error types
    if (error.message.includes('fetch')) {
      return new CurrencyError('Network request failed', 'CURRENCY_API_UNAVAILABLE', {
        originalError: error.message
      });
    }

    if (error.message.includes('Unauthorized')) {
      return new AuthError('Authentication required', 'UNAUTHORIZED', {
        originalError: error.message
      });
    }

    if (error.message.includes('payment')) {
      return new PaymentError('Payment processing failed', 'PAYMENT_PROCESSOR_ERROR', true, {
        originalError: error.message
      });
    }

    // Generic transformation
    return new ValidationError(error.message, undefined, {
      originalError: error.message
    });
  }

  // Handle non-Error objects
  return new ValidationError('An unknown error occurred', undefined, {
    originalError: String(error)
  });
}

// Safe async operation wrapper
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T,
  onError?: (error: Error) => void
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    const appError = transformError(error);
    logError(appError);
    
    if (onError) {
      onError(appError);
    }
    
    return fallback;
  }
}

// Batch error handling for multiple operations
export async function handleBatch<T>(
  operations: (() => Promise<T>)[],
  options: {
    continueOnError?: boolean;
    maxConcurrency?: number;
  } = {}
): Promise<{ results: (T | Error)[]; errors: Error[] }> {
  const { continueOnError = true, maxConcurrency = 5 } = options;
  const results: (T | Error)[] = [];
  const errors: Error[] = [];

  // Process in batches to limit concurrency
  for (let i = 0; i < operations.length; i += maxConcurrency) {
    const batch = operations.slice(i, i + maxConcurrency);
    
    const batchPromises = batch.map(async (operation, index) => {
      try {
        const result = await operation();
        results[i + index] = result;
        return result;
      } catch (error) {
        const appError = transformError(error);
        results[i + index] = appError;
        errors.push(appError);
        
        logError(appError, {
          batchIndex: i + index,
          totalOperations: operations.length
        });

        if (!continueOnError) {
          throw appError;
        }
        
        return appError;
      }
    });

    await Promise.all(batchPromises);
  }

  return { results, errors };
}

// User-friendly error messages
export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof AppError) {
    // Use the error's message as it's already user-friendly
    return error.message;
  }

  // Generic fallback messages
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return 'Unable to connect to the service. Please check your internet connection and try again.';
  }

  if (error.message.includes('timeout')) {
    return 'The operation took too long to complete. Please try again.';
  }

  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
}