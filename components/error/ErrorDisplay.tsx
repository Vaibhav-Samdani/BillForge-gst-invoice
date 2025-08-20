'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppError, CurrencyError, AuthError, PaymentError, RecurringError } from '@/lib/errors';

interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

export function ErrorDisplay({ error, onRetry, onDismiss, showDetails = false }: ErrorDisplayProps) {
  const [showFullError, setShowFullError] = React.useState(false);

  const getErrorInfo = (error: Error) => {
    if (error instanceof AppError) {
      return {
        title: getErrorTitle(error),
        message: getErrorMessage(error),
        severity: getErrorSeverity(error),
        canRetry: getRetryability(error),
        icon: getErrorIcon(error)
      };
    }

    // Generic error handling
    return {
      title: 'Something went wrong',
      message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      severity: 'error' as const,
      canRetry: true,
      icon: AlertTriangle
    };
  };

  const getErrorTitle = (error: AppError): string => {
    if (error instanceof CurrencyError) {
      switch (error.code) {
        case 'CURRENCY_API_UNAVAILABLE':
          return 'Currency Service Unavailable';
        case 'INVALID_CURRENCY_CODE':
          return 'Invalid Currency';
        case 'EXCHANGE_RATE_STALE':
          return 'Exchange Rates Outdated';
        case 'CONVERSION_FAILED':
          return 'Currency Conversion Failed';
        default:
          return 'Currency Error';
      }
    }

    if (error instanceof AuthError) {
      switch (error.code) {
        case 'INVALID_CREDENTIALS':
          return 'Invalid Login';
        case 'ACCOUNT_LOCKED':
          return 'Account Locked';
        case 'TOKEN_EXPIRED':
          return 'Session Expired';
        case 'EMAIL_NOT_VERIFIED':
          return 'Email Not Verified';
        default:
          return 'Authentication Error';
      }
    }

    if (error instanceof PaymentError) {
      switch (error.code) {
        case 'PAYMENT_DECLINED':
          return 'Payment Declined';
        case 'INSUFFICIENT_FUNDS':
          return 'Insufficient Funds';
        case 'PAYMENT_PROCESSOR_ERROR':
          return 'Payment Processing Error';
        case 'INVALID_PAYMENT_METHOD':
          return 'Invalid Payment Method';
        default:
          return 'Payment Error';
      }
    }

    if (error instanceof RecurringError) {
      return 'Recurring Invoice Error';
    }

    return 'Application Error';
  };

  const getErrorMessage = (error: AppError): string => {
    if (error instanceof CurrencyError) {
      switch (error.code) {
        case 'CURRENCY_API_UNAVAILABLE':
          return 'The currency exchange service is temporarily unavailable. Using cached rates where possible.';
        case 'INVALID_CURRENCY_CODE':
          return 'The selected currency is not supported. Please choose a different currency.';
        case 'EXCHANGE_RATE_STALE':
          return 'Exchange rates may be outdated. Please refresh to get the latest rates.';
        case 'CONVERSION_FAILED':
          return 'Unable to convert between currencies. Please check your selection and try again.';
        default:
          return error.message;
      }
    }

    if (error instanceof AuthError) {
      switch (error.code) {
        case 'INVALID_CREDENTIALS':
          return 'The email or password you entered is incorrect. Please try again.';
        case 'ACCOUNT_LOCKED':
          return 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later or reset your password.';
        case 'TOKEN_EXPIRED':
          return 'Your session has expired. Please log in again to continue.';
        case 'EMAIL_NOT_VERIFIED':
          return 'Please verify your email address before logging in. Check your inbox for a verification link.';
        default:
          return error.message;
      }
    }

    if (error instanceof PaymentError) {
      switch (error.code) {
        case 'PAYMENT_DECLINED':
          return 'Your payment was declined. Please check your payment details or try a different payment method.';
        case 'INSUFFICIENT_FUNDS':
          return 'There are insufficient funds available for this payment. Please check your account balance.';
        case 'PAYMENT_PROCESSOR_ERROR':
          return 'There was an issue processing your payment. Please try again or contact support.';
        case 'INVALID_PAYMENT_METHOD':
          return 'The payment method you selected is not valid or supported. Please choose a different method.';
        default:
          return error.message;
      }
    }

    return error.message;
  };

  const getErrorSeverity = (error: AppError): 'error' | 'warning' | 'info' => {
    if (error instanceof CurrencyError) {
      switch (error.code) {
        case 'EXCHANGE_RATE_STALE':
          return 'warning';
        case 'CURRENCY_API_UNAVAILABLE':
          return 'warning';
        default:
          return 'error';
      }
    }

    if (error instanceof AuthError) {
      switch (error.code) {
        case 'TOKEN_EXPIRED':
          return 'info';
        default:
          return 'error';
      }
    }

    return 'error';
  };

  const getRetryability = (error: AppError): boolean => {
    if (error instanceof PaymentError) {
      return error.retryable;
    }

    if (error instanceof CurrencyError) {
      return ['CURRENCY_API_UNAVAILABLE', 'EXCHANGE_RATE_STALE'].includes(error.code);
    }

    if (error instanceof AuthError) {
      return ['TOKEN_EXPIRED'].includes(error.code);
    }

    return true;
  };

  const getErrorIcon = (error: AppError) => {
    if (error instanceof AuthError) {
      return AlertTriangle;
    }
    if (error instanceof PaymentError) {
      return AlertTriangle;
    }
    return Bug;
  };

  const errorInfo = getErrorInfo(error);
  const IconComponent = errorInfo.icon;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <IconComponent 
            className={`h-12 w-12 ${
              errorInfo.severity === 'error' ? 'text-red-500' :
              errorInfo.severity === 'warning' ? 'text-yellow-500' :
              'text-blue-500'
            }`} 
          />
        </div>
        <CardTitle className="text-lg">{errorInfo.title}</CardTitle>
        <CardDescription className="text-sm text-gray-600">
          {errorInfo.message}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          {errorInfo.canRetry && onRetry && (
            <Button onClick={onRetry} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="flex-1"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>

        {onDismiss && (
          <Button variant="ghost" onClick={onDismiss} className="w-full">
            Dismiss
          </Button>
        )}

        {showDetails && (
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullError(!showFullError)}
              className="text-xs"
            >
              {showFullError ? 'Hide' : 'Show'} Technical Details
            </Button>
            
            {showFullError && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                  {error.stack || error.message}
                </pre>
                {error instanceof AppError && error.context && (
                  <div className="mt-2">
                    <strong className="text-xs">Context:</strong>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(error.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}