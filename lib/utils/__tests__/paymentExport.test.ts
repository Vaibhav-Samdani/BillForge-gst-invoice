import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  exportPaymentsToCSV,
  generatePaymentSummary,
  formatCurrency,
  formatDate,
  groupPaymentsByDateRange,
  filterPaymentsByDateRange,
  sortPayments,
  searchPayments,
  validatePaymentExportData,
} from '../paymentExport';
import { Payment, EnhancedInvoice, Currency } from '../../types';

// Mock DOM methods
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => ({
      setAttribute: vi.fn(),
      style: { visibility: '' },
      click: vi.fn(),
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  },
});

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

Object.defineProperty(global, 'Blob', {
  value: class MockBlob {
    constructor(content: any[], options: any) {
      this.content = content;
      this.options = options;
    }
    content: any[];
    options: any;
  },
});

const mockCurrency: Currency = {
  code: 'USD',
  symbol: '$',
  name: 'US Dollar',
  decimalPlaces: 2,
};

const mockPayments: Payment[] = [
  {
    id: 'payment-1',
    invoiceId: 'invoice-1',
    clientId: 'client-1',
    amount: {
      amount: 150.00,
      currency: 'USD',
    },
    paymentMethod: 'card',
    transactionId: 'txn_1234567890',
    status: 'completed',
    processedAt: new Date('2024-01-15T10:30:00Z'),
  },
  {
    id: 'payment-2',
    invoiceId: 'invoice-2',
    clientId: 'client-1',
    amount: {
      amount: 100.00,
      currency: 'USD',
    },
    paymentMethod: 'paypal',
    transactionId: 'txn_0987654321',
    status: 'refunded',
    processedAt: new Date('2024-01-10T14:20:00Z'),
    refundAmount: 50.00,
    refundedAt: new Date('2024-01-12T09:15:00Z'),
  },
  {
    id: 'payment-3',
    invoiceId: 'invoice-3',
    clientId: 'client-2',
    amount: {
      amount: 75.00,
      currency: 'EUR',
    },
    paymentMethod: 'bank_transfer',
    transactionId: 'txn_1122334455',
    status: 'pending',
    processedAt: new Date('2024-01-20T16:45:00Z'),
  },
];

const mockInvoices: EnhancedInvoice[] = [
  {
    id: 'invoice-1',
    invoiceNumber: 'INV-001',
    business: {
      name: 'Test Business',
      address: '123 Test St',
      phone: '555-0123',
      email: 'test@business.com',
      gst: '123456789',
    },
    client: {
      name: 'John Doe',
      address: '456 Client Ave',
      phone: '555-0456',
      email: 'john@example.com',
      gst: '987654321',
    },
    items: [],
    invoiceDate: '2024-01-15',
    sameGst: false,
    globalGst: 0,
    totals: {
      subtotal: 150.00,
      tax: 0,
      total: 150.00,
    },
    currency: mockCurrency,
    isRecurring: false,
    status: 'paid',
    paymentStatus: 'paid',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    dueDate: new Date('2024-02-15T00:00:00Z'),
    paidAt: new Date('2024-01-15T10:30:00Z'),
    clientId: 'client-1',
  },
  {
    id: 'invoice-2',
    invoiceNumber: 'INV-002',
    business: {
      name: 'Test Business',
      address: '123 Test St',
      phone: '555-0123',
      email: 'test@business.com',
      gst: '123456789',
    },
    client: {
      name: 'Jane Smith',
      address: '789 Client Blvd',
      phone: '555-0789',
      email: 'jane@example.com',
      gst: '456789123',
    },
    items: [],
    invoiceDate: '2024-01-10',
    sameGst: false,
    globalGst: 0,
    totals: {
      subtotal: 100.00,
      tax: 0,
      total: 100.00,
    },
    currency: mockCurrency,
    isRecurring: false,
    status: 'cancelled',
    paymentStatus: 'refunded',
    createdAt: new Date('2024-01-10T14:00:00Z'),
    updatedAt: new Date('2024-01-12T09:15:00Z'),
    dueDate: new Date('2024-02-10T00:00:00Z'),
    clientId: 'client-1',
  },
];

