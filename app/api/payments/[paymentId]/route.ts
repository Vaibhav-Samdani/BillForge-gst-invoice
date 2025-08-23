import { NextRequest, NextResponse } from 'next/server';
import { Payment } from '../../../../lib/types';
import { PaymentTrackingService } from '../../../../lib/services/PaymentTrackingService';

/**
 * GET /api/payments/[paymentId]
 * Retrieve detailed payment information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    // Get payment tracking data
    const trackingData = await PaymentTrackingService.getPaymentTrackingData(paymentId);

    if (!trackingData) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(trackingData);

  } catch (error) {
    console.error('Error fetching payment details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment details' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/payments/[paymentId]
 * Update payment status or information
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    const body = await request.json();

    // Validate the update request
    const allowedUpdates = ['status', 'refundAmount', 'refundedAt'];
    const updates = Object.keys(body);
    const isValidUpdate = updates.every(update => allowedUpdates.includes(update));

    if (!isValidUpdate) {
      return NextResponse.json(
        { error: 'Invalid update fields' },
        { status: 400 }
      );
    }

    // Update payment status if provided
    if (body.status) {
      await PaymentTrackingService.updatePaymentStatus(
        paymentId,
        body.status,
        body.metadata
      );
    }

    // Get updated payment data
    const updatedTrackingData = await PaymentTrackingService.getPaymentTrackingData(paymentId);

    return NextResponse.json(updatedTrackingData);

  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}