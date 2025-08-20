// Export all types from the types directory
export * from './database';
export * from './invoice';
export * from './validation';

// Export services
export * from '../services';

// Re-export commonly used types for convenience
export type {
  Currency,
  ExchangeRate,
  CurrencyAmount,
  EnhancedInvoice,
  RecurringConfig,
  ClientUser,
  Payment,
  EnhancedInvoiceState,
  ClientPortalState,
  ValidationResult,
  InvoiceFilters,
  InvoiceSortOptions,
} from './invoice';

export {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
} from './invoice';

export {
  validateCurrency,
  validateExchangeRate,
  validateCurrencyAmount,
  validateRecurringConfig,
  validateClientUser,
  validateEnhancedInvoice,
  validatePayment,
  validateInvoiceData,
  validateInvoiceCreation,
  validatePasswordStrength,
} from './validation';