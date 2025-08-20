import { NextRequest, NextResponse } from 'next/server';
import { Payment } from '../../../../../lib/types';

// Mock payment data - in a real app, this would come from a database
const mockPayments: Payment[] = [
  {
    id: 'payment-1',
    invoiceId: 'invoice-1',
    clientId: 'client-1',
    amount: {
      amount: 150.00,
      currency: 'USD',
    },
    paymentMethod: 'card',
    transactionId: 'pi_1234567890abcdef',
    status: 'completed',
    processedAt: new Date('2024-01-15T10:30:00Z'),
  },
  {
    id: 'payment-2',
    invoiceId: 'invoice-2',
    clientId: 'client-1',
    amount: {
      amount: 100.00,
      currency: 'USD',
    },
    paymentMethod: 'paypal',
    transactionId: 'PAYID-1234567890',
    status: 'refunded',
    processedAt: new Date('2024-01-10T14:20:00Z'),
    refundAmount: 100.00,
    refundedAt: new Date('2024-01-12T09:15:00Z'),
  },
  {
    id: 'payment-3',
    invoiceId: 'invoice-3',
    clientId: 'client-1',
    amount: {
      amount: 75.50,
      currency: 'USD',
    },
    paymentMethod: 'bank_transfer',
    transactionId: 'ACH_1234567890',
    status: 'pending',
    processedAt: new Date('2024-01-20T16:45:00Z'),
  },
];

/**
 * GET /api/clients/[clientId]/payments
 * Retrieve payment history for a specific client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Filter payments by client ID
    let payments = mockPayments.filter(payment => payment.clientId === clientId);

    // Apply filters
    if (status) {
      const statusFilters = status.split(',');
      payments = payments.filter(payment => statusFilters.includes(payment.status));
    }

    if (paymentMethod) {
      const methodFilters = paymentMethod.split(',');
      payments = payments.filter(payment => methodFilters.includes(payment.paymentMethod));
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      payments = payments.filter(payment => {
        const paymentDate = new Date(payment.processedAt);
        return paymentDate >= start && paymentDate <= end;
      });
    }

    // Sort by processed date (newest first)
    payments.sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime());

    // Apply pagination
    const total = payments.length;
    const paginatedPayments = payments.slice(offset, offset + limit);

    // Calculate summary statistics
    const summary = {
      total: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + payment.amount.amount, 0),
      completedCount: payments.filter(p => p.status === 'completed').length,
      completedAmount: payments
        .filter(p => p.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount.amount, 0),
      pendingCount: payments.filter(p => p.status === 'pending').length,
      refundedCount: payments.filter(p => p.status === 'refunded').length,
      refundedAmount: payments
        .filter(p => p.status === 'refunded')
        .reduce((sum, payment) => sum + (payment.refundAmount || 0), 0),
    };

    return NextResponse.json({
      payments: paginatedPayments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      summary,
    });

  } catch (error) {
    console.error('Error fetching client payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients/[clientId]/payments
 * Create a new payment (typically called by webhook or payment processor)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params;
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['invoiceId', 'amount', 'paymentMethod', 'transactionId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create new payment record
    const newPayment: Payment = {
      id: `payment-${Date.now()}`, // In real app, use proper UUID
      invoiceId: body.invoiceId,
      clientId,
      amount: {
        amount: parseFloat(body.amount.amount),
        currency: body.amount.currency || 'USD',
      },
      paymentMethod: body.paymentMethod,
      transactionId: body.transactionId,
      status: body.status || 'pending',
      processedAt: new Date(),
    };

    // In a real application, save to database
    mockPayments.push(newPayment);

    // Update invoice status if payment is completed
    if (newPayment.status === 'completed') {
      // Update invoice status to 'paid'
      // This would typically be done through an invoice service
    }

    return NextResponse.json(newPayment, { status: 201 });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment record' },
      { status: 500 }
    );
  }
}