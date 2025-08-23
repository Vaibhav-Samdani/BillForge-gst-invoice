import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '../../../../../lib/services/PaymentService';
import { PaymentError } from '../../../../../lib/config/stripe';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paymentIntentId = id;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Get payment intent status
    const paymentIntent = await PaymentService.getPaymentIntent(paymentIntentId);

    return NextResponse.json(paymentIntent);
  } catch (error) {
    console.error('Error retrieving payment status:', error);

    if (error instanceof PaymentError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          retryable: error.retryable,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}