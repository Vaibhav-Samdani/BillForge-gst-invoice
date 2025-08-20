// Validation functions for enhanced invoice data models
import { 
  Currency, 
  ExchangeRate, 
  CurrencyAmount, 
  EnhancedInvoice, 
  RecurringConfig, 
  ClientUser, 
  Payment,
  ValidationResult,
  SUPPORTED_CURRENCIES 
} from './invoice';

// Utility function to create validation result
const createValidationResult = (isValid: boolean, errors: string[] = []): ValidationResult => ({
  isValid,
  errors,
});

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Currency validation
export const validateCurrency = (currency: Currency): ValidationResult => {
  const errors: string[] = [];

  if (!currency.code || typeof currency.code !== 'string' || currency.code.length !== 3) {
    errors.push('Currency code must be a 3-character string');
  }

  if (!currency.symbol || typeof currency.symbol !== 'string') {
    errors.push('Currency symbol is required');
  }

  if (!currency.name || typeof currency.name !== 'string') {
    errors.push('Currency name is required');
  }

  if (typeof currency.decimalPlaces !== 'number' || currency.decimalPlaces < 0 || currency.decimalPlaces > 4) {
    errors.push('Decimal places must be a number between 0 and 4');
  }

  // Check if currency is in supported list
  const isSupported = SUPPORTED_CURRENCIES.some(c => c.code === currency.code);
  if (!isSupported) {
    errors.push(`Currency ${currency.code} is not supported`);
  }

  return createValidationResult(errors.length === 0, errors);
};

// Exchange rate validation
export const validateExchangeRate = (exchangeRate: ExchangeRate): ValidationResult => {
  const errors: string[] = [];

  if (!exchangeRate.baseCurrency || typeof exchangeRate.baseCurrency !== 'string' || exchangeRate.baseCurrency.length !== 3) {
    errors.push('Base currency must be a 3-character string');
  }

  if (!exchangeRate.targetCurrency || typeof exchangeRate.targetCurrency !== 'string' || exchangeRate.targetCurrency.length !== 3) {
    errors.push('Target currency must be a 3-character string');
  }

  if (exchangeRate.baseCurrency === exchangeRate.targetCurrency) {
    errors.push('Base currency and target currency cannot be the same');
  }

  if (typeof exchangeRate.rate !== 'number' || exchangeRate.rate <= 0) {
    errors.push('Exchange rate must be a positive number');
  }

  if (!(exchangeRate.timestamp instanceof Date) || isNaN(exchangeRate.timestamp.getTime())) {
    errors.push('Timestamp must be a valid Date object');
  }

  if (!exchangeRate.source || typeof exchangeRate.source !== 'string') {
    errors.push('Exchange rate source is required');
  }

  // Check if timestamp is not too old (more than 24 hours)
  const now = new Date();
  const hoursDiff = (now.getTime() - exchangeRate.timestamp.getTime()) / (1000 * 60 * 60);
  if (hoursDiff > 24) {
    errors.push('Exchange rate is older than 24 hours');
  }

  return createValidationResult(errors.length === 0, errors);
};

// Currency amount validation
export const validateCurrencyAmount = (currencyAmount: CurrencyAmount): ValidationResult => {
  const errors: string[] = [];

  if (typeof currencyAmount.amount !== 'number') {
    errors.push('Amount must be a number');
  }

  if (currencyAmount.amount < 0) {
    errors.push('Amount cannot be negative');
  }

  if (!currencyAmount.currency || typeof currencyAmount.currency !== 'string' || currencyAmount.currency.length !== 3) {
    errors.push('Currency must be a 3-character string');
  }

  if (currencyAmount.exchangeRate !== undefined) {
    if (typeof currencyAmount.exchangeRate !== 'number' || currencyAmount.exchangeRate <= 0) {
      errors.push('Exchange rate must be a positive number');
    }
  }

  if (currencyAmount.baseAmount !== undefined) {
    if (typeof currencyAmount.baseAmount !== 'number' || currencyAmount.baseAmount < 0) {
      errors.push('Base amount must be a non-negative number');
    }
  }

  return createValidationResult(errors.length === 0, errors);
};

