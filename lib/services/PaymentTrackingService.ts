import { Payment, EnhancedInvoice } from '../types';
import { PaymentService } from './PaymentService';
import { PaymentError, PAYMENT_ERROR_CODES } from '../config/stripe';

export interface PaymentStatusUpdate {
  paymentId: string;
  status: Payment['status'];
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Partial refund amount, if not provided, full refund
  reason: 'requested_by_customer' | 'duplicate' | 'fraudulent' | 'other';
  description?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  refundAmount?: number;
  error?: PaymentError;
  estimatedArrival?: Date;
}

export interface PaymentTrackingData {
  payment: Payment;
  statusHistory: PaymentStatusUpdate[];
  refundHistory: RefundRequest[];
  relatedInvoice?: EnhancedInvoice;
}

export class PaymentTrackingService {
  private static statusUpdateCallbacks: ((update: PaymentStatusUpdate) => void)[] = [];

  /**
   * Subscribe to payment status updates
   */
  static onStatusUpdate(callback: (update: PaymentStatusUpdate) => void): () => void {
    this.statusUpdateCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.statusUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusUpdateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of status update
   */
  private static notifyStatusUpdate(update: PaymentStatusUpdate): void {
    this.statusUpdateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in payment status update callback:', error);
      }
    });
  }

  /**
   * Track payment status changes
   */
  static async updatePaymentStatus(
    paymentId: string,
    newStatus: Payment['status'],
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Update payment status in database
      await this.updatePaymentInDatabase(paymentId, newStatus, metadata);

      // Create status update record
      const statusUpdate: PaymentStatusUpdate = {
        paymentId,
        status: newStatus,
        timestamp: new Date(),
        metadata,
      };

      // Store status update history
      await this.storeStatusUpdate(statusUpdate);

      // Notify subscribers
      this.notifyStatusUpdate(statusUpdate);

      // Handle status-specific actions
      await this.handleStatusChange(paymentId, newStatus, metadata);

    } catch (error) {
      console.error('Error updating payment status:', error);
      throw new PaymentError(
        'Failed to update payment status',
        PAYMENT_ERROR_CODES.PAYMENT_PROCESSOR_ERROR,
        true
      );
    }
  }

  /**
   * Process refund request
   */
  static async processRefund(request: RefundRequest): Promise<RefundResult> {
    try {
      // Validate refund request
      const validation = await this.validateRefundRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: new PaymentError(
            validation.error || 'Invalid refund request',
            PAYMENT_ERROR_CODES.INVALID_PAYMENT_METHOD,
            false
          ),
        };
      }

      // Get payment details
      const payment = await this.getPaymentById(request.paymentId);
      if (!payment) {
        return {
          success: false,
          error: new PaymentError(
            'Payment not found',
            PAYMENT_ERROR_CODES.PAYMENT_PROCESSOR_ERROR,
            false
          ),
        };
      }

      // Calculate refund amount
      const refundAmount = request.amount || payment.amount.amount;

      // Process refund through payment processor
      const refundResult = await PaymentService.processRefund(
        payment.transactionId,
        refundAmount,
        request.reason
      );

      if (refundResult.success) {
        // Update payment record with refund information
        await this.updatePaymentRefund(request.paymentId, refundAmount, new Date());

        // Update payment status
        await this.updatePaymentStatus(request.paymentId, 'refunded', {
          refundReason: request.reason,
          refundDescription: request.description,
          refundAmount,
        });

        // Store refund request history
        await this.storeRefundRequest(request);

        // Calculate estimated arrival date (typically 5-10 business days)
        const estimatedArrival = this.calculateRefundArrivalDate();

        return {
          success: true,
          refundAmount,
          estimatedArrival,
        };
      } else {
        return {
          success: false,
          error: refundResult.error,
        };
      }

    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: new PaymentError(
          'Failed to process refund',
          PAYMENT_ERROR_CODES.PAYMENT_PROCESSOR_ERROR,
          true
        ),
      };
    }
  }

  /**
   * Get payment tracking data
   */
  static async getPaymentTrackingData(paymentId: string): Promise<PaymentTrackingData | null> {
    try {
      const payment = await this.getPaymentById(paymentId);
      if (!payment) {
        return null;
      }

      const statusHistory = await this.getStatusHistory(paymentId);
      const refundHistory = await this.getRefundHistory(paymentId);
      const relatedInvoice = await this.getInvoiceById(payment.invoiceId);

      return {
        payment,
        statusHistory,
        refundHistory,
        relatedInvoice: relatedInvoice || undefined,
      };

    } catch (error) {
      console.error('Error getting payment tracking data:', error);
      return null;
    }
  }

  /**
   * Get payment status history
   */
  static async getStatusHistory(paymentId: string): Promise<PaymentStatusUpdate[]> {
    try {
      // In a real implementation, this would query the database
      // For now, return mock data
      return [
        {
          paymentId,
          status: 'pending',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        },
        {
          paymentId,
          status: 'completed',
          timestamp: new Date(),
        },
      ];
    } catch (error) {
      console.error('Error getting status history:', error);
      return [];
    }
  }

  /**
   * Check for payment status updates from external processor
   */
  static async syncPaymentStatuses(paymentIds: string[]): Promise<void> {
    try {
      for (const paymentId of paymentIds) {
        const payment = await this.getPaymentById(paymentId);
        if (!payment || payment.status === 'completed' || payment.status === 'failed') {
          continue; // Skip completed or failed payments
        }

        // Check status with payment processor
        const currentStatus = await this.checkPaymentProcessorStatus(payment.transactionId);

        if (currentStatus && currentStatus !== payment.status) {
          await this.updatePaymentStatus(paymentId, currentStatus);
        }
      }
    } catch (error) {
      console.error('Error syncing payment statuses:', error);
    }
  }

  /**
   * Validate refund request
   */
  private static async validateRefundRequest(request: RefundRequest): Promise<{
    isValid: boolean;
    error?: string;
  }> {
    const payment = await this.getPaymentById(request.paymentId);

    if (!payment) {
      return { isValid: false, error: 'Payment not found' };
    }

    if (payment.status !== 'completed') {
      return { isValid: false, error: 'Can only refund completed payments' };
    }

    if (payment.refundedAt) {
      return { isValid: false, error: 'Payment has already been refunded' };
    }

    if (request.amount && request.amount > payment.amount.amount) {
      return { isValid: false, error: 'Refund amount cannot exceed payment amount' };
    }

    if (request.amount && request.amount <= 0) {
      return { isValid: false, error: 'Refund amount must be greater than zero' };
    }

    // Check if payment is too old for refund (e.g., 180 days)
    const paymentAge = Date.now() - payment.processedAt.getTime();
    const maxRefundAge = 180 * 24 * 60 * 60 * 1000; // 180 days in milliseconds

    if (paymentAge > maxRefundAge) {
      return { isValid: false, error: 'Payment is too old for refund' };
    }

    return { isValid: true };
  }

  /**
   * Handle status-specific actions
   */
  private static async handleStatusChange(
    paymentId: string,
    newStatus: Payment['status'],
    metadata?: Record<string, any>
  ): Promise<void> {
    switch (newStatus) {
      case 'completed':
        await this.handlePaymentCompleted(paymentId, metadata);
        break;
      case 'failed':
        await this.handlePaymentFailed(paymentId, metadata);
        break;
      case 'refunded':
        await this.handlePaymentRefunded(paymentId, metadata);
        break;
    }
  }

  /**
   * Handle completed payment
   */
  private static async handlePaymentCompleted(
    paymentId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const payment = await this.getPaymentById(paymentId);
      if (!payment) return;

      // Update invoice status to paid
      await this.updateInvoiceStatus(payment.invoiceId, 'paid');

      // Send payment confirmation email
      await this.sendPaymentConfirmationEmail(payment);

      // Log successful payment
      console.log(`Payment ${paymentId} completed successfully`);

    } catch (error) {
      console.error('Error handling completed payment:', error);
    }
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailed(
    paymentId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const payment = await this.getPaymentById(paymentId);
      if (!payment) return;

      // Send payment failure notification
      await this.sendPaymentFailureEmail(payment, metadata?.failureReason);

      // Log failed payment
      console.log(`Payment ${paymentId} failed:`, metadata?.failureReason);

    } catch (error) {
      console.error('Error handling failed payment:', error);
    }
  }

  /**
   * Handle refunded payment
   */
  private static async handlePaymentRefunded(
    paymentId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const payment = await this.getPaymentById(paymentId);
      if (!payment) return;

      // Update invoice status if fully refunded
      if (metadata?.refundAmount === payment.amount.amount) {
        await this.updateInvoiceStatus(payment.invoiceId, 'unpaid');
      }

      // Send refund confirmation email
      await this.sendRefundConfirmationEmail(payment, metadata);

      // Log refund
      console.log(`Payment ${paymentId} refunded:`, metadata);

    } catch (error) {
      console.error('Error handling refunded payment:', error);
    }
  }

  /**
   * Calculate estimated refund arrival date
   */
  private static calculateRefundArrivalDate(): Date {
    const now = new Date();
    const businessDays = 7; // Typical 5-10 business days, using 7 as average

    // Add business days (excluding weekends)
    let daysAdded = 0;
    const result = new Date(now);

    while (daysAdded < businessDays) {
      result.setDate(result.getDate() + 1);

      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        daysAdded++;
      }
    }

    return result;
  }

  // Mock database operations (in real implementation, these would interact with actual database)
  private static async getPaymentById(paymentId: string): Promise<Payment | null> {
    // Mock implementation - in real app, query database
    return null;
  }

  private static async getInvoiceById(invoiceId: string): Promise<EnhancedInvoice | null> {
    // Mock implementation - in real app, query database
    return null;
  }

  private static async updatePaymentInDatabase(
    paymentId: string,
    status: Payment['status'],
    metadata?: Record<string, any>
  ): Promise<void> {
    // Mock implementation - in real app, update database
  }

  private static async updatePaymentRefund(
    paymentId: string,
    refundAmount: number,
    refundedAt: Date
  ): Promise<void> {
    // Mock implementation - in real app, update database
  }

  private static async updateInvoiceStatus(
    invoiceId: string,
    status: EnhancedInvoice['paymentStatus']
  ): Promise<void> {
    // Mock implementation - in real app, update database
  }

  private static async storeStatusUpdate(update: PaymentStatusUpdate): Promise<void> {
    // Mock implementation - in real app, store in database
  }

  private static async storeRefundRequest(request: RefundRequest): Promise<void> {
    // Mock implementation - in real app, store in database
  }

  private static async getRefundHistory(paymentId: string): Promise<RefundRequest[]> {
    // Mock implementation - in real app, query database
    return [];
  }

  private static async checkPaymentProcessorStatus(transactionId: string): Promise<Payment['status'] | null> {
    // Mock implementation - in real app, check with payment processor
    return null;
  }

  private static async sendPaymentConfirmationEmail(payment: Payment): Promise<void> {
    // Mock implementation - in real app, send email
  }

  private static async sendPaymentFailureEmail(payment: Payment, reason?: string): Promise<void> {
    // Mock implementation - in real app, send email
  }

  private static async sendRefundConfirmationEmail(payment: Payment, metadata?: Record<string, any>): Promise<void> {
    // Mock implementation - in real app, send email
  }
}