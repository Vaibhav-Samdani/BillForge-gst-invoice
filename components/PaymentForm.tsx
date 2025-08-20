'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CreditCard, Shield, Lock } from 'lucide-react';
import { EnhancedInvoice, CurrencyAmount } from '../lib/types';
import { PaymentService, PaymentError } from '../lib/services/PaymentService';
import { getStripe } from '../lib/config/stripe';

interface PaymentFormProps {
  invoice: EnhancedInvoice;
  clientId: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: PaymentError) => void;
  onCancel?: () => void;
}

interface PaymentFormInnerProps extends PaymentFormProps {
  stripe: Stripe | null;
  elements: StripeElements | null;
}

// Card element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
};

function PaymentFormInner({
  invoice,
  clientId,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  stripe,
  elements,
}: PaymentFormInnerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invoiceId: invoice.id,
            clientId,
            amount: {
              amount: invoice.totals.total,
              currency: invoice.currency.code,
            },
            description: `Payment for Invoice ${invoice.invoiceNumber}`,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const intent = await response.json();
        setPaymentIntent(intent);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Failed to initialize payment. Please try again.');
      }
    };

    createPaymentIntent();
  }, [invoice, clientId]);

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !paymentIntent) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card information is required');
      setIsProcessing(false);
      return;
    }

    try {
      // Confirm the payment with Stripe
      const { error: stripeError, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: invoice.client.name,
              email: invoice.client.email,
            },
          },
        }
      );

      if (stripeError) {
        console.error('Stripe error:', stripeError);
        const paymentError = new PaymentError(
          stripeError.message || 'Payment failed',
          stripeError.code || 'unknown_error',
          stripeError.type === 'card_error'
        );
        onPaymentError(paymentError);
        setError(stripeError.message || 'Payment failed');
      } else if (confirmedPayment && confirmedPayment.status === 'succeeded') {
        // Payment successful - update invoice status
        await updateInvoiceStatus(invoice.id, confirmedPayment.id);
        onPaymentSuccess(confirmedPayment.id);
      } else {
        setError('Payment was not completed. Please try again.');
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      const paymentError = new PaymentError(
        'An unexpected error occurred during payment processing',
        'processing_error',
        true
      );
      onPaymentError(paymentError);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, paymentIntentId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          status: 'paid',
        }),
      });

      if (!response.ok) {
        console.error('Failed to update invoice status');
      }
    } catch (err) {
      console.error('Error updating invoice status:', err);
    }
  };

  const processingFee = PaymentService.calculateProcessingFee(
    invoice.totals.total,
    invoice.currency.code
  );

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
        <div className="text-sm text-gray-600">
          <p>Invoice: {invoice.invoiceNumber}</p>
          <p>Amount: {invoice.currency.symbol}{invoice.totals.total.toFixed(2)}</p>
          {processingFee > 0 && (
            <p className="text-xs">Processing fee: {invoice.currency.symbol}{processingFee.toFixed(2)}</p>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Security badges */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              <span>256-bit Encryption</span>
            </div>
          </div>

          {/* Card input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Card Information</label>
            <div className="p-3 border rounded-md bg-white">
              <CardElement
                options={cardElementOptions}
                onChange={handleCardChange}
              />
            </div>
            {cardError && (
              <p className="text-sm text-red-600">{cardError}</p>
            )}
          </div>

          {/* Error display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={!stripe || !cardComplete || isProcessing || !paymentIntent}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${invoice.currency.symbol}${invoice.totals.total.toFixed(2)}`
              )}
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="text-xs text-center text-gray-500 pt-2">
            <p>Powered by Stripe • Your payment information is secure</p>
            <p>We never store your card details</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function PaymentForm(props: PaymentFormProps) {
  const [stripePromise] = useState(() => getStripe());

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormInner {...props} />
    </Elements>
  );
}