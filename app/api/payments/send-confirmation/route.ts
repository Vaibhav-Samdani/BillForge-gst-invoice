import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '../../../../lib/services/EmailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoice, payment, clientEmail } = body;

    // Validate required fields
    if (!invoice || !payment || !clientEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: invoice, payment, clientEmail' },
        { status: 400 }
      );
    }

    // Send payment confirmation email to client
    const clientEmailSent = await EmailService.sendPaymentConfirmation(
      invoice,
      payment,
      clientEmail
    );

    // Send payment notification to business owner
    const businessEmailSent = await EmailService.sendPaymentNotification(
      invoice,
      payment,
      invoice.business.email
    );

    return NextResponse.json({
      success: clientEmailSent && businessEmailSent,
      message: 'Confirmation emails sent successfully',
      clientEmailSent,
      businessEmailSent,
    });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return NextResponse.json(
      { error: 'Failed to send confirmation email' },
      { status: 500 }
    );
  }
}