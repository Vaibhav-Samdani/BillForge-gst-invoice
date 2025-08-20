'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { 
  Download, 
  Mail, 
  Copy, 
  ExternalLink,
  CreditCard,
  Calendar,
  DollarSign,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Payment, EnhancedInvoice } from '../../lib/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PaymentDetailsModalProps {
  payment: Payment | null;
  invoice?: EnhancedInvoice;
  isOpen: boolean;
  onClose: () => void;
  onDownloadReceipt?: (payment: Payment) => void;
  onEmailReceipt?: (payment: Payment) => void;
  onViewInvoice?: (invoiceId: string) => void;
  onRequestRefund?: (payment: Payment) => void;
}

export default function PaymentDetailsModal({
  payment,
  invoice,
  isOpen,
  onClose,
  onDownloadReceipt,
  onEmailReceipt,
  onViewInvoice,
  onRequestRefund,
}: PaymentDetailsModalProps) {
  if (!payment) return null;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMMM dd, yyyy \'at\' HH:mm');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const getStatusBadgeVariant = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'refunded':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'pending':
        return '⏳';
      case 'failed':
        return '✗';
      case 'refunded':
        return '↩';
      default:
        return '?';
    }
  };

  const getPaymentMethodIcon = (method: Payment['paymentMethod']) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer':
        return <DollarSign className="h-4 w-4" />;
      case 'paypal':
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const canRequestRefund = payment.status === 'completed' && !payment.refundedAt;
  const isRefunded = payment.status === 'refunded' || (payment.refundAmount && payment.refundAmount > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{getStatusIcon(payment.status)}</span>
            Payment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Amount Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getStatusBadgeVariant(payment.status)} className="text-sm">
                  {payment.status.toUpperCase()}
                </Badge>
                {isRefunded && (
                  <Badge variant="outline" className="text-sm">
                    REFUNDED
                  </Badge>
                )}
              </div>
              <p className="text-3xl font-bold">
                {formatCurrency(payment.amount.amount, payment.amount.currency)}
              </p>
              {payment.refundAmount && payment.refundAmount > 0 && (
                <p className="text-lg text-orange-600">
                  Refunded: {formatCurrency(payment.refundAmount, payment.amount.currency)}
                </p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {onDownloadReceipt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadReceipt(payment)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Receipt
                </Button>
              )}
              {onEmailReceipt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEmailReceipt(payment)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded flex-1">
                      {payment.transactionId}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(payment.transactionId, 'Transaction ID')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Method</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getPaymentMethodIcon(payment.paymentMethod)}
                    <span className="capitalize">
                      {payment.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(payment.processedAt)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Currency</label>
                  <div className="mt-1">
                    <span className="font-semibold">{payment.amount.currency}</span>
                  </div>
                </div>
              </div>

              {/* Refund Information */}
              {isRefunded && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Refund Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {payment.refundedAt && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Refund Date</label>
                          <div className="mt-1">
                            <span>{formatDate(payment.refundedAt)}</span>
                          </div>
                        </div>
                      )}
                      {payment.refundAmount && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Refund Amount</label>
                          <div className="mt-1">
                            <span className="font-semibold text-orange-600">
                              {formatCurrency(payment.refundAmount, payment.amount.currency)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Invoice Information */}
          {invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related Invoice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Invoice Number</label>
                    <div className="mt-1">
                      <span className="font-mono font-semibold">{invoice.invoiceNumber}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Invoice Date</label>
                    <div className="mt-1">
                      <span>{invoice.invoiceDate}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Due Date</label>
                    <div className="mt-1">
                      <span>{invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Invoice Total</label>
                    <div className="mt-1">
                      <span className="font-semibold">
                        {formatCurrency(invoice.totals.total, invoice.currency.code)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {onViewInvoice && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      onClick={() => onViewInvoice(invoice.id)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Invoice
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Status Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payment.status === 'completed' && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-900">Payment Completed</p>
                      <p className="text-sm text-green-700">
                        Your payment was successfully processed and the invoice has been marked as paid.
                      </p>
                    </div>
                  </div>
                )}
                
                {payment.status === 'pending' && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-yellow-600 text-sm">⏳</span>
                    </div>
                    <div>
                      <p className="font-medium text-yellow-900">Payment Pending</p>
                      <p className="text-sm text-yellow-700">
                        Your payment is being processed. This usually takes a few minutes.
                      </p>
                    </div>
                  </div>
                )}
                
                {payment.status === 'failed' && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-red-900">Payment Failed</p>
                      <p className="text-sm text-red-700">
                        Your payment could not be processed. Please try again or contact support.
                      </p>
                    </div>
                  </div>
                )}
                
                {isRefunded && (
                  <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <RefreshCw className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-orange-900">Payment Refunded</p>
                      <p className="text-sm text-orange-700">
                        {payment.refundAmount && payment.refundAmount < payment.amount.amount
                          ? `A partial refund of ${formatCurrency(payment.refundAmount, payment.amount.currency)} has been processed.`
                          : 'A full refund has been processed and will appear in your account within 5-10 business days.'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {canRequestRefund && onRequestRefund && (
              <Button
                variant="outline"
                onClick={() => onRequestRefund(payment)}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Request Refund
              </Button>
            )}
            
            <Button onClick={onClose} className="flex-1 sm:flex-none">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}