// Recurring config validation
export const validateRecurringConfig = (config: RecurringConfig): ValidationResult => {
  const errors: string[] = [];

  const validFrequencies = ['weekly', 'monthly', 'quarterly', 'yearly'];
  if (!validFrequencies.includes(config.frequency)) {
    errors.push('Frequency must be one of: weekly, monthly, quarterly, yearly');
  }

  if (typeof config.interval !== 'number' || config.interval < 1 || config.interval > 12) {
    errors.push('Interval must be a number between 1 and 12');
  }

  if (!(config.startDate instanceof Date) || isNaN(config.startDate.getTime())) {
    errors.push('Start date must be a valid Date object');
  }

  if (config.endDate && (!(config.endDate instanceof Date) || isNaN(config.endDate.getTime()))) {
    errors.push('End date must be a valid Date object');
  }

  if (config.endDate && config.startDate && config.endDate <= config.startDate) {
    errors.push('End date must be after start date');
  }

  if (config.maxOccurrences !== undefined) {
    if (typeof config.maxOccurrences !== 'number' || config.maxOccurrences < 1 || config.maxOccurrences > 1000) {
      errors.push('Max occurrences must be a number between 1 and 1000');
    }
  }

  if (!(config.nextGenerationDate instanceof Date) || isNaN(config.nextGenerationDate.getTime())) {
    errors.push('Next generation date must be a valid Date object');
  }

  if (config.nextGenerationDate < config.startDate) {
    errors.push('Next generation date cannot be before start date');
  }

  if (typeof config.isActive !== 'boolean') {
    errors.push('isActive must be a boolean value');
  }

  return createValidationResult(errors.length === 0, errors);
};

// Client user validation
export const validateClientUser = (user: ClientUser): ValidationResult => {
  const errors: string[] = [];

  if (!user.id || typeof user.id !== 'string') {
    errors.push('User ID is required');
  }

  if (!user.email || typeof user.email !== 'string' || !EMAIL_REGEX.test(user.email)) {
    errors.push('Valid email address is required');
  }

  if (!user.passwordHash || typeof user.passwordHash !== 'string' || user.passwordHash.length < 8) {
    errors.push('Password hash must be at least 8 characters');
  }

  if (!user.name || typeof user.name !== 'string' || user.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (user.company !== undefined && typeof user.company !== 'string') {
    errors.push('Company must be a string');
  }

  if (typeof user.isVerified !== 'boolean') {
    errors.push('isVerified must be a boolean value');
  }

  if (!(user.createdAt instanceof Date) || isNaN(user.createdAt.getTime())) {
    errors.push('Created date must be a valid Date object');
  }

  if (user.lastLoginAt && (!(user.lastLoginAt instanceof Date) || isNaN(user.lastLoginAt.getTime()))) {
    errors.push('Last login date must be a valid Date object');
  }

  if (user.resetToken !== undefined && typeof user.resetToken !== 'string') {
    errors.push('Reset token must be a string');
  }

  if (user.resetTokenExpiry && (!(user.resetTokenExpiry instanceof Date) || isNaN(user.resetTokenExpiry.getTime()))) {
    errors.push('Reset token expiry must be a valid Date object');
  }

  return createValidationResult(errors.length === 0, errors);
};

// Enhanced invoice validation
export const validateEnhancedInvoice = (invoice: EnhancedInvoice): ValidationResult => {
  const errors: string[] = [];

  // Validate basic invoice fields
  if (!invoice.id || typeof invoice.id !== 'string') {
    errors.push('Invoice ID is required');
  }

  if (!invoice.invoiceNumber || typeof invoice.invoiceNumber !== 'string') {
    errors.push('Invoice number is required');
  }

  if (!invoice.invoiceDate || typeof invoice.invoiceDate !== 'string') {
    errors.push('Invoice date is required');
  }

  if (!invoice.clientId || typeof invoice.clientId !== 'string') {
    errors.push('Client ID is required');
  }

  // Validate currency
  const currencyValidation = validateCurrency(invoice.currency);
  if (!currencyValidation.isValid) {
    errors.push(...currencyValidation.errors.map(e => `Currency: ${e}`));
  }

  // Validate exchange rate if present
  if (invoice.exchangeRate) {
    const exchangeRateValidation = validateExchangeRate(invoice.exchangeRate);
    if (!exchangeRateValidation.isValid) {
      errors.push(...exchangeRateValidation.errors.map(e => `Exchange Rate: ${e}`));
    }
  }

  // Validate recurring config if present
  if (invoice.isRecurring && invoice.recurringConfig) {
    const recurringValidation = validateRecurringConfig(invoice.recurringConfig);
    if (!recurringValidation.isValid) {
      errors.push(...recurringValidation.errors.map(e => `Recurring Config: ${e}`));
    }
  } else if (invoice.isRecurring && !invoice.recurringConfig) {
    errors.push('Recurring config is required when isRecurring is true');
  }

  // Validate status values
  const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
  if (!validStatuses.includes(invoice.status)) {
    errors.push('Status must be one of: draft, sent, paid, overdue, cancelled');
  }

  const validPaymentStatuses = ['unpaid', 'partial', 'paid', 'refunded'];
  if (!validPaymentStatuses.includes(invoice.paymentStatus)) {
    errors.push('Payment status must be one of: unpaid, partial, paid, refunded');
  }

  // Validate dates
  if (!(invoice.createdAt instanceof Date) || isNaN(invoice.createdAt.getTime())) {
    errors.push('Created date must be a valid Date object');
  }

  if (!(invoice.updatedAt instanceof Date) || isNaN(invoice.updatedAt.getTime())) {
    errors.push('Updated date must be a valid Date object');
  }

  if (!(invoice.dueDate instanceof Date) || isNaN(invoice.dueDate.getTime())) {
    errors.push('Due date must be a valid Date object');
  }

  if (invoice.paidAt && (!(invoice.paidAt instanceof Date) || isNaN(invoice.paidAt.getTime()))) {
    errors.push('Paid date must be a valid Date object');
  }

  // Validate business and client info
  if (!invoice.business || !invoice.business.name) {
    errors.push('Business information is required');
  }

  if (!invoice.client || !invoice.client.name) {
    errors.push('Client information is required');
  }

  // Validate line items
  if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
    errors.push('At least one line item is required');
  }

  // Validate totals
  if (!invoice.totals || typeof invoice.totals.total !== 'number' || invoice.totals.total < 0) {
    errors.push('Valid totals are required');
  }

  return createValidationResult(errors.length === 0, errors);
};

