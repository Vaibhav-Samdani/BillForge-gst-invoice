'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, Download, Mail, ArrowLeft } from 'lucide-react';
import { EnhancedInvoice, Payment } from '../lib/types';

interface PaymentConfirmationProps {
  invoice: EnhancedInvoice;
  payment: Payment;
  onDownloadReceipt?: () => void;
  onSendReceipt?: () => void;
  onBackToInvoices?: () => void;
  onViewInvoice?: () => void;
}

export default function PaymentConfirmation({
  invoice,
  payment,
  onDownloadReceipt,
  onSendReceipt,
  onBackToInvoices,
  onViewInvoice,
}: PaymentConfirmationProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600">
          Your payment has been processed successfully.
        </p>
      </div>

      {/* Payment Details Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Invoice Number</label>
              <p className="text-lg font-semibold">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Payment Amount</label>
              <p className="text-lg font-semibold">
                {formatCurrency(payment.amount.amount, payment.amount.currency)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Transaction ID</label>
              <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {payment.transactionId}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Payment Date</label>
              <p className="text-sm">{formatDate(payment.processedAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Payment Method</label>
              <p className="text-sm capitalize">
                {payment.paymentMethod.replace('_', ' ')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {payment.status}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Invoice Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(invoice.totals.subtotal, invoice.currency.code)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax:</span>
              <span>{formatCurrency(invoice.totals.tax, invoice.currency.code)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total Paid:</span>
                <span>{formatCurrency(invoice.totals.total, invoice.currency.code)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onDownloadReceipt && (
          <Button
            onClick={onDownloadReceipt}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Receipt
          </Button>
        )}
        
        {onSendReceipt && (
          <Button
            onClick={onSendReceipt}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Email Receipt
          </Button>
        )}
        
        {onViewInvoice && (
          <Button
            onClick={onViewInvoice}
            variant="outline"
            className="flex items-center gap-2"
          >
            View Invoice
          </Button>
        )}
        
        {onBackToInvoices && (
          <Button
            onClick={onBackToInvoices}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </Button>
        )}
      </div>

      {/* Additional Information */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• A confirmation email has been sent to your registered email address</li>
          <li>• Your invoice status has been updated to "Paid"</li>
          <li>• You can download your receipt anytime from your account</li>
          <li>• For any questions, please contact our support team</li>
        </ul>
      </div>

      {/* Support Information */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Need help? Contact us at{' '}
          <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
            support@example.com
          </a>
        </p>
      </div>
    </div>
  );
}