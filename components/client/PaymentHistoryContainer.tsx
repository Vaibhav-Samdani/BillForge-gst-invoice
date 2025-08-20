'use client';

import React, { useState, useEffect } from 'react';
import PaymentHistory from './PaymentHistory';
import PaymentDetailsModal from './PaymentDetailsModal';
import RefundRequestModal from './RefundRequestModal';
import PaymentHistoryPDF from './PaymentHistoryPDF';
import { Payment, EnhancedInvoice } from '../../lib/types';
import { RefundRequest } from '../../lib/services/PaymentTrackingService';
import { exportPaymentsToCSV } from '../../lib/utils/paymentExport';
import { toast } from 'sonner';

interface PaymentHistoryContainerProps {
  clientId: string;
  initialPayments?: Payment[];
  initialInvoices?: EnhancedInvoice[];
}

export default function PaymentHistoryContainer({
  clientId,
  initialPayments = [],
  initialInvoices = [],
}: PaymentHistoryContainerProps) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [invoices, setInvoices] = useState<EnhancedInvoice[]>(initialInvoices);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);

  // Load payments and invoices
  const loadPayments = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, these would be API calls
      const [paymentsResponse, invoicesResponse] = await Promise.all([
        fetch(`/api/clients/${clientId}/payments`),
        fetch(`/api/clients/${clientId}/invoices`),
      ]);

      if (paymentsResponse.ok && invoicesResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        const invoicesData = await invoicesResponse.json();
        
        setPayments(paymentsData);
        setInvoices(invoicesData);
      } else {
        toast.error('Failed to load payment data');
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payment data');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh payments
  const handleRefreshPayments = () => {
    loadPayments();
  };

  // Export to CSV
  const handleExportCSV = (filteredPayments: Payment[]) => {
    try {
      exportPaymentsToCSV({
        payments: filteredPayments,
        invoices,
      });
      toast.success('Payment history exported to CSV');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  // Export to PDF
  const handleExportPDF = (filteredPayments: Payment[]) => {
    try {
      // Create a temporary element to trigger PDF download
      const pdfElement = document.createElement('div');
      document.body.appendChild(pdfElement);
      
      // In a real implementation, you would render the PDF component
      // and trigger the download programmatically
      toast.success('PDF export initiated');
      
      document.body.removeChild(pdfElement);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  // View payment details
  const handleViewPaymentDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  };

  // Close payment details modal
  const handleClosePaymentDetails = () => {
    setShowPaymentDetails(false);
    setSelectedPayment(null);
  };

  // Download receipt
  const handleDownloadReceipt = async (payment: Payment) => {
    try {
      const response = await fetch(`/api/payments/${payment.id}/receipt`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${payment.transactionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Receipt downloaded');
      } else {
        toast.error('Failed to download receipt');
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt');
    }
  };

  // Email receipt
  const handleEmailReceipt = async (payment: Payment) => {
    try {
      const response = await fetch(`/api/payments/${payment.id}/email-receipt`, {
        method: 'POST',
      });
      
      if (response.ok) {
        toast.success('Receipt sent to your email');
      } else {
        toast.error('Failed to send receipt');
      }
    } catch (error) {
      console.error('Error sending receipt:', error);
      toast.error('Failed to send receipt');
    }
  };

  // View invoice
  const handleViewInvoice = (invoiceId: string) => {
    // Navigate to invoice view
    window.open(`/client/invoices/${invoiceId}`, '_blank');
  };

  // Request refund
  const handleRequestRefund = (payment: Payment) => {
    setRefundPayment(payment);
    setShowRefundModal(true);
    setShowPaymentDetails(false);
  };

  // Close refund modal
  const handleCloseRefundModal = () => {
    setShowRefundModal(false);
    setRefundPayment(null);
  };

  // Handle refund requested
  const handleRefundRequested = (refundRequest: RefundRequest) => {
    // Update the payment in the local state to reflect the refund request
    setPayments(prevPayments => 
      prevPayments.map(payment => 
        payment.id === refundRequest.paymentId
          ? {
              ...payment,
              status: 'refunded' as const,
              refundAmount: refundRequest.amount || payment.amount.amount,
              refundedAt: new Date(),
            }
          : payment
      )
    );
    
    toast.success('Refund request submitted successfully');
  };

  // Load data on mount
  useEffect(() => {
    if (initialPayments.length === 0 || initialInvoices.length === 0) {
      loadPayments();
    }
  }, [clientId]);

  // Find selected payment's invoice
  const selectedInvoice = selectedPayment 
    ? invoices.find(invoice => invoice.id === selectedPayment.invoiceId)
    : undefined;

  // Find refund payment's invoice
  const refundInvoice = refundPayment
    ? invoices.find(invoice => invoice.id === refundPayment.invoiceId)
    : undefined;

  return (
    <div className="space-y-6">
      {/* Payment History Component */}
      <PaymentHistory
        payments={payments}
        invoices={invoices}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        onViewPaymentDetails={handleViewPaymentDetails}
        onRefreshPayments={handleRefreshPayments}
        isLoading={isLoading}
      />

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        payment={selectedPayment}
        invoice={selectedInvoice}
        isOpen={showPaymentDetails}
        onClose={handleClosePaymentDetails}
        onDownloadReceipt={handleDownloadReceipt}
        onEmailReceipt={handleEmailReceipt}
        onViewInvoice={handleViewInvoice}
        onRequestRefund={handleRequestRefund}
      />

      {/* Refund Request Modal */}
      <RefundRequestModal
        payment={refundPayment}
        invoice={refundInvoice}
        isOpen={showRefundModal}
        onClose={handleCloseRefundModal}
        onRefundRequested={handleRefundRequested}
      />

      {/* Hidden PDF Component for Export */}
      <div style={{ display: 'none' }}>
        <PaymentHistoryPDF
          payments={payments}
          invoices={invoices}
          clientName={invoices[0]?.client.name}
        />
      </div>
    </div>
  );
}