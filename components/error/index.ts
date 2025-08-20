// Error classes
export * from '@/lib/errors';

// Error boundary components
export { ErrorBoundary, withErrorBoundary, useErrorHandler as useErrorBoundaryHandler } from './ErrorBoundary';
export { ErrorDisplay } from './ErrorDisplay';
export { CurrencyErrorBoundary } from './CurrencyErrorBoundary';
export { PaymentErrorBoundary } from './PaymentErrorBoundary';

// Error provider and context
export { 
  ErrorProvider, 
  useError, 
  withErrorHandling,
  CurrencyErrorProvider,
  PaymentErrorProvider,
  AuthErrorProvider 
} from './ErrorProvider';

// Toast notifications
export { 
  ErrorToast, 
  ErrorToastContainer, 
  useErrorToast,
  type ToastMessage 
} from './ErrorToast';

// Error handling utilities
export {
  withRetry,
  withCurrencyRetry,
  withPaymentRetry,
  withAuthRetry,
  CircuitBreaker,
  currencyApiCircuitBreaker,
  paymentProcessorCircuitBreaker,
  transformError,
  safeAsync,
  handleBatch,
  getUserFriendlyMessage,
  type RetryOptions,
  type RetryResult
} from '@/lib/utils/errorHandling';

// Error logging
export {
  logError,
  logCriticalError,
  getRecentErrors,
  clearErrorLogs,
  exportErrorLogs,
  useErrorReporting,
  type ErrorLogEntry
} from '@/lib/utils/errorLogger';

// Error handling hooks
export {
  useErrorHandler,
  useCurrencyErrorHandler,
  usePaymentErrorHandler,
  useAuthErrorHandler,
  useAsyncOperation,
  useFormErrorHandler,
  type ErrorState,
  type UseErrorHandlerOptions
} from '@/lib/hooks/useErrorHandler';

// Examples (for development/documentation)
export { ErrorHandlingExamples, EnhancedInvoiceForm } from './examples/ErrorHandlingExamples';