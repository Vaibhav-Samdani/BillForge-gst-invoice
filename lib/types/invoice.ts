// Enhanced Invoice Types for Multi-Currency and Recurring Invoice Support
import { BusinessInfo, ClientInfo, LineItem, InvoiceTotals } from '../store';

// Currency Support Types
export interface Currency {
  code: string; // ISO 4217 currency code (USD, EUR, GBP, etc.)
  symbol: string; // Currency symbol ($, €, £, etc.)
  name: string; // Full currency name
  decimalPlaces: number; // Number of decimal places for the currency
}

export interface ExchangeRate {
  baseCurrency: string; // Base currency code
  targetCurrency: string; // Target currency code
  rate: number; // Exchange rate value
  timestamp: Date; // When the rate was fetched
  source: string; // Source of the exchange rate (e.g., 'ExchangeRate-API')
}

export interface CurrencyAmount {
  amount: number; // Amount in the specified currency
  currency: string; // Currency code
  exchangeRate?: number; // Exchange rate used for conversion
  baseAmount?: number; // Amount in base currency (if converted)
}

// Recurring Invoice Configuration
export interface RecurringConfig {
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number; // Every X weeks/months/quarters/years
  startDate: Date; // When recurring invoices should start
  endDate?: Date; // When recurring invoices should end (optional)
  maxOccurrences?: number; // Maximum number of invoices to generate (optional)
  nextGenerationDate: Date; // Next scheduled generation date
  isActive: boolean; // Whether the recurring schedule is active
}

// Client User for Portal
export interface ClientUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  company?: string;
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
}

// Enhanced Invoice Model
export interface EnhancedInvoice {
  // Core invoice data (from existing InvoiceData)
  business: BusinessInfo;
  client: ClientInfo;
  items: LineItem[];
  invoiceNumber: string;
  invoiceDate: string;
  sameGst: boolean;
  globalGst: number;
  totals: InvoiceTotals;
  
  // Enhanced fields
  id: string;
  currency: Currency;
  exchangeRate?: ExchangeRate;
  isRecurring: boolean;
  recurringConfig?: RecurringConfig;
  parentInvoiceId?: string; // For recurring invoices generated from a template
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  paidAt?: Date;
  clientId: string; // Reference to ClientUser
}

// Payment Information
export interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  amount: CurrencyAmount;
  paymentMethod: 'card' | 'bank_transfer' | 'paypal' | 'other';
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  processedAt: Date;
  refundedAt?: Date;
  refundAmount?: number;
}

// Enhanced Invoice State (extends existing InvoiceState)
export interface EnhancedInvoiceState {
  // Existing state properties
  business: BusinessInfo;
  client: ClientInfo;
  items: LineItem[];
  invoiceNumber: string;
  invoiceDate: string;
  sameGst: boolean;
  globalGst: number;
  totals: InvoiceTotals;

  // New currency-related state
  selectedCurrency: Currency;
  exchangeRates: ExchangeRate[];
  supportedCurrencies: Currency[];

  // New recurring invoice state
  recurringConfig: RecurringConfig | null;
  recurringInvoices: EnhancedInvoice[];

  // Enhanced invoice management
  currentInvoice: EnhancedInvoice | null;
  savedInvoices: EnhancedInvoice[];

  // Existing actions
  setBusiness: (business: Partial<BusinessInfo>) => void;
  setClient: (client: Partial<ClientInfo>) => void;
  setInvoiceNumber: (number: string) => void;
  setInvoiceDate: (date: string) => void;
  addItem: () => void;
  updateItem: (id: string, item: Partial<LineItem>) => void;
  removeItem: (id: string) => void;
  setSameGst: (same: boolean) => void;
  setGlobalGst: (gst: number) => void;

  // New currency actions
  setCurrency: (currency: Currency) => void;
  updateExchangeRates: (rates: ExchangeRate[]) => void;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => Promise<CurrencyAmount>;

  // New recurring invoice actions
  setRecurringConfig: (config: RecurringConfig | null) => void;
  saveInvoice: (invoice: EnhancedInvoice) => Promise<void>;
  loadInvoices: () => Promise<EnhancedInvoice[]>;
  generateRecurringInvoice: (templateId: string) => Promise<EnhancedInvoice>;
}

// Client Portal State (separate from main invoice state)
export interface ClientPortalState {
  currentClient: ClientUser | null;
  clientInvoices: EnhancedInvoice[];
  clientPayments: Payment[];
  isAuthenticated: boolean;
  
  // Authentication actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<ClientUser>) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  
  // Client data actions
  loadClientInvoices: () => Promise<void>;
  loadClientPayments: () => Promise<void>;
  makePayment: (invoiceId: string, paymentData: Partial<Payment>) => Promise<boolean>;
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Filter and sorting types
export interface InvoiceFilters {
  status?: string[];
  paymentStatus?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  currency?: string[];
  clientId?: string;
}

export interface InvoiceSortOptions {
  field: 'invoiceDate' | 'dueDate' | 'total' | 'status' | 'invoiceNumber';
  direction: 'asc' | 'desc';
}

// Default currency (USD)
export const DEFAULT_CURRENCY: Currency = {
  code: 'USD',
  symbol: '$',
  name: 'US Dollar',
  decimalPlaces: 2,
};

// Supported currencies list
export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimalPlaces: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimalPlaces: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2 },
];