'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { CurrencyError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, RefreshCw } from 'lucide-react';

interface CurrencyErrorFallbackProps {
  error: Error;
  onRetry: () => void;
}

function CurrencyErrorFallback({ error, onRetry }: CurrencyErrorFallbackProps) {
  const isCurrencyError = error instanceof CurrencyError;
  
  if (!isCurrencyError) {
    // Fall back to generic error display for non-currency errors
    throw error;
  }

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'CURRENCY_API_UNAVAILABLE':
        return 'Currency exchange rates are temporarily unavailable. You can still create invoices using cached rates or manual entry.';
      case 'INVALID_CURRENCY_CODE':
        return 'The selected currency is not supported. Please choose from the available currencies.';
      case 'EXCHANGE_RATE_STALE':
        return 'Exchange rates may be outdated. Click refresh to get the latest rates.';
      case 'CONVERSION_FAILED':
        return 'Unable to convert between the selected currencies. Please try again.';
      default:
        return 'There was an issue with currency operations. Please try again.';
    }
  };

  const canRetry = ['CURRENCY_API_UNAVAILABLE', 'EXCHANGE_RATE_STALE', 'CONVERSION_FAILED'].includes(error.code);

  return (
    <Card className="w-full max-w-sm mx-auto border-yellow-200 bg-yellow-50">
      <CardHeader className="text-center pb-3">
        <div className="flex justify-center mb-2">
          <DollarSign className="h-8 w-8 text-yellow-600" />
        </div>
        <CardTitle className="text-lg text-yellow-800">Currency Issue</CardTitle>
        <CardDescription className="text-yellow-700">
          {getErrorMessage(error.code)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        {canRetry && (
          <Button 
            onClick={onRetry} 
            variant="outline" 
            className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Rates
          </Button>
        )}
        
        {error.code === 'CURRENCY_API_UNAVAILABLE' && (
          <div className="mt-3 text-xs text-yellow-600">
            <p>You can continue working with:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Cached exchange rates</li>
              <li>Manual rate entry</li>
              <li>Base currency only</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CurrencyErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error) => void;
}

export function CurrencyErrorBoundary({ children, onError }: CurrencyErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={CurrencyErrorFallback}
      onError={(error, errorInfo) => {
        if (onError) {
          onError(error);
        }
        
        // Log currency-specific context
        console.warn('Currency operation failed:', {
          error: error.message,
          code: error instanceof CurrencyError ? error.code : 'UNKNOWN',
          context: error instanceof CurrencyError ? error.context : undefined,
          componentStack: errorInfo.componentStack
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}