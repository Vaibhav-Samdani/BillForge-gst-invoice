'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { PaymentError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react';

interface PaymentErrorFallbackProps {
  error: Error;
  onRetry: () => void;
}

function PaymentErrorFallback({ error, onRetry }: PaymentErrorFallbackProps) {
  const isPaymentError = error instanceof PaymentError;
  
  if (!isPaymentError) {
    // Fall back to generic error display for non-payment errors
    throw error;
  }

  const getErrorDetails = (code: string) => {
    switch (code) {
      case 'PAYMENT_DECLINED':
        return {
          title: 'Payment Declined',
          message: 'Your payment was declined by your bank or card issuer. Please check your payment details or try a different payment method.',
          severity: 'error' as const,
          suggestions: [
            'Verify your card details are correct',
            'Check if your card has sufficient funds',
            'Try a different payment method',
            'Contact your bank if the issue persists'
          ]
        };
      case 'INSUFFICIENT_FUNDS':
        return {
          title: 'Insufficient Funds',
          message: 'There are not enough funds available to complete this payment.',
          severity: 'error' as const,
          suggestions: [
            'Check your account balance',
            'Add funds to your account',
            'Try a different payment method'
          ]
        };
      case 'PAYMENT_PROCESSOR_ERROR':
        return {
          title: 'Payment Processing Error',
          message: 'There was a temporary issue processing your payment. This is usually resolved quickly.',
          severity: 'warning' as const,
          suggestions: [
            'Try again in a few minutes',
            'Check your payment method is valid',
            'Contact support if the issue continues'
          ]
        };
      case 'INVALID_PAYMENT_METHOD':
        return {
          title: 'Invalid Payment Method',
          message: 'The payment method you selected is not valid or supported.',
          severity: 'error' as const,
          suggestions: [
            'Check your card details',
            'Try a different payment method',
            'Ensure your card is not expired'
          ]
        };
      case 'INVOICE_ALREADY_PAID':
        return {
          title: 'Invoice Already Paid',
          message: 'This invoice has already been paid and cannot be paid again.',
          severity: 'info' as const,
          suggestions: [
            'Check your payment history',
            'Contact support if you believe this is an error'
          ]
        };
      default:
        return {
          title: 'Payment Error',
          message: 'An unexpected error occurred while processing your payment.',
          severity: 'error' as const,
          suggestions: [
            'Try again in a few minutes',
            'Contact support for assistance'
          ]
        };
    }
  };

  const errorDetails = getErrorDetails(error.code);
  const canRetry = error.retryable || ['PAYMENT_PROCESSOR_ERROR'].includes(error.code);

  return (
    <Card className={`w-full max-w-md mx-auto ${
      errorDetails.severity === 'error' ? 'border-red-200 bg-red-50' :
      errorDetails.severity === 'warning' ? 'border-yellow-200 bg-yellow-50' :
      'border-blue-200 bg-blue-50'
    }`}>
      <CardHeader className="text-center pb-3">
        <div className="flex justify-center mb-2">
          {errorDetails.severity === 'error' ? (
            <AlertTriangle className="h-8 w-8 text-red-600" />
          ) : errorDetails.severity === 'warning' ? (
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          ) : (
            <CreditCard className="h-8 w-8 text-blue-600" />
          )}
        </div>
        <CardTitle className={`text-lg ${
          errorDetails.severity === 'error' ? 'text-red-800' :
          errorDetails.severity === 'warning' ? 'text-yellow-800' :
          'text-blue-800'
        }`}>
          {errorDetails.title}
        </CardTitle>
        <CardDescription className={`${
          errorDetails.severity === 'error' ? 'text-red-700' :
          errorDetails.severity === 'warning' ? 'text-yellow-700' :
          'text-blue-700'
        }`}>
          {errorDetails.message}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {canRetry && (
          <Button 
            onClick={onRetry} 
            className="w-full"
            variant={errorDetails.severity === 'error' ? 'destructive' : 'default'}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Payment Again
          </Button>
        )}
        
        <div className={`text-xs ${
          errorDetails.severity === 'error' ? 'text-red-600' :
          errorDetails.severity === 'warning' ? 'text-yellow-600' :
          'text-blue-600'
        }`}>
          <div className="flex items-center mb-2">
            <HelpCircle className="h-3 w-3 mr-1" />
            <span className="font-medium">What you can do:</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {errorDetails.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>

        {error.context?.transactionId && (
          <div className="text-xs text-gray-500 border-t pt-2">
            <span className="font-medium">Transaction ID:</span> {error.context.transactionId}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PaymentErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error) => void;
  onPaymentRetry?: () => void;
}

export function PaymentErrorBoundary({ children, onError, onPaymentRetry }: PaymentErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={({ error, onRetry }) => (
        <PaymentErrorFallback 
          error={error} 
          onRetry={onPaymentRetry || onRetry} 
        />
      )}
      onError={(error, errorInfo) => {
        if (onError) {
          onError(error);
        }
        
        // Log payment-specific context
        console.error('Payment operation failed:', {
          error: error.message,
          code: error instanceof PaymentError ? error.code : 'UNKNOWN',
          retryable: error instanceof PaymentError ? error.retryable : false,
          context: error instanceof PaymentError ? error.context : undefined,
          componentStack: errorInfo.componentStack
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}