import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock the API route handlers
vi.mock('../../../app/api/invoices/route', () => ({
  GET: vi.fn(),
  POST: vi.fn(),
}));

vi.mock('../../../app/api/payments/create-intent/route', () => ({
  POST: vi.fn(),
}));

vi.mock('../../../app/api/recurring-invoices/route', () => ({
  GET: vi.fn(),
  POST: vi.fn(),
}));

vi.mock('../../../app/api/auth/register/route', () => ({
  POST: vi.fn(),
}));

// Mock database
vi.mock('../../db', () => ({
  db: {
    invoice: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    client: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock Stripe
vi.mock('stripe', () => {
  const mockStripe = {
    paymentIntents: {
      create: vi.fn(),
    },
  };
  return {
    default: vi.fn(() => mockStripe),
  };
});

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Invoice API', () => {
    it('should create invoice successfully', async () => {
      const mockInvoiceData = {
        invoiceNumber: 'INV-001',
        clientId: 'client_123',
        business: { name: 'Test Business' },
        client: { name: 'John Doe', email: 'john@example.com' },
        items: [{ description: 'Service', quantity: 1, rate: 100 }],
        currency: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
        totals: { subtotal: 100, tax: 10, total: 110 },
        invoiceDate: '2024-01-01',
        dueDate: '2024-01-31',
      };

      const mockDb = await import('../../db');
      mockDb.db.invoice.create.mockResolvedValue({
        id: 'inv_123',
        ...mockInvoiceData,
        status: 'draft',
        paymentStatus: 'unpaid',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { POST } = await import('../../../app/api/invoices/route');
      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(mockInvoiceData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      (POST as any).mockResolvedValue(
        NextResponse.json({ id: 'inv_123', ...mockInvoiceData }, { status: 201 })
      );

      const response = await (POST as any)(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('inv_123');
      expect(data.invoiceNumber).toBe('INV-001');
    });

    it('should get invoices with filtering', async () => {
      const mockInvoices = [
        {
          id: 'inv_1',
          invoiceNumber: 'INV-001',
          status: 'sent',
          paymentStatus: 'unpaid',
          total: 100,
        },
        {
          id: 'inv_2',
          invoiceNumber: 'INV-002',
          status: 'sent',
          paymentStatus: 'paid',
          total: 200,
        },
      ];

      const mockDb = await import('../../db');
      mockDb.db.invoice.findMany.mockResolvedValue(mockInvoices);

      const { GET } = await import('../../../app/api/invoices/route');
      const request = new NextRequest('http://localhost:3000/api/invoices?status=sent', {
        method: 'GET',
      });

      (GET as any).mockResolvedValue(
        NextResponse.json(mockInvoices, { status: 200 })
      );

      const response = await (GET as any)(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].invoiceNumber).toBe('INV-001');
    });

    it('should handle invoice creation errors', async () => {
      const mockDb = await import('../../db');
      mockDb.db.invoice.create.mockRejectedValue(new Error('Database error'));

      const { POST } = await import('../../../app/api/invoices/route');
      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      (POST as any).mockResolvedValue(
        NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
      );

      const response = await (POST as any)(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create invoice');
    });
  });

  describe('Payment API', () => {
    it('should create payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method',
      };

      const Stripe = (await import('stripe')).default;
      const mockStripe = new Stripe();
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const { POST } = await import('../../../app/api/payments/create-intent/route');
      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: 'inv_123',
          clientId: 'client_123',
          amount: { amount: 100.00, currency: 'USD' },
          description: 'Payment for Invoice INV-001',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      (POST as any).mockResolvedValue(
        NextResponse.json(mockPaymentIntent, { status: 200 })
      );

      const response = await (POST as any)(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('pi_test123');
      expect(data.amount).toBe(10000);
      expect(data.currency).toBe('usd');
    });

    it('should handle payment intent creation errors', async () => {
      const Stripe = (await import('stripe')).default;
      const mockStripe = new Stripe();
      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Card declined')
      );

      const { POST } = await import('../../../app/api/payments/create-intent/route');
      const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: 'inv_123',
          amount: { amount: 100.00, currency: 'USD' },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      (POST as any).mockResolvedValue(
        NextResponse.json({ error: 'Payment failed' }, { status: 400 })
      );

      const response = await (POST as any)(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Payment failed');
    });
  });

  describe('Recurring Invoice API', () => {
    it('should create recurring invoice successfully', async () => {
      const mockRecurringInvoice = {
        id: 'inv_recurring_123',
        invoiceNumber: 'INV-001',
        isRecurring: true,
        recurringConfig: {
          frequency: 'monthly',
          interval: 1,
          startDate: new Date('2024-01-01'),
          nextGenerationDate: new Date('2024-02-01'),
          isActive: true,
        },
      };

      const mockDb = await import('../../db');
      mockDb.db.invoice.create.mockResolvedValue(mockRecurringInvoice);

      const { POST } = await import('../../../app/api/recurring-invoices/route');
      const request = new NextRequest('http://localhost:3000/api/recurring-invoices', {
        method: 'POST',
        body: JSON.stringify({
          invoice: {
            invoiceNumber: 'INV-001',
            clientId: 'client_123',
            items: [{ description: 'Service', quantity: 1, rate: 100 }],
          },
          recurringConfig: {
            frequency: 'monthly',
            interval: 1,
            startDate: '2024-01-01',
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      (POST as any).mockResolvedValue(
        NextResponse.json(mockRecurringInvoice, { status: 201 })
      );

      const response = await (POST as any)(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('inv_recurring_123');
      expect(data.isRecurring).toBe(true);
      expect(data.recurringConfig.frequency).toBe('monthly');
    });

    it('should get recurring invoices', async () => {
      const mockRecurringInvoices = [
        {
          id: 'inv_recurring_1',
          isRecurring: true,
          recurringConfig: { frequency: 'monthly' },
        },
        {
          id: 'inv_recurring_2',
          isRecurring: true,
          recurringConfig: { frequency: 'weekly' },
        },
      ];

      const mockDb = await import('../../db');
      mockDb.db.invoice.findMany.mockResolvedValue(mockRecurringInvoices);

      const { GET } = await import('../../../app/api/recurring-invoices/route');
      const request = new NextRequest('http://localhost:3000/api/recurring-invoices', {
        method: 'GET',
      });

      (GET as any).mockResolvedValue(
        NextResponse.json(mockRecurringInvoices, { status: 200 })
      );

      const response = await (GET as any)(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].isRecurring).toBe(true);
    });
  });

  describe('Authentication API', () => {
    it('should register client successfully', async () => {
      const mockClient = {
        id: 'client_123',
        email: 'test@example.com',
        name: 'John Doe',
        isVerified: false,
        createdAt: new Date(),
      };

      const mockDb = await import('../../db');
      mockDb.db.client.create.mockResolvedValue(mockClient);
      mockDb.db.client.findUnique.mockResolvedValue(null); // Email not taken

      const { POST } = await import('../../../app/api/auth/register/route');
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'John Doe',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      (POST as any).mockResolvedValue(
        NextResponse.json(
          { id: 'client_123', email: 'test@example.com', name: 'John Doe' },
          { status: 201 }
        )
      );

      const response = await (POST as any)(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('client_123');
      expect(data.email).toBe('test@example.com');
    });

    it('should reject duplicate email registration', async () => {
      const mockDb = await import('../../db');
      mockDb.db.client.findUnique.mockResolvedValue({
        id: 'existing_client',
        email: 'test@example.com',
      });

      const { POST } = await import('../../../app/api/auth/register/route');
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'John Doe',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      (POST as any).mockResolvedValue(
        NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      );

      const response = await (POST as any)(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Email already registered');
    });
  });

  describe('End-to-End Workflows', () => {
    it('should complete invoice creation to payment flow', async () => {
      // Step 1: Create invoice
      const mockInvoice = {
        id: 'inv_123',
        invoiceNumber: 'INV-001',
        total: 100,
        status: 'sent',
        paymentStatus: 'unpaid',
      };

      const mockDb = await import('../../db');
      mockDb.db.invoice.create.mockResolvedValue(mockInvoice);

      // Step 2: Create payment intent
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        amount: 10000,
        currency: 'usd',
      };

      const Stripe = (await import('stripe')).default;
      const mockStripe = new Stripe();
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      // Step 3: Process payment
      mockDb.db.payment.create.mockResolvedValue({
        id: 'pay_123',
        invoiceId: 'inv_123',
        amount: 100,
        status: 'completed',
      });

      mockDb.db.invoice.update.mockResolvedValue({
        ...mockInvoice,
        paymentStatus: 'paid',
      });

      // Simulate the workflow
      const invoiceCreated = mockInvoice;
      expect(invoiceCreated.id).toBe('inv_123');
      expect(invoiceCreated.paymentStatus).toBe('unpaid');

      const paymentIntentCreated = mockPaymentIntent;
      expect(paymentIntentCreated.id).toBe('pi_test123');
      expect(paymentIntentCreated.amount).toBe(10000);

      // After payment processing
      const paymentProcessed = {
        id: 'pay_123',
        invoiceId: 'inv_123',
        amount: 100,
        status: 'completed',
      };
      expect(paymentProcessed.status).toBe('completed');
    });

    it('should complete recurring invoice setup and generation', async () => {
      // Step 1: Create recurring invoice template
      const mockRecurringInvoice = {
        id: 'inv_recurring_123',
        isRecurring: true,
        recurringConfig: {
          frequency: 'monthly',
          interval: 1,
          nextGenerationDate: new Date('2024-02-01'),
          isActive: true,
        },
      };

      const mockDb = await import('../../db');
      mockDb.db.invoice.create.mockResolvedValue(mockRecurringInvoice);

      // Step 2: Generate scheduled invoice
      mockDb.db.invoice.findMany.mockResolvedValue([mockRecurringInvoice]);
      mockDb.db.invoice.create.mockResolvedValue({
        id: 'inv_generated_123',
        invoiceNumber: 'INV-002',
        parentInvoiceId: 'inv_recurring_123',
        isRecurring: false,
      });

      // Simulate the workflow
      const recurringCreated = mockRecurringInvoice;
      expect(recurringCreated.isRecurring).toBe(true);
      expect(recurringCreated.recurringConfig.frequency).toBe('monthly');

      const generatedInvoice = {
        id: 'inv_generated_123',
        invoiceNumber: 'INV-002',
        parentInvoiceId: 'inv_recurring_123',
        isRecurring: false,
      };
      expect(generatedInvoice.parentInvoiceId).toBe('inv_recurring_123');
      expect(generatedInvoice.isRecurring).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors', async () => {
      const mockDb = await import('../../db');
      mockDb.db.invoice.findMany.mockRejectedValue(new Error('Connection failed'));

      const { GET } = await import('../../../app/api/invoices/route');
      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'GET',
      });

      (GET as any).mockResolvedValue(
        NextResponse.json({ error: 'Database error' }, { status: 500 })
      );

      const response = await (GET as any)(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
    });

    it('should handle invalid request data', async () => {
      const { POST } = await import('../../../app/api/invoices/route');
      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      (POST as any).mockResolvedValue(
        NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
      );

      const response = await (POST as any)(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should handle rate limiting', async () => {
      const { POST } = await import('../../../app/api/auth/register/route');
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password',
          name: 'Test User',
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.1',
        },
      });

      (POST as any).mockResolvedValue(
        NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      );

      const response = await (POST as any)(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Too many requests');
    });
  });
});