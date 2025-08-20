import { stripe, PaymentError, PAYMENT_ERROR_CODES } from '../config/stripe';
import { Payment, CurrencyAmount, EnhancedInvoice } from '../types';
import Stripe from 'stripe';

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentResult {
  success: boolean;
  payment?: Payment;
  error?: PaymentError;
  paymentIntent?: PaymentIntent;
}

export interface CreatePaymentIntentParams {
  invoiceId: string;
  clientId: string;
  amount: CurrencyAmount;
  description?: string;
  metadata?: Record<string, string>;
}

export class PaymentService {
  calculateFees(arg0: number, arg1: string, arg2: string) {
    throw new Error('Method not implemented.');
  }
  /**
   * Create a payment intent for an invoice
   */
  static async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    try {
      const { invoiceId, clientId, amount, description, metadata } = params;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount.amount * 100), // Convert to cents
        currency: amount.currency.toLowerCase(),
        description: description || `Payment for Invoice ${invoiceId}`,
        metadata: {
          invoiceId,
          clientId,
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);

      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentError(
          error.message,
          PAYMENT_ERROR_CODES.PAYMENT_PROCESSOR_ERROR,
          true
        );
      }

      throw new PaymentError(
        'Failed to create payment intent',
        PAYMENT_ERROR_CODES.PAYMENT_PROCESSOR_ERROR,
        true
      );
    }
  }

  /**
   * Confirm a payment intent
   */
  static async confirmPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentResult> {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      if (paymentIntent.status === 'succeeded') {
        const payment = await this.createPaymentRecord(paymentIntent);
        return {
          success: true,
          payment,
        };
      } else {
        return {
          success: false,
          error: new PaymentError(
            'Payment confirmation failed',
            PAYMENT_ERROR_CODES.PAYMENT_DECLINED,
            true
          ),
        };
      }
    } catch (error) {
      console.error('Error confirming payment:', error);

      if (error instanceof Stripe.errors.StripeCardError) {
        return {
          success: false,
          error: new PaymentError(
            error.message,
            error.code === 'insufficient_funds'
              ? PAYMENT_ERROR_CODES.INSUFFICIENT_FUNDS
              : PAYMENT_ERROR_CODES.PAYMENT_DECLINED,
            false
          ),
        };
      }

      return {
        success: false,
        error: new PaymentError(
          'Payment processing failed',
          PAYMENT_ERROR_CODES.PAYMENT_PROCESSOR_ERROR,
          true
        ),
      };
    }
  }

  /**
   * Retrieve payment intent status
   */
  static async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw new PaymentError(
        'Failed to retrieve payment status',
        PAYMENT_ERROR_CODES.PAYMENT_PROCESSOR_ERROR,
        true
      );
    }
  }

  /**
   * Process a refund
   */
  static async processRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<PaymentResult> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason as Stripe.RefundCreateParams.Reason,
      });

      if (refund.status === 'succeeded') {
        // Update payment record with refund information
        // This would typically update the database
        return {
          success: true,
        };
      } else {
        return {
          success: false,
          error: new PaymentError(
            'Refund processing failed',
            PAYMENT_ERROR_CODES.PAYMENT_PROCESSOR_ERROR,
            true
          ),
        };
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: new PaymentError(
          'Refund failed',
          PAYMENT_ERROR_CODES.PAYMENT_PROCESSOR_ERROR,
          true
        ),
      };
    }
  }

  /**
   * Create a payment record from Stripe payment intent
   */
  private static async createPaymentRecord(paymentIntent: Stripe.PaymentIntent): Promise<Payment> {
    const metadata = paymentIntent.metadata;

    return {
      id: crypto.randomUUID(),
      invoiceId: metadata.invoiceId,
      clientId: metadata.clientId,
      amount: {
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
      },
      paymentMethod: 'card', // Default to card for Stripe payments
      transactionId: paymentIntent.id,
      status: 'completed',
      processedAt: new Date(),
    };
  }

  /**
   * Validate payment amount against invoice
   */
  static validatePaymentAmount(invoice: EnhancedInvoice, paymentAmount: CurrencyAmount): boolean {
    // Check if currencies match
    if (invoice.currency.code !== paymentAmount.currency) {
      return false;
    }

    // Check if amount matches invoice total (allowing for small rounding differences)
    const difference = Math.abs(invoice.totals.total - paymentAmount.amount);
    return difference < 0.01; // Allow 1 cent difference for rounding
  }

  /**
   * Calculate payment processing fee
   */
  static calculateProcessingFee(amount: number, currency: string): number {
    // Stripe's standard pricing: 2.9% + 30¢ for US cards
    const percentageFee = amount * 0.029;
    const fixedFee = currency.toLowerCase() === 'usd' ? 0.30 : 0;

    return Math.round((percentageFee + fixedFee) * 100) / 100;
  }
}