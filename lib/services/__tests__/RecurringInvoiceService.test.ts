import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RecurringInvoiceService } from '../RecurringInvoiceService';
import { addWeeks, addMonths, addYears } from 'date-fns';

// Mock the entire service to focus on testing the public interface
describe('RecurringInvoiceService', () => {
  let recurringService: RecurringInvoiceService;

  const mockInvoice = {
    invoiceNumber: 'INV-001',
    clientId: 'client_123',
    business: { 
      name: 'Test Business',
      company: 'Test Business Inc.',
      address: '123 Business St',
      gstin: 'GST123456789',
      phone: '+1234567890',
      email: 'business@test.com'
    },
    client: { 
      name: 'John Doe', 
      email: 'john@example.com',
      company: 'Client Company',
      address: '456 Client Ave',
      gstin: 'GST987654321',
      phone: '+0987654321'
    },
    items: [{ 
      id: '1',
      description: 'Service', 
      quantity: 1, 
      rate: 100,
      amount: 100,
      gst: 10,
      cgst: 5,
      sgst: 5,
      igst: 0
    }],
    currency: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
    totals: { subtotal: 100, cgst: 5, sgst: 5, igst: 0, round_off: 0, total: 110 },
    invoiceDate: '2024-01-01',
    dueDate: new Date('2024-01-31'),
    status: 'draft' as const,
    paymentStatus: 'unpaid' as const,
    isRecurring: false,
    sameGst: true,
    globalGst: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    recurringService = new RecurringInvoiceService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateNextGenerationDate', () => {
    it('should calculate next date for weekly frequency', () => {
      const currentDate = new Date('2024-01-01');
      const nextDate = recurringService.calculateNextGenerationDate(
        currentDate,
        'weekly',
        1
      );

      expect(nextDate).toEqual(addWeeks(currentDate, 1));
    });

    it('should calculate next date for monthly frequency', () => {
      const currentDate = new Date('2024-01-01');
      const nextDate = recurringService.calculateNextGenerationDate(
        currentDate,
        'monthly',
        1
      );

      expect(nextDate).toEqual(addMonths(currentDate, 1));
    });

    it('should calculate next date for quarterly frequency', () => {
      const currentDate = new Date('2024-01-01');
      const nextDate = recurringService.calculateNextGenerationDate(
        currentDate,
        'quarterly',
        1
      );

      expect(nextDate).toEqual(addMonths(currentDate, 3));
    });

    it('should calculate next date for yearly frequency', () => {
      const currentDate = new Date('2024-01-01');
      const nextDate = recurringService.calculateNextGenerationDate(
        currentDate,
        'yearly',
        1
      );

      expect(nextDate).toEqual(addYears(currentDate, 1));
    });

    it('should handle custom intervals', () => {
      const currentDate = new Date('2024-01-01');
      const nextDate = recurringService.calculateNextGenerationDate(
        currentDate,
        'weekly',
        2 // Every 2 weeks
      );

      expect(nextDate).toEqual(addWeeks(currentDate, 2));
    });
  });

  describe('service instantiation', () => {
    it('should create a service instance', () => {
      expect(recurringService).toBeInstanceOf(RecurringInvoiceService);
    });

    it('should have calculateNextGenerationDate method', () => {
      expect(typeof recurringService.calculateNextGenerationDate).toBe('function');
    });
  });

  describe('basic functionality', () => {
    it('should handle date calculations correctly', () => {
      const testDate = new Date('2024-01-01');
      
      // Test weekly calculation
      const weeklyResult = recurringService.calculateNextGenerationDate(testDate, 'weekly', 1);
      expect(weeklyResult.getTime()).toBeGreaterThan(testDate.getTime());
      
      // Test monthly calculation
      const monthlyResult = recurringService.calculateNextGenerationDate(testDate, 'monthly', 1);
      expect(monthlyResult.getTime()).toBeGreaterThan(testDate.getTime());
      
      // Test yearly calculation
      const yearlyResult = recurringService.calculateNextGenerationDate(testDate, 'yearly', 1);
      expect(yearlyResult.getTime()).toBeGreaterThan(testDate.getTime());
    });
  });
});