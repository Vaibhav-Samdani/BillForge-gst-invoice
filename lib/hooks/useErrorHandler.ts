'use client';

import { useCallback, useState } from 'react';
import { AppError } from '@/lib/errors';
import { logError } from '@/lib/utils/errorLogger';
import { transformError, getUserFriendlyMessage, withRetry, RetryResult } from '@/lib/utils/errorHandling';

export interface ErrorState {
  error: Error | null;
  isError: boolean;
  errorMessage: string;
  canRetry: boolean;
  isRetrying: boolean;
}

export interface UseErrorHandlerOptions {
  onError?: (error: Error) => void;
  showUserFriendlyMessages?: boolean;
  enableRetry?: boolean;
  logErrors?: boolean;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    onError,
    showUserFriendlyMessages = true,
    enableRetry = true,
    logErrors = true
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorMessage: '',
    canRetry: false,
    isRetrying: false
  });

  const handleError = useCallback((error: unknown, context?: Record<string, unknown>) => {
    const appError = transformError(error);
    
    // Log the error if enabled
    if (logErrors) {
      logError(appError, context);
    }

    // Determine if retry is possible
    const canRetry = enableRetry && (
      appError instanceof AppError && 
      (appError.statusCode >= 500 || 
       (appError as AppError & { retryable?: boolean }).retryable === true)
    );

    // Get user-friendly message
    const errorMessage = showUserFriendlyMessages 
      ? getUserFriendlyMessage(appError)
      : appError.message;

    setErrorState({
      error: appError,
      isError: true,
      errorMessage,
      canRetry,
      isRetrying: false
    });

    // Call custom error handler
    if (onError) {
      onError(appError);
    }
  }, [onError, showUserFriendlyMessages, enableRetry, logErrors]);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorMessage: '',
      canRetry: false,
      isRetrying: false
    });
  }, []);

  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<RetryResult<T> | null> => {
    if (!errorState.canRetry) {
      return null;
    }

    setErrorState(prev => ({ ...prev, isRetrying: true }));

    try {
      const result = await withRetry(operation);
      
      if (result.success) {
        clearError();
      } else if (result.error) {
        handleError(result.error, { retryAttempts: result.attempts });
      }

      return result;
    } finally {
      setErrorState(prev => ({ ...prev, isRetrying: false }));
    }
  }, [errorState.canRetry, handleError, clearError]);

  return {
    ...errorState,
    handleError,
    clearError,
    retryOperation
  };
}

// Specialized hooks for different error types
export function useCurrencyErrorHandler() {
  return useErrorHandler({
    onError: (error) => {
      // Currency-specific error handling
      console.warn('Currency operation failed:', error);
    }
  });
}

export function usePaymentErrorHandler() {
  return useErrorHandler({
    onError: (error) => {
      // Payment-specific error handling
      console.error('Payment operation failed:', error);
      
      // Could trigger additional actions like:
      // - Showing payment failure modal
      // - Logging to payment analytics
      // - Sending failure notification
    }
  });
}

export function useAuthErrorHandler() {
  return useErrorHandler({
    onError: (error) => {
      // Auth-specific error handling
      if (error instanceof AppError && error.statusCode === 401) {
        // Redirect to login or refresh token
        console.log('Authentication required');
      }
    }
  });
}

// Hook for async operations with built-in error handling
export function useAsyncOperation<T>() {
  const { handleError, clearError, isError, errorMessage, isRetrying } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
      clearPreviousError?: boolean;
    }
  ) => {
    const { onSuccess, onError: customOnError, clearPreviousError = true } = options || {};

    if (clearPreviousError) {
      clearError();
    }

    setIsLoading(true);
    setData(null);

    try {
      const result = await operation();
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      handleError(error);
      
      if (customOnError) {
        customOnError(error as Error);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  return {
    execute,
    data,
    isLoading,
    isError,
    errorMessage,
    isRetrying,
    clearError
  };
}

// Hook for form error handling
export function useFormErrorHandler() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { handleError, clearError, isError, errorMessage } = useErrorHandler();

  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const handleFormError = useCallback((error: unknown) => {
    // Clear field errors when handling general form error
    clearAllFieldErrors();
    handleError(error);
  }, [handleError, clearAllFieldErrors]);

  return {
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    handleFormError,
    clearError,
    isError,
    errorMessage
  };
}