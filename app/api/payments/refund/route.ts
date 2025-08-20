import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '../../../../lib/services/PaymentService';
import { PaymentError } from '../../../../lib/config/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, amount, reason } = body;

    // Validate required fields
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing required field: paymentIntentId' },
        { status: 400 }
      );
    }

    // Process refund
    const result = await PaymentService.processRefund(paymentIntentId, amount, reason);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Refund processed successfully',
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
    console.error('Error processing refund:', error);

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