// Payment validation
export const validatePayment = (payment: Payment): ValidationResult => {
  const errors: string[] = [];

  if (!payment.id || typeof payment.id !== 'string') {
    errors.push('Payment ID is required');
  }

  if (!payment.invoiceId || typeof payment.invoiceId !== 'string') {
    errors.push('Invoice ID is required');
  }

  if (!payment.clientId || typeof payment.clientId !== 'string') {
    errors.push('Client ID is required');
  }

  // Validate amount
  const amountValidation = validateCurrencyAmount(payment.amount);
  if (!amountValidation.isValid) {
    errors.push(...amountValidation.errors.map(e => `Amount: ${e}`));
  }

  // Validate payment method
  const validPaymentMethods = ['card', 'bank_transfer', 'paypal', 'other'];
  if (!validPaymentMethods.includes(payment.paymentMethod)) {
    errors.push('Payment method must be one of: card, bank_transfer, paypal, other');
  }

  if (!payment.transactionId || typeof payment.transactionId !== 'string') {
    errors.push('Transaction ID is required');
  }

  // Validate status
  const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
  if (!validStatuses.includes(payment.status)) {
    errors.push('Status must be one of: pending, completed, failed, refunded');
  }

  // Validate dates
  if (!(payment.processedAt instanceof Date) || isNaN(payment.processedAt.getTime())) {
    errors.push('Processed date must be a valid Date object');
  }

  if (payment.refundedAt && (!(payment.refundedAt instanceof Date) || isNaN(payment.refundedAt.getTime()))) {
    errors.push('Refunded date must be a valid Date object');
  }

  if (payment.refundAmount !== undefined) {
    if (typeof payment.refundAmount !== 'number' || payment.refundAmount < 0) {
      errors.push('Refund amount must be a non-negative number');
    }
    if (payment.refundAmount > payment.amount.amount) {
      errors.push('Refund amount cannot exceed payment amount');
    }
  }

  return createValidationResult(errors.length === 0, errors);
};

// Batch validation function
export const validateInvoiceData = (invoice: EnhancedInvoice): ValidationResult => {
  return validateEnhancedInvoice(invoice);
};

// Helper function to validate required fields for invoice creation
export const validateInvoiceCreation = (invoiceData: Partial<EnhancedInvoice>): ValidationResult => {
  const errors: string[] = [];

  const requiredFields = ['business', 'client', 'items', 'invoiceNumber', 'currency'];
  
  for (const field of requiredFields) {
    if (!invoiceData[field as keyof EnhancedInvoice]) {
      errors.push(`${field} is required for invoice creation`);
    }
  }

  return createValidationResult(errors.length === 0, errors);
};

// Helper function to validate password strength
export const validatePasswordStrength = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return createValidationResult(errors.length === 0, errors);
};