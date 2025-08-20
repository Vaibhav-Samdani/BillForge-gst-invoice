'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorBoundary } from '../ErrorBoundary';
import { CurrencyErrorBoundary } from '../CurrencyErrorBoundary';
import { PaymentErrorBoundary } from '../PaymentErrorBoundary';
import { useError } from '../ErrorProvider';
import { useErrorHandler, useAsyncOperation } from '@/lib/hooks/useErrorHandler';
import {
  CurrencyError,
  CurrencyErrorCode,
  PaymentError,
  PaymentErrorCode,
  AuthError,
  AuthErrorCode
} from '@/lib/errors';

// Example component that demonstrates different error scenarios
export function ErrorHandlingExamples() {
  const { showError, showWarning, showSuccess, handleError } = useError();
  const { handleError: hookHandleError, clearError, isError, errorMessage } = useErrorHandler();
  const { execute, isLoading, data } = useAsyncOperation<string>();

  // Simulate different types of errors
  const simulateCurrencyError = () => {
    const error = new CurrencyError(
      'Exchange rate service is temporarily unavailable',
      CurrencyErrorCode.API_UNAVAILABLE,
      { service: 'ExchangeRate-API', timestamp: new Date() }
    );
    handleError(error);
  };

  const simulatePaymentError = () => {
    const error = new PaymentError(
      'Your payment was declined by the bank',
      PaymentErrorCode.PAYMENT_DECLINED,
      false,
      { transactionId: 'txn_123456', cardLast4: '4242' }
    );
    handleError(error);
  };

  const simulateAuthError = () => {
    const error = new AuthError(
      'Your session has expired. Please log in again.',
      AuthErrorCode.TOKEN_EXPIRED,
      { userId: 'user_123', sessionId: 'sess_456' }
    );
    handleError(error);
  };

  const simulateAsyncOperation = async () => {
    await execute(async () => {
      // Simulate random success/failure
      if (Math.random() > 0.5) {
        throw new Error('Random async operation failed');
      }
      return 'Async operation completed successfully!';
    });
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Error Handling Examples</CardTitle>
          <CardDescription>
            Demonstrates different error handling patterns and components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toast Notifications */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Toast Notifications</h3>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => showError('Error', 'This is an error message')}>
                Show Error Toast
              </Button>
              <Button onClick={() => showWarning('Warning', 'This is a warning message')}>
                Show Warning Toast
              </Button>
              <Button onClick={() => showSuccess('Success', 'Operation completed successfully')}>
                Show Success Toast
              </Button>
            </div>
          </div>

          {/* Specific Error Types */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Specific Error Types</h3>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={simulateCurrencyError} variant="outline">
                Currency Error
              </Button>
              <Button onClick={simulatePaymentError} variant="outline">
                Payment Error
              </Button>
              <Button onClick={simulateAuthError} variant="outline">
                Auth Error
              </Button>
            </div>
          </div>

          {/* Error Hook Example */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Error Hook Example</h3>
            {isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{errorMessage}</p>
                <Button onClick={clearError} size="sm" className="mt-2">
                  Clear Error
                </Button>
              </div>
            )}
            <Button 
              onClick={() => hookHandleError(new Error('Hook error example'))}
              variant="outline"
            >
              Trigger Hook Error
            </Button>
          </div>

          {/* Async Operation Example */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Async Operation Example</h3>
            <div className="space-y-2">
              <Button 
                onClick={simulateAsyncOperation} 
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? 'Loading...' : 'Run Async Operation'}
              </Button>
              {data && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800">{data}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Boundary Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Error Boundary Examples</CardTitle>
          <CardDescription>
            Components wrapped with different error boundaries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Currency Error Boundary */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Currency Error Boundary</h3>
            <CurrencyErrorBoundary>
              <CurrencyComponent />
            </CurrencyErrorBoundary>
          </div>

          {/* Payment Error Boundary */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Payment Error Boundary</h3>
            <PaymentErrorBoundary>
              <PaymentComponent />
            </PaymentErrorBoundary>
          </div>

          {/* Generic Error Boundary */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Generic Error Boundary</h3>
            <ErrorBoundary>
              <GenericComponent />
            </ErrorBoundary>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Example components that can throw errors
function CurrencyComponent() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new CurrencyError(
      'Failed to fetch exchange rates',
      CurrencyErrorCode.API_UNAVAILABLE
    );
  }

  return (
    <div className="p-3 border rounded-md">
      <p>Currency component working normally</p>
      <Button onClick={() => setShouldError(true)} size="sm" className="mt-2">
        Trigger Currency Error
      </Button>
    </div>
  );
}

function PaymentComponent() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new PaymentError(
      'Payment processing failed',
      PaymentErrorCode.PAYMENT_PROCESSOR_ERROR,
      true
    );
  }

  return (
    <div className="p-3 border rounded-md">
      <p>Payment component working normally</p>
      <Button onClick={() => setShouldError(true)} size="sm" className="mt-2">
        Trigger Payment Error
      </Button>
    </div>
  );
}

function GenericComponent() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Generic component error');
  }

  return (
    <div className="p-3 border rounded-md">
      <p>Generic component working normally</p>
      <Button onClick={() => setShouldError(true)} size="sm" className="mt-2">
        Trigger Generic Error
      </Button>
    </div>
  );
}

// Example of integrating error handling into existing invoice components
export function EnhancedInvoiceForm() {
  const { handleError } = useError();
  const { execute, isLoading, isError, errorMessage } = useAsyncOperation();

  const handleSaveInvoice = async () => {
    try {
      await execute(async () => {
        // Simulate invoice save operation
        const response = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ /* invoice data */ })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      });
    } catch (error) {
      // Error is already handled by the async operation hook
      console.error('Failed to save invoice:', error);
    }
  };

  return (
    <ErrorBoundary>
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Invoice Form</CardTitle>
          <CardDescription>
            Invoice form with integrated error handling
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{errorMessage}</p>
            </div>
          )}
          
          {/* Invoice form fields would go here */}
          <div className="space-y-4">
            <p>Invoice form fields...</p>
            
            <Button 
              onClick={handleSaveInvoice}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Invoice'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}