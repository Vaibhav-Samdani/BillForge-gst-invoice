import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaymentService } from '../PaymentService';

// Mock Stripe configuration
const mockStripe = {
  paymentIntents: {
    create: vi.fn(),
    retrieve: vi.fn(),
    confirm: vi.fn(),
  },
  refunds: {
    create: vi.fn(),
  },
  errors: {
    StripeError: class extends Error {},
    StripeCardError: class extends Error {
      code: string;
      constructor(message: string, code: string) {
        super(message);
        this.code = code;
      }
    },
  },
};

// Mock the stripe config
vi.mock('../config/stripe', () => ({
  stripe: mockStripe,
  PaymentError: class extends Error {
    constructor(message: string, public code: string, public retryable: boolean) {
      super(message);
    }
  },
  PAYMENT_ERROR_CODES: {
    PAYMENT_DECLINED: 'PAYMENT_DECLINED',
    INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
    PAYMENT_PROCESSOR_ERROR: 'PAYMENT_PROCESSOR_ERROR',
    INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    INVOICE_NOT_FOUND: 'INVOICE_NOT_FOUND',
    INVOICE_ALREADY_PAID: 'INVOICE_ALREADY_PAID',
    REFUND_FAILED: 'REFUND_FAILED',
    CURRENCY_MISMATCH: 'CURRENCY_MISMATCH',
    RATE_LIMITED: 'RATE_LIMITED',
  },
}));

describe('PaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method',
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await PaymentService.createPaymentIntent({
        invoiceId: 'inv_123',
        clientId: 'client_123',
        amount: {
          amount: 100.00,
          currency: 'USD',
        },
        description: 'Payment for Invoice INV-001',
      });

      expect(result.id).toBe('pi_test123');
      expect(result.clientSecret).toBe('pi_test123_secret');
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 10000, // Amount in cents
        currency: 'usd',
        description: 'Payment for Invoice INV-001',
        metadata: {
          invoiceId: 'inv_123',
          clientId: 'client_123',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
    });

    it('should handle different currencies', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        amount: 8500,
        currency: 'eur',
        status: 'requires_payment_method',
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await PaymentService.createPaymentIntent({
        invoiceId: 'inv_123',
        clientId: 'client_123',
        amount: {
          amount: 85.00,
          currency: 'EUR',
        },
        description: 'Payment for Invoice INV-001',
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 8500,
          currency: 'eur',
        })
      );
    });

    it('should throw error when Stripe fails', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Card declined')
      );

      await expect(
        PaymentService.createPaymentIntent({
          invoiceId: 'inv_123',
          clientId: 'client_123',
          amount: { amount: 100.00, currency: 'USD' },
          description: 'Payment for Invoice INV-001',
        })
      ).rejects.toThrow();
    });
  });

  describe('getPaymentIntent', () => {
    it('should retrieve payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        amount: 10000,
        currency: 'usd',
        status: 'succeeded',
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const result = await PaymentService.getPaymentIntent('pi_test123');

      expect(result.id).toBe('pi_test123');
      expect(result.status).toBe('succeeded');
      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_test123');
    });

    it('should throw error for non-existent payment intent', async () => {
      mockStripe.paymentIntents.retrieve.mockRejectedValue(
        new Error('No such payment_intent')
      );

      await expect(
        PaymentService.getPaymentIntent('pi_invalid')
      ).rejects.toThrow();
    });
  });

  describe('processRefund', () => {
    it('should process full refund successfully', async () => {
      const mockRefund = {
        id: 're_test123',
        amount: 10000,
        currency: 'usd',
        status: 'succeeded',
        payment_intent: 'pi_test123',
      };

      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await PaymentService.processRefund('pi_test123');

      expect(result.success).toBe(true);
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test123',
        amount: undefined,
        reason: undefined,
      });
    });

    it('should process partial refund successfully', async () => {
      const mockRefund = {
        id: 're_test123',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        payment_intent: 'pi_test123',
      };

      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      await PaymentService.processRefund('pi_test123', 50.00, 'requested_by_customer');

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test123',
        amount: 5000,
        reason: 'requested_by_customer',
      });
    });

    it('should handle refund failure', async () => {
      mockStripe.refunds.create.mockRejectedValue(new Error('Refund failed'));

      const result = await PaymentService.processRefund('pi_test123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validatePaymentAmount', () => {
    it('should validate matching payment amount', () => {
      const mockInvoice = {
        currency: { code: 'USD' },
        totals: { total: 100.00 },
      } as any;

      const paymentAmount = {
        amount: 100.00,
        currency: 'USD',
      };

      const result = PaymentService.validatePaymentAmount(mockInvoice, paymentAmount);
      expect(result).toBe(true);
    });

    it('should reject mismatched currency', () => {
      const mockInvoice = {
        currency: { code: 'USD' },
        totals: { total: 100.00 },
      } as any;

      const paymentAmount = {
        amount: 100.00,
        currency: 'EUR',
      };

      const result = PaymentService.validatePaymentAmount(mockInvoice, paymentAmount);
      expect(result).toBe(false);
    });

    it('should reject mismatched amount', () => {
      const mockInvoice = {
        currency: { code: 'USD' },
        totals: { total: 100.00 },
      } as any;

      const paymentAmount = {
        amount: 150.00,
        currency: 'USD',
      };

      const result = PaymentService.validatePaymentAmount(mockInvoice, paymentAmount);
      expect(result).toBe(false);
    });

    it('should allow small rounding differences', () => {
      const mockInvoice = {
        currency: { code: 'USD' },
        totals: { total: 100.00 },
      } as any;

      const paymentAmount = {
        amount: 100.005, // Small rounding difference
        currency: 'USD',
      };

      const result = PaymentService.validatePaymentAmount(mockInvoice, paymentAmount);
      expect(result).toBe(true);
    });
  });

  describe('calculateProcessingFee', () => {
    it('should calculate standard processing fees for USD', () => {
      const fee = PaymentService.calculateProcessingFee(100.00, 'USD');
      expect(fee).toBe(3.20); // 2.9% + $0.30 = $2.90 + $0.30 = $3.20
    });

    it('should calculate fees for different currencies', () => {
      const fee = PaymentService.calculateProcessingFee(100.00, 'EUR');
      expect(fee).toBe(2.90); // 2.9% only, no fixed fee for non-USD
    });

    it('should handle minimum fees', () => {
      const fee = PaymentService.calculateProcessingFee(1.00, 'USD');
      expect(fee).toBe(0.33); // 2.9% of $1 + $0.30 = $0.029 + $0.30 = $0.329 rounded to $0.33
    });

    it('should handle zero amounts', () => {
      const fee = PaymentService.calculateProcessingFee(0, 'USD');
      expect(fee).toBe(0.30); // Just the fixed fee
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        metadata: {
          invoiceId: 'inv_123',
          clientId: 'client_123',
        },
        amount: 10000,
        currency: 'usd',
      };

      mockStripe.paymentIntents.confirm.mockResolvedValue(mockPaymentIntent);

      const result = await PaymentService.confirmPayment('pi_test123', 'pm_test123');

      expect(result.success).toBe(true);
      expect(result.payment).toBeDefined();
      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith('pi_test123', {
        payment_method: 'pm_test123',
      });
    });

    it('should handle failed payment confirmation', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'requires_payment_method',
        metadata: {
          invoiceId: 'inv_123',
          clientId: 'client_123',
        },
      };

      mockStripe.paymentIntents.confirm.mockResolvedValue(mockPaymentIntent);

      const result = await PaymentService.confirmPayment('pi_test123', 'pm_test123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});