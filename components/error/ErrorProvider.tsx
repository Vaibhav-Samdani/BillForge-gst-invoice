'use client';

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorToastContainer, useErrorToast, ToastMessage } from './ErrorToast';
import { AppError } from '@/lib/errors';
import { logError } from '@/lib/utils/errorLogger';
import { transformError, getUserFriendlyMessage } from '@/lib/utils/errorHandling';

interface ErrorContextValue {
  // Toast methods
  showError: (title: string, message: string, action?: ToastMessage['action']) => string;
  showWarning: (title: string, message: string, action?: ToastMessage['action']) => string;
  showSuccess: (title: string, message: string, action?: ToastMessage['action']) => string;
  showInfo: (title: string, message: string, action?: ToastMessage['action']) => string;
  showAppError: (error: AppError, action?: ToastMessage['action']) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
  
  // Error handling methods
  handleError: (error: unknown, context?: Record<string, any>) => void;
  handleCriticalError: (error: unknown, context?: Record<string, any>) => void;
  
  // Utility methods
  reportError: (error: Error, context?: Record<string, any>) => string;
  getUserFriendlyMessage: (error: Error) => string;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

interface ErrorProviderProps {
  children: ReactNode;
  onError?: (error: Error, context?: Record<string, any>) => void;
  onCriticalError?: (error: Error, context?: Record<string, any>) => void;
  enableToasts?: boolean;
  enableErrorBoundary?: boolean;
  toastPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function ErrorProvider({
  children,
  onError,
  onCriticalError,
  enableToasts = true,
  enableErrorBoundary = true,
  toastPosition = 'top-right'
}: ErrorProviderProps) {
  const {
    toasts,
    addToast,
    dismissToast,
    clearAllToasts,
    showError,
    showWarning,
    showSuccess,
    showInfo,
    showAppError
  } = useErrorToast();

  const handleError = useCallback((error: unknown, context?: Record<string, any>) => {
    const appError = transformError(error);
    
    // Log the error
    const errorId = logError(appError, context);
    
    // Call custom error handler
    if (onError) {
      onError(appError, context);
    }
    
    // Show toast notification if enabled
    if (enableToasts) {
      const userMessage = getUserFriendlyMessage(appError);
      showError('Error', userMessage, {
        label: 'Retry',
        onClick: () => {
          // Could implement retry logic here
          console.log('Retry requested for error:', errorId);
        }
      });
    }
    
    return errorId;
  }, [onError, enableToasts, showError]);

  const handleCriticalError = useCallback((error: unknown, context?: Record<string, any>) => {
    const appError = transformError(error);
    
    // Log as critical error
    const errorId = logError(appError, { ...context, severity: 'critical' });
    
    // Call custom critical error handler
    if (onCriticalError) {
      onCriticalError(appError, context);
    }
    
    // Show persistent error toast
    if (enableToasts) {
      showError(
        'Critical Error',
        'A critical error has occurred. Please contact support if this continues.',
        {
          label: 'Contact Support',
          onClick: () => {
            // Could open support modal or redirect to support page
            window.open('mailto:support@example.com?subject=Critical Error&body=Error ID: ' + errorId);
          }
        }
      );
    }
    
    return errorId;
  }, [onCriticalError, enableToasts, showError]);

  const reportError = useCallback((error: Error, context?: Record<string, any>) => {
    return logError(error, context);
  }, []);

  const contextValue: ErrorContextValue = {
    showError,
    showWarning,
    showSuccess,
    showInfo,
    showAppError,
    dismissToast,
    clearAllToasts,
    handleError,
    handleCriticalError,
    reportError,
    getUserFriendlyMessage
  };

  const content = (
    <ErrorContext.Provider value={contextValue}>
      {children}
      {enableToasts && (
        <ErrorToastContainer
          toasts={toasts}
          onDismiss={dismissToast}
          position={toastPosition}
        />
      )}
    </ErrorContext.Provider>
  );

  if (enableErrorBoundary) {
    return (
      <ErrorBoundary
        onError={(error, errorInfo) => {
          handleCriticalError(error, {
            componentStack: errorInfo.componentStack,
            errorBoundary: true
          });
        }}
      >
        {content}
      </ErrorBoundary>
    );
  }

  return content;
}

// Hook to use the error context
export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

// Higher-order component to wrap components with error handling
export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    onError?: (error: Error) => void;
    fallback?: React.ComponentType<{ error: Error; onRetry: () => void }>;
  }
) {
  const WrappedComponent = (props: P) => {
    const { handleError } = useError();

    return (
      <ErrorBoundary
        onError={(error) => {
          handleError(error);
          if (options?.onError) {
            options.onError(error);
          }
        }}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorHandling(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Specialized error providers for different parts of the app
export function CurrencyErrorProvider({ children }: { children: ReactNode }) {
  return (
    <ErrorProvider
      onError={(error) => {
        console.warn('Currency error:', error);
      }}
      onCriticalError={(error) => {
        console.error('Critical currency error:', error);
      }}
    >
      {children}
    </ErrorProvider>
  );
}

export function PaymentErrorProvider({ children }: { children: ReactNode }) {
  return (
    <ErrorProvider
      onError={(error) => {
        console.error('Payment error:', error);
        // Could trigger payment failure analytics
      }}
      onCriticalError={(error) => {
        console.error('Critical payment error:', error);
        // Could trigger immediate alerts to payment team
      }}
    >
      {children}
    </ErrorProvider>
  );
}

export function AuthErrorProvider({ children }: { children: ReactNode }) {
  return (
    <ErrorProvider
      onError={(error) => {
        console.warn('Auth error:', error);
      }}
      onCriticalError={(error) => {
        console.error('Critical auth error:', error);
        // Could trigger security alerts
      }}
    >
      {children}
    </ErrorProvider>
  );
}