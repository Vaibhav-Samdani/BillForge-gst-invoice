import { Prisma } from '../generated/prisma';

// Export Prisma-generated types
export type ClientUser = Prisma.ClientUserGetPayload<Record<string, never>>;
export type Invoice = Prisma.InvoiceGetPayload<Record<string, never>>;
export type Payment = Prisma.PaymentGetPayload<Record<string, never>>;
export type ExchangeRate = Prisma.ExchangeRateGetPayload<Record<string, never>>;

// Enhanced types with relations
export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    client: true;
    payments: true;
    parentInvoice: true;
    childInvoices: true;
  };
}>;

export type ClientUserWithInvoices = Prisma.ClientUserGetPayload<{
  include: {
    invoices: true;
    payments: true;
  };
}>;

export type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: {
    invoice: true;
    client: true;
  };
}>;

// Currency-related types
export interface Currency {
  code: string; // ISO 4217 currency code
  symbol: string;
  name: string;
  decimalPlaces: number;
}

export interface CurrencyAmount {
  amount: number;
  currency: string;
  exchangeRate?: number;
  baseAmount?: number; // Amount in base currency
}

// Recurring invoice configuration
export interface RecurringConfig {
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number; // Every X weeks/months/etc
  startDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
  nextGenerationDate: Date;
  isActive: boolean;
}

// Invoice status enums
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';
export type PaymentMethodType = 'card' | 'bank_transfer' | 'paypal' | 'other';
export type PaymentTransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// Database operation result types
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pagination types
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}