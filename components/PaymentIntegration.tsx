'use client';

import React, { useState } from 'react';
import PaymentForm from './PaymentForm';
import PaymentConfirmation from './PaymentConfirmation';
import PaymentReceipt from './PaymentReceipt';
import { Alert, AlertDescription } from './ui/alert';
import { EnhancedInvoice, Payment } from '../lib/types';
import { PaymentError } from '../lib/services/PaymentService';

interface PaymentIntegrationProps {
  invoice: EnhancedInvoice;
  clientId: string;
  onPaymentComplete?: (payment: Payment) => void;
  onCancel?: () => void;
  businessInfo?: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
  };
}

type PaymentStep = 'form' | 'confirmation' | 'error';

export default function PaymentIntegration({
  invoice,
  clientId,
  onPaymentComplete,
  onCancel,
  businessInfo,
}: PaymentIntegrationProps) {
  const [currentStep, setCurrentStep] = useState<PaymentStep>('form');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<PaymentError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Create payment record
      const newPayment: Payment = {
        id: crypto.randomUUID(),
        invoiceId: invoice.id,
        clientId,
        amount: {
          amount: invoice.totals.total,
          currency: invoice.currency.code,
        },
        paymentMethod: 'card',
        transactionId: paymentIntentId,
        status: 'completed',
        processedAt: new Date(),
      };

      setPayment(newPayment);
      setCurrentStep('confirmation');
      
      // Send confirmation email (in a real app, this would be handled by the backend)
      await sendConfirmationEmail(invoice, newPayment);
      
      // Notify parent component
      if (onPaymentComplete) {
        onPaymentComplete(newPayment);
      }
    } catch (err) {
      console.error('Error handling payment success:', err);
      setError(new PaymentError(
        'Payment was successful but there was an error processing the confirmation',
        'confirmation_error',
        false
      ));
      setCurrentStep('error');
    }
  };

  const handlePaymentError = (paymentError: PaymentError) => {
    setError(paymentError);
    setCurrentStep('error');
  };

  const handleRetryPayment = () => {
    setIsRetrying(true);
    setError(null);
    setCurrentStep('form');
    
    // Reset retry flag after a short delay
    setTimeout(() => {
      setIsRetrying(false);
    }, 1000);
  };

  const handleDownloadReceipt = () => {
    if (!payment) return;
    
    // The PaymentReceipt component handles the PDF generation and download
    // This is just a placeholder for any additional logic needed
    console.log('Downloading receipt for payment:', payment.id);
  };

  const handleSendReceipt = async () => {
    if (!payment) return;
    
    try {
      const response = await fetch('/api/payments/send-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.id,
          invoiceId: invoice.id,
          clientEmail: invoice.client.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send receipt');
      }

      // Show success message (you might want to add a toast notification here)
      console.log('Receipt sent successfully');
    } catch (err) {
      console.error('Error sending receipt:', err);
      // Show error message (you might want to add a toast notification here)
    }
  };

  const sendConfirmationEmail = async (invoice: EnhancedInvoice, payment: Payment) => {
    try {
      const response = await fetch('/api/payments/send-confirmation', {
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

      if (!response.ok) {
        console.error('Failed to send confirmation email');
      }
    } catch (err) {
      console.error('Error sending confirmation email:', err);
    }
  };

  // Render based on current step
  switch (currentStep) {
    case 'form':
      return (
        <div className="space-y-4">
          {isRetrying && (
            <Alert>
              <AlertDescription>
                Retrying payment... Please wait.
              </AlertDescription>
            </Alert>
          )}
          
          <PaymentForm
            invoice={invoice}
            clientId={clientId}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onCancel={onCancel}
          />
        </div>
      );

    case 'confirmation':
      return (
        <div className="space-y-4">
          <PaymentConfirmation
            invoice={invoice}
            payment={payment!}
            onDownloadReceipt={handleDownloadReceipt}
            onSendReceipt={handleSendReceipt}
            onBackToInvoices={onCancel}
          />
          
          {/* Receipt Download Component */}
          <div className="flex justify-center">
            <PaymentReceipt
              invoice={invoice}
              payment={payment!}
              businessInfo={businessInfo}
            />
          </div>
        </div>
      );

    case 'error':
      return (
        <div className="max-w-md mx-auto p-6">
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Payment Error</p>
                <p>{error?.message}</p>
                {error?.code && (
                  <p className="text-sm opacity-75">Error Code: {error.code}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            {error?.retryable && (
              <button
                onClick={handleRetryPayment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            )}
            
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back to Invoice
              </button>
            )}
          </div>

          {/* Help Information */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-2">
              If you continue to experience issues, please try:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Checking your card details are correct</li>
              <li>• Ensuring you have sufficient funds</li>
              <li>• Contacting your bank if the payment is being declined</li>
              <li>• Trying a different payment method</li>
            </ul>
            <p className="text-sm text-gray-600 mt-3">
              For further assistance, contact our support team at{' '}
              <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
                support@example.com
              </a>
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
}