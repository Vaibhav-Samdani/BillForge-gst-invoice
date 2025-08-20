'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { 
  AlertTriangle, 
  DollarSign, 
  Calendar,
  Info,
  Loader2
} from 'lucide-react';
import { Payment, EnhancedInvoice } from '../../lib/types';
import { RefundRequest, PaymentTrackingService } from '../../lib/services/PaymentTrackingService';
import { formatCurrency } from '../../lib/utils/paymentExport';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface RefundRequestModalProps {
  payment: Payment | null;
  invoice?: EnhancedInvoice;
  isOpen: boolean;
  onClose: () => void;
  onRefundRequested: (refundRequest: RefundRequest) => void;
}

const REFUND_REASONS = [
  { value: 'requested_by_customer', label: 'Requested by Customer' },
  { value: 'duplicate', label: 'Duplicate Payment' },
  { value: 'fraudulent', label: 'Fraudulent Transaction' },
  { value: 'other', label: 'Other' },
] as const;

export default function RefundRequestModal({
  payment,
  invoice,
  isOpen,
  onClose,
  onRefundRequested,
}: RefundRequestModalProps) {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [reason, setReason] = useState<RefundRequest['reason']>('requested_by_customer');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!payment) return null;

  const maxRefundAmount = payment.amount.amount - (payment.refundAmount || 0);
  const canRefund = payment.status === 'completed' && !payment.refundedAt && maxRefundAmount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canRefund) {
      setError('This payment cannot be refunded');
      return;
    }

    // Validate refund amount for partial refunds
    if (refundType === 'partial') {
      const amount = parseFloat(refundAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid refund amount');
        return;
      }
      if (amount > maxRefundAmount) {
        setError(`Refund amount cannot exceed ${formatCurrency(maxRefundAmount, payment.amount.currency)}`);
        return;
      }
    }

    setIsProcessing(true);

    try {
      const refundRequest: RefundRequest = {
        paymentId: payment.id,
        amount: refundType === 'partial' ? parseFloat(refundAmount) : undefined,
        reason,
        description: description.trim() || undefined,
      };

      // Process the refund
      const result = await PaymentTrackingService.processRefund(refundRequest);

      if (result.success) {
        toast.success('Refund request submitted successfully');
        onRefundRequested(refundRequest);
        onClose();
        resetForm();
      } else {
        setError(result.error?.message || 'Failed to process refund request');
      }
    } catch (err) {
      console.error('Error submitting refund request:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setRefundType('full');
    setRefundAmount('');
    setReason('requested_by_customer');
    setDescription('');
    setError(null);
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetForm();
      onClose();
    }
  };

  const calculateRefundAmount = () => {
    return refundType === 'full' ? maxRefundAmount : parseFloat(refundAmount) || 0;
  };

  const estimatedArrivalDate = new Date();
  estimatedArrivalDate.setDate(estimatedArrivalDate.getDate() + 7); // 7 business days

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Request Refund
          </DialogTitle>
        </DialogHeader>

        {!canRefund ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This payment cannot be refunded. Only completed payments that haven't been previously refunded are eligible for refunds.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Transaction ID</Label>
                    <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded mt-1">
                      {payment.transactionId}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Payment Date</Label>
                    <p className="text-sm mt-1">
                      {format(new Date(payment.processedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Original Amount</Label>
                    <p className="font-semibold mt-1">
                      {formatCurrency(payment.amount.amount, payment.amount.currency)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Available for Refund</Label>
                    <p className="font-semibold text-green-600 mt-1">
                      {formatCurrency(maxRefundAmount, payment.amount.currency)}
                    </p>
                  </div>
                </div>

                {invoice && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Related Invoice</Label>
                      <p className="font-mono font-semibold mt-1">{invoice.invoiceNumber}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Refund Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Refund Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Refund Type */}
                <div>
                  <Label className="text-sm font-medium">Refund Type</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="full"
                        checked={refundType === 'full'}
                        onChange={(e) => setRefundType(e.target.value as 'full' | 'partial')}
                        className="text-blue-600"
                      />
                      <span>Full Refund ({formatCurrency(maxRefundAmount, payment.amount.currency)})</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="partial"
                        checked={refundType === 'partial'}
                        onChange={(e) => setRefundType(e.target.value as 'full' | 'partial')}
                        className="text-blue-600"
                      />
                      <span>Partial Refund</span>
                    </label>
                  </div>
                </div>

                {/* Partial Refund Amount */}
                {refundType === 'partial' && (
                  <div>
                    <Label htmlFor="refundAmount">Refund Amount</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {payment.amount.currency === 'USD' ? '$' : payment.amount.currency}
                      </span>
                      <Input
                        id="refundAmount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={maxRefundAmount}
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        placeholder="0.00"
                        className="pl-8"
                        required={refundType === 'partial'}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum: {formatCurrency(maxRefundAmount, payment.amount.currency)}
                    </p>
                  </div>
                )}

                {/* Reason */}
                <div>
                  <Label htmlFor="reason">Reason for Refund</Label>
                  <Select value={reason} onValueChange={(value) => setReason(value as RefundRequest['reason'])}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REFUND_REASONS.map((reasonOption) => (
                        <SelectItem key={reasonOption.value} value={reasonOption.value}>
                          {reasonOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Additional Details (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide any additional details about the refund request..."
                    className="mt-1"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {description.length}/500 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Refund Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Refund Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Refund Amount:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(calculateRefundAmount(), payment.amount.currency)}
                  </span>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Processing Information</p>
                    <ul className="text-blue-700 space-y-1">
                      <li>• Refunds typically take 5-10 business days to appear in your account</li>
                      <li>• You will receive an email confirmation once the refund is processed</li>
                      <li>• The refund will appear on the same payment method used for the original transaction</li>
                      <li>• Estimated arrival: {format(estimatedArrivalDate, 'MMM dd, yyyy')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <DialogFooter className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing || (refundType === 'partial' && !refundAmount)}
                className="min-w-[120px]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Request Refund`
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}