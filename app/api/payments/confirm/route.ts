import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '../../../../lib/services/PaymentService';
import { PaymentError } from '../../../../lib/config/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, paymentMethodId } = body;

    // Validate required fields
    if (!paymentIntentId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentIntentId, paymentMethodId' },
        { status: 400 }
      );
    }

    // Confirm payment
    const result = await PaymentService.confirmPayment(paymentIntentId, paymentMethodId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        payment: result.payment,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error?.message,
          code: result.error?.code,
          retryable: result.error?.retryable,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error confirming payment:', error);

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