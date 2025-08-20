import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const body = await request.json();
    const { paymentIntentId, status, payment } = body;

    // Validate required fields
    if (!paymentIntentId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: paymentIntentId, status' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['paid', 'partial', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: paid, partial, failed' },
        { status: 400 }
      );
    }

    // TODO: In a real implementation, this would:
    // 1. Update the invoice status in the database
    // 2. Create a payment record in the database
    // 3. Update any related recurring invoice schedules
    // 4. Log the payment for audit purposes

    // For now, we'll simulate the database update
    console.log('Updating invoice payment status:', {
      invoiceId,
      paymentIntentId,
      status,
      payment: payment ? {
        transactionId: payment.transactionId,
        amount: payment.amount,
      } : null,
    });

    // Simulate database operation delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Invoice ${invoiceId} status updated to ${status}`,
      invoiceId,
      status,
      paymentIntentId,
      updatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error updating invoice payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice payment status' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;

    // TODO: In a real implementation, this would fetch the invoice from the database
    // For now, we'll return a mock invoice
    const mockInvoice = {
      id: invoiceId,
      invoiceNumber: 'INV-2024-001',
      status: 'sent',
      paymentStatus: 'unpaid',
      currency: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
      totals: {
        subtotal: 90.00,
        cgst: 5.00,
        sgst: 5.00,
        igst: 0.00,
        round_off: 0.00,
        total: 100.00,
      },
      client: {
        name: 'Test Client',
        email: 'client@example.com',
        company: 'Test Company',
        address: '123 Test St',
        gstin: 'TEST123456789',
        phone: '+1-555-123-4567',
      },
      business: {
        name: 'Test Business',
        email: 'business@example.com',
        company: 'Test Business Inc',
        address: '456 Business Ave',
        gstin: 'BUS123456789',
        phone: '+1-555-987-6543',
      },
      items: [
        {
          id: '1',
          description: 'Test Service',
          hsnSac: '998311',
          quantity: 1,
          rate: 90.00,
          per: 'unit',
          amount: 90.00,
          gst: 10,
        },
      ],
      invoiceDate: '2024-01-15',
      dueDate: new Date('2024-02-15').toISOString(),
      sameGst: true,
      globalGst: 10,
      isRecurring: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientId: 'client_test_123',
    };

    return NextResponse.json(mockInvoice);

  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}