// Unit tests for ScheduledTaskService
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScheduledTaskService } from '../ScheduledTaskService';
import { recurringInvoiceService } from '../RecurringInvoiceService';
import { EnhancedInvoice, RecurringConfig } from '../../types/invoice';

// Mock the RecurringInvoiceService
vi.mock('../RecurringInvoiceService', () => ({
  recurringInvoiceService: {
    getDueRecurringInvoices: vi.fn(),
    generateRecurringInvoice: vi.fn(),
    getRecurringInvoices: vi.fn(),
    getGeneratedInvoices: vi.fn(),
    getRecurringInvoiceStats: vi.fn(),
  },
}));

describe('ScheduledTaskService', () => {
  let service: ScheduledTaskService;
  const mockRecurringService = recurringInvoiceService as any;

  beforeEach(() => {
    service = new ScheduledTaskService({
      maxRetries: 2,
      retryDelayMs: 100,
      backoffMultiplier: 2,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('generateDueRecurringInvoices', () => {
    it('should return success when no invoices are due', async () => {
      mockRecurringService.getDueRecurringInvoices.mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await service.generateDueRecurringInvoices();

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.errors).toEqual([]);
      expect(result.generatedInvoices).toEqual([]);
    });

    it('should generate invoices successfully when due invoices exist', async () => {
      const dueInvoice: EnhancedInvoice = {
        id: 'test-id',
        invoiceNumber: 'TEST-001',
        business: {} as any,
        client: {} as any,
        items: [],
        invoiceDate: '2024-01-01',
        sameGst: false,
        globalGst: 0,
        totals: { subtotal: 1000, cgst: 90, sgst: 90, igst: 0, round_off: 0, total: 1180 },
        currency: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
        isRecurring: true,
        status: 'draft',
        paymentStatus: 'unpaid',
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: new Date(),
        clientId: 'client-id',
      };

      const generatedInvoice: EnhancedInvoice = {
        ...dueInvoice,
        id: 'generated-id',
        invoiceNumber: 'TEST-001-001',
        isRecurring: false,
        parentInvoiceId: 'test-id',
      };

      mockRecurringService.getDueRecurringInvoices.mockResolvedValue({
        success: true,
        data: [dueInvoice],
      });

      mockRecurringService.generateRecurringInvoice.mockResolvedValue({
        success: true,
        data: generatedInvoice,
      });

      const result = await service.generateDueRecurringInvoices();

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.errors).toEqual([]);
      expect(result.generatedInvoices).toHaveLength(1);
      expect(result.generatedInvoices[0].invoiceNumber).toBe('TEST-001-001');
    });

    it('should handle generation failures and continue processing', async () => {
      const dueInvoices: EnhancedInvoice[] = [
        {
          id: 'test-id-1',
          invoiceNumber: 'TEST-001',
          business: {} as any,
          client: {} as any,
          items: [],
          invoiceDate: '2024-01-01',
          sameGst: false,
          globalGst: 0,
          totals: { subtotal: 1000, cgst: 90, sgst: 90, igst: 0, round_off: 0, total: 1180 },
          currency: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
          isRecurring: true,
          status: 'draft',
          paymentStatus: 'unpaid',
          createdAt: new Date(),
          updatedAt: new Date(),
          dueDate: new Date(),
          clientId: 'client-id',
        },
        {
          id: 'test-id-2',
          invoiceNumber: 'TEST-002',
          business: {} as any,
          client: {} as any,
          items: [],
          invoiceDate: '2024-01-01',
          sameGst: false,
          globalGst: 0,
          totals: { subtotal: 2000, cgst: 180, sgst: 180, igst: 0, round_off: 0, total: 2360 },
          currency: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
          isRecurring: true,
          status: 'draft',
          paymentStatus: 'unpaid',
          createdAt: new Date(),
          updatedAt: new Date(),
          dueDate: new Date(),
          clientId: 'client-id',
        },
      ];

      const generatedInvoice: EnhancedInvoice = {
        ...dueInvoices[1],
        id: 'generated-id',
        invoiceNumber: 'TEST-002-001',
        isRecurring: false,
        parentInvoiceId: 'test-id-2',
      };

      mockRecurringService.getDueRecurringInvoices.mockResolvedValue({
        success: true,
        data: dueInvoices,
      });

      // First invoice fails all retries, second succeeds
      mockRecurringService.generateRecurringInvoice
        .mockResolvedValueOnce({
          success: false,
          error: 'Generation failed',
        })
        .mockResolvedValueOnce({
          success: false,
          error: 'Generation failed again',
        })
        .mockResolvedValueOnce({
          success: true,
          data: generatedInvoice,
        });

      const result = await service.generateDueRecurringInvoices();

      expect(result.success).toBe(false); // Overall failure due to one failed
      expect(result.processedCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to generate from template TEST-001');
      expect(result.generatedInvoices).toHaveLength(1);
    });

    it('should retry failed generations', async () => {
      vi.useFakeTimers();

      const dueInvoice: EnhancedInvoice = {
        id: 'test-id',
        invoiceNumber: 'TEST-001',
        business: {} as any,
        client: {} as any,
        items: [],
        invoiceDate: '2024-01-01',
        sameGst: false,
        globalGst: 0,
        totals: { subtotal: 1000, cgst: 90, sgst: 90, igst: 0, round_off: 0, total: 1180 },
        currency: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
        isRecurring: true,
        status: 'draft',
        paymentStatus: 'unpaid',
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: new Date(),
        clientId: 'client-id',
      };

      const generatedInvoice: EnhancedInvoice = {
        ...dueInvoice,
        id: 'generated-id',
        invoiceNumber: 'TEST-001-001',
        isRecurring: false,
        parentInvoiceId: 'test-id',
      };

      mockRecurringService.getDueRecurringInvoices.mockResolvedValue({
        success: true,
        data: [dueInvoice],
      });

      // Fail first attempt, succeed on retry
      mockRecurringService.generateRecurringInvoice
        .mockResolvedValueOnce({
          success: false,
          error: 'Temporary failure',
        })
        .mockResolvedValueOnce({
          success: true,
          data: generatedInvoice,
        });

      const resultPromise = service.generateDueRecurringInvoices();

      // Fast-forward through retry delay
      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(mockRecurringService.generateRecurringInvoice).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should prevent concurrent execution', async () => {
      mockRecurringService.getDueRecurringInvoices.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: [] }), 100))
      );

      const promise1 = service.generateDueRecurringInvoices();
      const promise2 = service.generateDueRecurringInvoices();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
      expect(result2.errors[0]).toBe('Task is already running');
    });
  });

  describe('getTaskStatistics', () => {
    it('should return task statistics', async () => {
      mockRecurringService.getDueRecurringInvoices.mockResolvedValue({
        success: true,
        data: [{ id: '1' }, { id: '2' }],
      });

      mockRecurringService.getRecurringInvoiceStats.mockResolvedValue({
        success: true,
        data: {
          totalTemplates: 5,
          activeTemplates: 3,
          totalGenerated: 15,
          totalValue: 50000,
          upcomingGenerations: 2,
        },
      });

      const stats = await service.getTaskStatistics();

      expect(stats.dueInvoicesCount).toBe(2);
      expect(stats.activeTemplatesCount).toBe(3);
    });

    it('should handle errors gracefully', async () => {
      mockRecurringService.getDueRecurringInvoices.mockRejectedValue(new Error('Database error'));
      mockRecurringService.getRecurringInvoiceStats.mockRejectedValue(new Error('Database error'));

      const stats = await service.getTaskStatistics();

      expect(stats.dueInvoicesCount).toBe(0);
      expect(stats.activeTemplatesCount).toBe(0);
    });
  });

  describe('validateRecurringTemplates', () => {
    it('should validate templates and return issues', async () => {
      const templates: EnhancedInvoice[] = [
        {
          id: 'valid-template',
          invoiceNumber: 'VALID-001',
          business: { name: 'Test' } as any,
          client: { name: 'Client' } as any,
          items: [{ id: '1', description: 'Item', hsnSac: '1234', quantity: 1, rate: 100, per: 'pcs', amount: 100, gst: 18 }],
          invoiceDate: '2024-01-01',
          sameGst: false,
          globalGst: 0,
          totals: { subtotal: 100, cgst: 9, sgst: 9, igst: 0, round_off: 0, total: 118 },
          currency: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
          isRecurring: true,
          recurringConfig: {
            frequency: 'monthly',
            interval: 1,
            startDate: new Date(),
            nextGenerationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isActive: true,
          } as RecurringConfig,
          status: 'draft',
          paymentStatus: 'unpaid',
          createdAt: new Date(),
          updatedAt: new Date(),
          dueDate: new Date(),
          clientId: 'client-id',
        },
        {
          id: 'invalid-template',
          invoiceNumber: 'INVALID-001',
          business: {} as any, // Missing business data
          client: {} as any, // Missing client data
          items: [], // No items
          invoiceDate: '2024-01-01',
          sameGst: false,
          globalGst: 0,
          totals: { subtotal: 0, cgst: 0, sgst: 0, igst: 0, round_off: 0, total: 0 },
          currency: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
          isRecurring: true,
          recurringConfig: undefined, // Missing config
          status: 'draft',
          paymentStatus: 'unpaid',
          createdAt: new Date(),
          updatedAt: new Date(),
          dueDate: new Date(),
          clientId: 'client-id',
        },
      ];

      mockRecurringService.getRecurringInvoices.mockResolvedValue({
        success: true,
        data: templates,
      });

      mockRecurringService.getGeneratedInvoices.mockResolvedValue({
        success: true,
        data: [],
      });

      const validation = await service.validateRecurringTemplates();

      expect(validation.validTemplates).toBe(1);
      expect(validation.invalidTemplates).toBe(1);
      expect(validation.issues).toHaveLength(1);
      expect(validation.issues[0].templateId).toBe('invalid-template');
      expect(validation.issues[0].issues).toContain('Missing recurring configuration');
      expect(validation.issues[0].issues).toContain('Incomplete invoice data (missing business, client, or items)');
    });
  });

  describe('isTaskRunning', () => {
    it('should return false initially', () => {
      expect(service.isTaskRunning()).toBe(false);
    });

    it('should return true while task is running', async () => {
      mockRecurringService.getDueRecurringInvoices.mockImplementation(
        () => new Promise(resolve => {
          setTimeout(() => resolve({ success: true, data: [] }), 50);
        })
      );

      const promise = service.generateDueRecurringInvoices();

      // Check that it's running
      expect(service.isTaskRunning()).toBe(true);

      await promise;

      // Check that it's no longer running
      expect(service.isTaskRunning()).toBe(false);
    });
  });
});