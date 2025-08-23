import { NextRequest, NextResponse } from 'next/server';
import { PaymentTrackingService, RefundRequest } from '../../../../../lib/services/PaymentTrackingService';

/**
 * POST /api/payments/[paymentId]/refund
 * Process a refund request for a payment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    const body = await request.json();

    // Validate refund request
    const requiredFields = ['reason'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate refund reason
    const validReasons = ['requested_by_customer', 'duplicate', 'fraudulent', 'other'];
    if (!validReasons.includes(body.reason)) {
      return NextResponse.json(
        { error: 'Invalid refund reason' },
        { status: 400 }
      );
    }

    // Validate refund amount if provided
    if (body.amount && (typeof body.amount !== 'number' || body.amount <= 0)) {
      return NextResponse.json(
        { error: 'Invalid refund amount' },
        { status: 400 }
      );
    }

    // Create refund request
    const refundRequest: RefundRequest = {
      paymentId,
      amount: body.amount,
      reason: body.reason,
      description: body.description,
    };

    // Process the refund
    const result = await PaymentTrackingService.processRefund(refundRequest);

    if (result.success) {
      return NextResponse.json({
        success: true,
        refundId: result.refundId,
        refundAmount: result.refundAmount,
        estimatedArrival: result.estimatedArrival,
        message: 'Refund processed successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error?.message || 'Refund processing failed',
          code: result.error?.code,
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while processing refund',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/[paymentId]/refund
 * Get refund history for a payment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    // Get payment tracking data which includes refund history
    const trackingData = await PaymentTrackingService.getPaymentTrackingData(paymentId);

    if (!trackingData) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      paymentId,
      refundHistory: trackingData.refundHistory,
      currentRefundAmount: trackingData.payment.refundAmount || 0,
      refundedAt: trackingData.payment.refundedAt,
    });

  } catch (error) {
    console.error('Error fetching refund history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refund history' },
      { status: 500 }
    );
  }
}