describe('paymentExport utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportPaymentsToCSV', () => {
    it('should create and download CSV file', () => {
      const mockClick = vi.fn();
      const mockElement = {
        setAttribute: vi.fn(),
        style: { visibility: '' },
        click: mockClick,
      };
      
      vi.mocked(document.createElement).mockReturnValue(mockElement as any);

      exportPaymentsToCSV({
        payments: mockPayments,
        invoices: mockInvoices,
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('href', 'mock-url');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('payment-history-'));
      expect(mockClick).toHaveBeenCalled();
    });

    it('should handle payments with commas in data', () => {
      const paymentsWithCommas = [{
        ...mockPayments[0],
        transactionId: 'txn_123,456,789',
      }];

      exportPaymentsToCSV({
        payments: paymentsWithCommas,
        invoices: mockInvoices,
      });

      expect(document.createElement).toHaveBeenCalled();
    });
  });

  describe('generatePaymentSummary', () => {
    it('should calculate correct summary statistics', () => {
      const summary = generatePaymentSummary(mockPayments);

      expect(summary.totalPayments).toBe(3);
      expect(summary.totalAmount).toBe(325.00); // 150 + 100 + 75
      expect(summary.completedPayments).toBe(1);
      expect(summary.completedAmount).toBe(150.00);
      expect(summary.refundedPayments).toBe(1);
      expect(summary.refundedAmount).toBe(50.00);
      expect(summary.pendingPayments).toBe(1);
      expect(summary.failedPayments).toBe(0);
    });

    it('should group by payment methods correctly', () => {
      const summary = generatePaymentSummary(mockPayments);

      expect(summary.paymentMethods.card).toEqual({ count: 1, amount: 150.00 });
      expect(summary.paymentMethods.paypal).toEqual({ count: 1, amount: 100.00 });
      expect(summary.paymentMethods.bank_transfer).toEqual({ count: 1, amount: 75.00 });
    });

    it('should group by currencies correctly', () => {
      const summary = generatePaymentSummary(mockPayments);

      expect(summary.currencies.USD).toEqual({ count: 2, amount: 250.00 });
      expect(summary.currencies.EUR).toEqual({ count: 1, amount: 75.00 });
    });
  });

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      const formatted = formatCurrency(123.45, 'USD');
      expect(formatted).toBe('$123.45');
    });

    it('should format EUR correctly', () => {
      const formatted = formatCurrency(123.45, 'EUR');
      expect(formatted).toBe('€123.45');
    });

    it('should handle zero amounts', () => {
      const formatted = formatCurrency(0, 'USD');
      expect(formatted).toBe('$0.00');
    });
  });

  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toBe('Jan 15, 2024');
    });

    it('should format date with custom format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date, 'yyyy-MM-dd');
      expect(formatted).toBe('2024-01-15');
    });
  });

  describe('groupPaymentsByDateRange', () => {
    it('should group by month correctly', () => {
      const grouped = groupPaymentsByDateRange(mockPayments, 'month');
      
      expect(grouped['2024-01']).toHaveLength(3);
    });

    it('should group by day correctly', () => {
      const grouped = groupPaymentsByDateRange(mockPayments, 'day');
      
      expect(grouped['2024-01-15']).toHaveLength(1);
      expect(grouped['2024-01-10']).toHaveLength(1);
      expect(grouped['2024-01-20']).toHaveLength(1);
    });
  });

  describe('filterPaymentsByDateRange', () => {
    it('should filter payments within date range', () => {
      const startDate = new Date('2024-01-12T00:00:00Z');
      const endDate = new Date('2024-01-18T23:59:59Z');
      
      const filtered = filterPaymentsByDateRange(mockPayments, startDate, endDate);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('payment-1');
    });

    it('should return empty array when no payments in range', () => {
      const startDate = new Date('2024-02-01T00:00:00Z');
      const endDate = new Date('2024-02-28T23:59:59Z');
      
      const filtered = filterPaymentsByDateRange(mockPayments, startDate, endDate);
      
      expect(filtered).toHaveLength(0);
    });
  });

  describe('sortPayments', () => {
    it('should sort by amount ascending', () => {
      const sorted = sortPayments(mockPayments, 'amount', 'asc');
      
      expect(sorted[0].amount.amount).toBe(75.00);
      expect(sorted[1].amount.amount).toBe(100.00);
      expect(sorted[2].amount.amount).toBe(150.00);
    });

    it('should sort by amount descending', () => {
      const sorted = sortPayments(mockPayments, 'amount', 'desc');
      
      expect(sorted[0].amount.amount).toBe(150.00);
      expect(sorted[1].amount.amount).toBe(100.00);
      expect(sorted[2].amount.amount).toBe(75.00);
    });

    it('should sort by status', () => {
      const sorted = sortPayments(mockPayments, 'status', 'asc');
      
      expect(sorted[0].status).toBe('completed');
      expect(sorted[1].status).toBe('pending');
      expect(sorted[2].status).toBe('refunded');
    });
  });

  describe('searchPayments', () => {
    it('should search by transaction ID', () => {
      const results = searchPayments(mockPayments, mockInvoices, '1234567890');
      
      expect(results).toHaveLength(1);
      expect(results[0].transactionId).toBe('txn_1234567890');
    });

    it('should search by invoice number', () => {
      const results = searchPayments(mockPayments, mockInvoices, 'INV-001');
      
      expect(results).toHaveLength(1);
      expect(results[0].invoiceId).toBe('invoice-1');
    });

    it('should search by client name', () => {
      const results = searchPayments(mockPayments, mockInvoices, 'John Doe');
      
      expect(results).toHaveLength(1);
      expect(results[0].invoiceId).toBe('invoice-1');
    });

    it('should return all payments for empty search', () => {
      const results = searchPayments(mockPayments, mockInvoices, '');
      
      expect(results).toHaveLength(3);
    });

    it('should be case insensitive', () => {
      const results = searchPayments(mockPayments, mockInvoices, 'john doe');
      
      expect(results).toHaveLength(1);
    });
  });

  describe('validatePaymentExportData', () => {
    it('should validate correct data', () => {
      const result = validatePaymentExportData({
        payments: mockPayments,
        invoices: mockInvoices,
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing payments', () => {
      const result = validatePaymentExportData({
        payments: [],
        invoices: mockInvoices,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No payments to export');
    });

    it('should detect missing invoices', () => {
      const result = validatePaymentExportData({
        payments: mockPayments,
        invoices: [],
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invoice data is required for export');
    });

    it('should detect invalid payment data', () => {
      const invalidPayments = [
        {
          ...mockPayments[0],
          id: '', // Missing ID
        },
        {
          ...mockPayments[1],
          transactionId: '', // Missing transaction ID
        },
        {
          ...mockPayments[2],
          amount: { amount: 0, currency: 'USD' }, // Invalid amount
        },
      ];

      const result = validatePaymentExportData({
        payments: invalidPayments,
        invoices: mockInvoices,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});