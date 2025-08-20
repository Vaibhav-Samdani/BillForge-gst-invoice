import { NextRequest, NextResponse } from 'next/server';
import { PaymentTrackingService } from '../../../../../lib/services/PaymentTrackingService';

/**
 * GET /api/payments/[paymentId]/receipt
 * Download payment receipt as PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;

    // Get payment and invoice data
    const trackingData = await PaymentTrackingService.getPaymentTrackingData(paymentId);

    if (!trackingData) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const { payment, relatedInvoice } = trackingData;

    // Verify payment is completed
    if (payment.status !== 'completed' && payment.status !== 'refunded') {
      return NextResponse.json(
        { error: 'Receipt not available for pending or failed payments' },
        { status: 400 }
      );
    }

    // In a real implementation, you would generate the PDF here
    // For now, we'll return a mock response
    const receiptData = {
      paymentId: payment.id,
      transactionId: payment.transactionId,
      amount: payment.amount,
      status: payment.status,
      processedAt: payment.processedAt,
      paymentMethod: payment.paymentMethod,
      invoice: relatedInvoice ? {
        invoiceNumber: relatedInvoice.invoiceNumber,
        invoiceDate: relatedInvoice.invoiceDate,
        dueDate: relatedInvoice.dueDate,
        totals: relatedInvoice.totals,
        client: relatedInvoice.client,
        business: relatedInvoice.business,
      } : null,
      refund: payment.refundAmount ? {
        amount: payment.refundAmount,
        refundedAt: payment.refundedAt,
      } : null,
    };

    // Set headers for PDF download
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="receipt-${payment.transactionId}.pdf"`);

    // In a real implementation, you would generate and return the actual PDF
    // For now, return JSON data with appropriate headers
    return new NextResponse(JSON.stringify(receiptData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Receipt-Data': 'true', // Custom header to indicate this is receipt data
      },
    });

  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments/[paymentId]/receipt
 * Email payment receipt to client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;
    const body = await request.json();

    // Get payment and invoice data
    const trackingData = await PaymentTrackingService.getPaymentTrackingData(paymentId);

    if (!trackingData) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const { payment, relatedInvoice } = trackingData;

    // Verify payment is completed
    if (payment.status !== 'completed' && payment.status !== 'refunded') {
      return NextResponse.json(
        { error: 'Receipt not available for pending or failed payments' },
        { status: 400 }
      );
    }

    // Get recipient email (from request body or invoice client email)
    const recipientEmail = body.email || relatedInvoice?.client.email;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Generate the PDF receipt
    // 2. Send email with PDF attachment
    // 3. Log the email sending activity

    // Mock email sending
    const emailData = {
      to: recipientEmail,
      subject: `Payment Receipt - ${payment.transactionId}`,
      template: 'payment-receipt',
      data: {
        payment,
        invoice: relatedInvoice,
        receiptUrl: `${request.nextUrl.origin}/api/payments/${paymentId}/receipt`,
      },
    };

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: 'Receipt sent successfully',
      sentTo: recipientEmail,
      sentAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error sending receipt:', error);
    return NextResponse.json(
      { error: 'Failed to send receipt' },
      { status: 500 }
    );
  }
}