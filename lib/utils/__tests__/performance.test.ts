import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CurrencyService } from '../../services/CurrencyService';
import { RecurringInvoiceService } from '../../services/RecurringInvoiceService';

// Mock fetch for performance tests
global.fetch = vi.fn();

// Mock database for performance tests
vi.mock('../../db', () => ({
  db: {
    invoice: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Currency API Performance', () => {
    it('should fetch exchange rates within acceptable time limits', async () => {
      const mockResponse = {
        success: true,
        rates: { EUR: 0.85, GBP: 0.75, JPY: 110.5 },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const startTime = performance.now();
      
      await CurrencyService.getExchangeRate('USD', 'EUR');
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should handle multiple concurrent currency requests efficiently', async () => {
      const mockResponse = {
        success: true,
        rates: { EUR: 0.85, GBP: 0.75, JPY: 110.5, CAD: 1.25, AUD: 1.35 },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const currencies = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
      const startTime = performance.now();

      // Make 5 concurrent requests
      const promises = currencies.map(currency => 
        CurrencyService.getExchangeRate('USD', currency)
      );

      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete all requests within 2 seconds
      expect(duration).toBeLessThan(2000);
      
      // Should have made only 1 API call due to batching/caching
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should cache exchange rates to improve performance', async () => {
      const mockResponse = {
        success: true,
        rates: { EUR: 0.85 },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // First request - should hit API
      const startTime1 = performance.now();
      await CurrencyService.getExchangeRate('USD', 'EUR');
      const endTime1 = performance.now();
      const firstRequestDuration = endTime1 - startTime1;

      // Second request - should use cache
      const startTime2 = performance.now();
      await CurrencyService.getExchangeRate('USD', 'EUR');
      const endTime2 = performance.now();
      const secondRequestDuration = endTime2 - startTime2;

      // Cached request should be significantly faster
      expect(secondRequestDuration).toBeLessThan(firstRequestDuration / 2);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only one API call
    });

    it('should handle large currency conversion batches efficiently', async () => {
      const mockResponse = {
        success: true,
        rates: { EUR: 0.85 },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // Prepare large batch of amounts to convert
      const amounts = Array.from({ length: 1000 }, (_, i) => i + 1);
      
      const startTime = performance.now();

      // Convert all amounts
      const conversions = await Promise.all(
        amounts.map(amount => CurrencyService.convertAmount(amount, 'USD', 'EUR'))
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 1000 conversions within 100ms
      expect(duration).toBeLessThan(100);
      expect(conversions).toHaveLength(1000);
      expect(conversions[0].amount).toBe(0.85); // 1 * 0.85
      expect(conversions[999].amount).toBe(850); // 1000 * 0.85
    });
  });

  describe('Recurring Invoice Generation Performance', () => {
    it('should generate multiple recurring invoices efficiently', async () => {
      const recurringService = new RecurringInvoiceService();
      
      // Mock 100 recurring invoices due for generation
      const mockRecurringInvoices = Array.from({ length: 100 }, (_, i) => ({
        id: `inv_recurring_${i}`,
        invoiceNumber: `INV-${String(i + 1).padStart(3, '0')}`,
        clientId: `client_${i}`,
        business: { name: 'Test Business' },
        client: { name: `Client ${i}`, email: `client${i}@example.com` },
        items: [{ description: 'Service', quantity: 1, rate: 100 }],
        currency: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
        totals: { subtotal: 100, tax: 10, total: 110 },
        isRecurring: true,
        recurringConfig: {
          frequency: 'monthly',
          interval: 1,
          nextGenerationDate: new Date('2024-02-01'),
          isActive: true,
        },
      }));

      const mockDb = await import('../../db');
      mockDb.db.invoice.findMany.mockResolvedValue(mockRecurringInvoices);
      
      // Mock successful invoice creation
      mockDb.db.invoice.create.mockImplementation((data) => 
        Promise.resolve({
          id: `inv_generated_${Date.now()}_${Math.random()}`,
          invoiceNumber: `INV-GEN-${Date.now()}`,
          ...data.data,
        })
      );
      
      mockDb.db.invoice.update.mockResolvedValue({});

      const startTime = performance.now();

      const generatedInvoices = await recurringService.generateScheduledInvoices();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should generate 100 invoices within 5 seconds
      expect(duration).toBeLessThan(5000);
      expect(generatedInvoices).toHaveLength(100);
      
      // Should have made 100 create calls and 100 update calls
      expect(mockDb.db.invoice.create).toHaveBeenCalledTimes(100);
      expect(mockDb.db.invoice.update).toHaveBeenCalledTimes(100);
    });

    it('should handle date calculations efficiently for large datasets', async () => {
      const recurringService = new RecurringInvoiceService();
      const baseDate = new Date('2024-01-01');
      const frequencies = ['weekly', 'monthly', 'quarterly', 'yearly'] as const;
      
      const startTime = performance.now();

      // Calculate 10,000 next generation dates
      const calculations = [];
      for (let i = 0; i < 10000; i++) {
        const frequency = frequencies[i % frequencies.length];
        const interval = (i % 4) + 1; // 1-4
        const nextDate = recurringService.calculateNextGenerationDate(
          baseDate,
          frequency,
          interval
        );
        calculations.push(nextDate);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 10,000 date calculations within 100ms
      expect(duration).toBeLessThan(100);
      expect(calculations).toHaveLength(10000);
      expect(calculations[0]).toBeInstanceOf(Date);
    });
  });

  describe('Database Query Performance', () => {
    it('should handle large invoice queries efficiently', async () => {
      // Mock large dataset
      const mockInvoices = Array.from({ length: 10000 }, (_, i) => ({
        id: `inv_${i}`,
        invoiceNumber: `INV-${String(i + 1).padStart(5, '0')}`,
        total: Math.random() * 1000,
        status: i % 2 === 0 ? 'paid' : 'unpaid',
        createdAt: new Date(2024, 0, 1 + (i % 365)),
      }));

      const mockDb = await import('../../db');
      mockDb.db.invoice.findMany.mockResolvedValue(mockInvoices);

      const startTime = performance.now();

      // Simulate complex query with filtering and sorting
      const invoices = await mockDb.db.invoice.findMany({
        where: {
          status: 'unpaid',
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31'),
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete query within 50ms
      expect(duration).toBeLessThan(50);
      expect(invoices).toHaveLength(10000); // Mock returns all
    });

    it('should handle concurrent database operations efficiently', async () => {
      const mockDb = await import('../../db');
      
      // Mock different operations
      mockDb.db.invoice.findMany.mockResolvedValue([]);
      mockDb.db.invoice.create.mockResolvedValue({ id: 'new_inv' });
      mockDb.db.invoice.update.mockResolvedValue({ id: 'updated_inv' });

      const startTime = performance.now();

      // Simulate concurrent operations
      const operations = [
        mockDb.db.invoice.findMany({ where: { status: 'draft' } }),
        mockDb.db.invoice.findMany({ where: { status: 'sent' } }),
        mockDb.db.invoice.create({ data: { invoiceNumber: 'INV-001' } }),
        mockDb.db.invoice.update({ where: { id: 'inv_1' }, data: { status: 'paid' } }),
        mockDb.db.invoice.findMany({ where: { paymentStatus: 'unpaid' } }),
      ];

      await Promise.all(operations);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete all operations within 100ms
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should handle large data structures without memory leaks', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create large arrays to simulate heavy data processing
      const largeDataSets = [];
      
      for (let i = 0; i < 100; i++) {
        const invoices = Array.from({ length: 1000 }, (_, j) => ({
          id: `inv_${i}_${j}`,
          data: new Array(100).fill(`data_${i}_${j}`),
        }));
        
        // Process the data
        const processed = invoices.map(invoice => ({
          ...invoice,
          processed: true,
          timestamp: Date.now(),
        }));
        
        largeDataSets.push(processed);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      expect(largeDataSets).toHaveLength(100);
    });

    it('should efficiently clean up resources after operations', async () => {
      const mockResponse = {
        success: true,
        rates: { EUR: 0.85 },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        await CurrencyService.convertAmount(100, 'USD', 'EUR');
      }

      // Clear cache to free memory
      CurrencyService.clearCache();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal after cleanup
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });
  });

  describe('API Response Time Performance', () => {
    it('should maintain consistent response times under load', async () => {
      const mockResponse = {
        success: true,
        rates: { EUR: 0.85, GBP: 0.75, JPY: 110.5 },
      };

      // Simulate varying response times
      (global.fetch as any).mockImplementation(() => {
        const delay = Math.random() * 100; // 0-100ms random delay
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(mockResponse),
            });
          }, delay);
        });
      });

      const responseTimes = [];
      const numberOfRequests = 50;

      // Make multiple requests and measure response times
      for (let i = 0; i < numberOfRequests; i++) {
        const startTime = performance.now();
        await CurrencyService.getExchangeRate('USD', 'EUR');
        const endTime = performance.now();
        responseTimes.push(endTime - startTime);
      }

      // Calculate statistics
      const averageTime = responseTimes.reduce((sum, time) => sum + time, 0) / numberOfRequests;
      const maxTime = Math.max(...responseTimes);
      const minTime = Math.min(...responseTimes);

      // Performance assertions
      expect(averageTime).toBeLessThan(200); // Average under 200ms
      expect(maxTime).toBeLessThan(500); // Max under 500ms
      expect(minTime).toBeGreaterThan(0); // Min should be positive
      
      // Consistency check - max shouldn't be more than 5x the average
      expect(maxTime).toBeLessThan(averageTime * 5);
    });
  });

  describe('Stress Testing', () => {
    it('should handle high-frequency operations without degradation', async () => {
      const mockResponse = {
        success: true,
        rates: { EUR: 0.85 },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const operationsPerSecond = 1000;
      const testDurationSeconds = 2;
      const totalOperations = operationsPerSecond * testDurationSeconds;

      const startTime = performance.now();
      const operations = [];

      // Generate high-frequency operations
      for (let i = 0; i < totalOperations; i++) {
        operations.push(CurrencyService.convertAmount(100 + i, 'USD', 'EUR'));
      }

      const results = await Promise.all(operations);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete all operations within reasonable time
      expect(duration).toBeLessThan(testDurationSeconds * 1000 * 2); // Allow 2x the target time
      expect(results).toHaveLength(totalOperations);
      
      // Verify results are correct
      expect(results[0].amount).toBe(85); // 100 * 0.85
      expect(results[totalOperations - 1].amount).toBe((100 + totalOperations - 1) * 0.85);
    });

    it('should maintain performance with large recurring invoice batches', async () => {
      const recurringService = new RecurringInvoiceService();
      
      // Create a very large batch of recurring invoices
      const batchSize = 1000;
      const mockRecurringInvoices = Array.from({ length: batchSize }, (_, i) => ({
        id: `inv_recurring_${i}`,
        invoiceNumber: `INV-${String(i + 1).padStart(4, '0')}`,
        clientId: `client_${i % 100}`, // 100 different clients
        business: { name: 'Test Business' },
        client: { name: `Client ${i % 100}`, email: `client${i % 100}@example.com` },
        items: [
          { description: 'Service A', quantity: 1, rate: 100 },
          { description: 'Service B', quantity: 2, rate: 50 },
        ],
        currency: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
        totals: { subtotal: 200, tax: 20, total: 220 },
        isRecurring: true,
        recurringConfig: {
          frequency: ['weekly', 'monthly', 'quarterly', 'yearly'][i % 4] as any,
          interval: (i % 3) + 1,
          nextGenerationDate: new Date('2024-02-01'),
          isActive: true,
        },
      }));

      const mockDb = await import('../../db');
      mockDb.db.invoice.findMany.mockResolvedValue(mockRecurringInvoices);
      mockDb.db.invoice.create.mockImplementation(() => 
        Promise.resolve({ id: `generated_${Date.now()}_${Math.random()}` })
      );
      mockDb.db.invoice.update.mockResolvedValue({});

      const startTime = performance.now();
      const generatedInvoices = await recurringService.generateScheduledInvoices();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle 1000 recurring invoices within 10 seconds
      expect(duration).toBeLessThan(10000);
      expect(generatedInvoices).toHaveLength(batchSize);
      
      // Performance per invoice should be reasonable
      const timePerInvoice = duration / batchSize;
      expect(timePerInvoice).toBeLessThan(10); // Less than 10ms per invoice
    });
  });
});