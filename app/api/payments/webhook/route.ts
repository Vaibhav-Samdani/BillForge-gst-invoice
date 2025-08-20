import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../../lib/config/stripe';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(failedPayment);
        break;

      case 'charge.dispute.created':
        const dispute = event.data.object as Stripe.Dispute;
        await handleChargeDispute(dispute);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  const metadata = paymentIntent.metadata;
  if (!metadata.invoiceId || !metadata.clientId) {
    console.error('Missing metadata in payment intent:', paymentIntent.id);
    return;
  }

  try {
    // Create payment record
    const payment = {
      id: crypto.randomUUID(),
      invoiceId: metadata.invoiceId,
      clientId: metadata.clientId,
      amount: {
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
      },
      paymentMethod: 'card',
      transactionId: paymentIntent.id,
      status: 'completed' as const,
      processedAt: new Date(),
    };

    // Update invoice status via API call
    const updateResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/invoices/${metadata.invoiceId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId: paymentIntent.id,
        status: 'paid',
        payment,
      }),
    });

    if (!updateResponse.ok) {
      console.error('Failed to update invoice status:', await updateResponse.text());
      return;
    }

    // Get invoice details for email sending
    const invoiceResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/invoices/${metadata.invoiceId}`);
    if (invoiceResponse.ok) {
      const invoice = await invoiceResponse.json();
      
      // Send confirmation emails
      await fetch(`${process.env.NEXTAUTH_URL}/api/payments/send-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice,
          payment,
          clientEmail: invoice.client.email,
        }),
      });
    }

    console.log(`Successfully processed payment for invoice ${metadata.invoiceId}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  
  const metadata = paymentIntent.metadata;
  if (!metadata.invoiceId) {
    console.error('Missing invoice ID in failed payment:', paymentIntent.id);
    return;
  }

  try {
    // Log payment failure details
    const failureReason = paymentIntent.last_payment_error?.message || 'Unknown error';
    console.log(`Payment failed for invoice ${metadata.invoiceId}: ${failureReason}`);

    // TODO: In a real implementation, you might want to:
    // 1. Update payment attempt count in database
    // 2. Send notification to client about failed payment
    // 3. Send notification to business owner
    // 4. Implement retry logic for certain types of failures

    // For now, just log the failure
    console.log('Payment failure logged for invoice:', metadata.invoiceId);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handleChargeDispute(dispute: Stripe.Dispute) {
  console.log('Charge dispute created:', dispute.id);
  
  // TODO: Handle dispute
  // 1. Log the dispute
  // 2. Notify business owner
  // 3. Update payment status
  // 4. Prepare dispute response if needed
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id);
  
  // TODO: Handle subscription invoice payment
  // This would be relevant for recurring payments
}