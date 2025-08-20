import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '../../../../lib/services/EmailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoice, payment, clientEmail, receiptPdf } = body;

    // Validate required fields
    if (!invoice || !payment || !clientEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: invoice, payment, clientEmail' },
        { status: 400 }
      );
    }

    // Convert base64 PDF to buffer if provided
    let pdfBuffer: Buffer | undefined;
    if (receiptPdf) {
      try {
        pdfBuffer = Buffer.from(receiptPdf, 'base64');
      } catch (error) {
        console.error('Error converting PDF:', error);
        // Continue without PDF attachment
      }
    }

    // Send payment receipt email
    const emailSent = await EmailService.sendPaymentReceipt(
      invoice,
      payment,
      clientEmail,
      pdfBuffer
    );

    return NextResponse.json({
      success: emailSent,
      message: emailSent ? 'Receipt email sent successfully' : 'Failed to send receipt email',
      emailSent,
    });
  } catch (error) {
    console.error('Error sending receipt email:', error);
    return NextResponse.json(
      { error: 'Failed to send receipt email' },
      { status: 500 }
    );
  }
}