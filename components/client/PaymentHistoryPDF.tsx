'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Payment, EnhancedInvoice } from '../../lib/types';
import { format } from 'date-fns';
import { generatePaymentSummary, formatCurrency } from '../../lib/utils/paymentExport';

interface PaymentHistoryPDFProps {
  payments: Payment[];
  invoices: EnhancedInvoice[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: {
    status?: string[];
    paymentMethod?: string[];
  };
  clientName?: string;
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2563eb',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  dateRange: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 20,
  },
  summarySection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 5,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  tableSection: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    minHeight: 35,
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
    paddingRight: 5,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
    paddingRight: 5,
  },
  // Column widths
  colDate: { width: '12%' },
  colTransaction: { width: '15%' },
  colInvoice: { width: '12%' },
  colAmount: { width: '12%' },
  colMethod: { width: '12%' },
  colStatus: { width: '10%' },
  colClient: { width: '15%' },
  colRefund: { width: '12%' },
  
  statusBadge: {
    padding: 3,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusCompleted: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusFailed: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  statusRefunded: {
    backgroundColor: '#f3e8ff',
    color: '#7c3aed',
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#6b7280',
  },
});

// PDF Document Component
const PaymentHistoryDocument: React.FC<PaymentHistoryPDFProps> = ({
  payments,
  invoices,
  dateRange,
  filters,
  clientName,
}) => {
  // Create invoice lookup map
  const invoiceMap = invoices.reduce((map, invoice) => {
    map[invoice.id] = invoice;
    return map;
  }, {} as Record<string, EnhancedInvoice>);

  // Generate summary statistics
  const summary = generatePaymentSummary(payments);

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const getStatusStyle = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return [styles.statusBadge, styles.statusCompleted];
      case 'pending':
        return [styles.statusBadge, styles.statusPending];
      case 'failed':
        return [styles.statusBadge, styles.statusFailed];
      case 'refunded':
        return [styles.statusBadge, styles.statusRefunded];
      default:
        return [styles.statusBadge, styles.statusPending];
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Payment History Report</Text>
          {clientName && (
            <Text style={styles.subtitle}>Client: {clientName}</Text>
          )}
          {dateRange && (
            <Text style={styles.dateRange}>
              Period: {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
            </Text>
          )}
          <Text style={styles.dateRange}>
            Generated on {format(new Date(), 'MMMM dd, yyyy \'at\' HH:mm')}
          </Text>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Summary</Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Payments</Text>
              <Text style={styles.summaryValue}>{summary.totalPayments}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Completed</Text>
              <Text style={styles.summaryValue}>{summary.completedPayments}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={styles.summaryValue}>{summary.pendingPayments}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Failed</Text>
              <Text style={styles.summaryValue}>{summary.failedPayments}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Refunded</Text>
              <Text style={styles.summaryValue}>{summary.refundedPayments}</Text>
            </View>
          </View>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.summaryValue}>
                {payments.length > 0 
                  ? formatCurrency(summary.totalAmount, payments[0].amount.currency)
                  : '$0.00'
                }
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Completed Amount</Text>
              <Text style={styles.summaryValue}>
                {payments.length > 0 
                  ? formatCurrency(summary.completedAmount, payments[0].amount.currency)
                  : '$0.00'
                }
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Refunded Amount</Text>
              <Text style={styles.summaryValue}>
                {payments.length > 0 
                  ? formatCurrency(summary.refundedAmount, payments[0].amount.currency)
                  : '$0.00'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Table */}
        <View style={styles.tableSection}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, styles.colDate]}>Date</Text>
            <Text style={[styles.tableCellHeader, styles.colTransaction]}>Transaction ID</Text>
            <Text style={[styles.tableCellHeader, styles.colInvoice]}>Invoice</Text>
            <Text style={[styles.tableCellHeader, styles.colClient]}>Client</Text>
            <Text style={[styles.tableCellHeader, styles.colAmount]}>Amount</Text>
            <Text style={[styles.tableCellHeader, styles.colMethod]}>Method</Text>
            <Text style={[styles.tableCellHeader, styles.colStatus]}>Status</Text>
            <Text style={[styles.tableCellHeader, styles.colRefund]}>Refund</Text>
          </View>

          {/* Table Rows */}
          {payments.map((payment, index) => {
            const invoice = invoiceMap[payment.invoiceId];
            return (
              <View key={payment.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colDate]}>
                  {formatDate(payment.processedAt)}
                </Text>
                <Text style={[styles.tableCell, styles.colTransaction]}>
                  {truncateText(payment.transactionId, 12)}
                </Text>
                <Text style={[styles.tableCell, styles.colInvoice]}>
                  {invoice?.invoiceNumber || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, styles.colClient]}>
                  {truncateText(invoice?.client.name || 'N/A', 15)}
                </Text>
                <Text style={[styles.tableCell, styles.colAmount]}>
                  {formatCurrency(payment.amount.amount, payment.amount.currency)}
                </Text>
                <Text style={[styles.tableCell, styles.colMethod]}>
                  {payment.paymentMethod.replace('_', ' ')}
                </Text>
                <View style={[styles.colStatus, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={getStatusStyle(payment.status)}>
                    {payment.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.tableCell, styles.colRefund]}>
                  {payment.refundAmount 
                    ? formatCurrency(payment.refundAmount, payment.amount.currency)
                    : '-'
                  }
                </Text>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This report contains {payments.length} payment records
          </Text>
          <Text style={styles.footerText}>
            For questions about these payments, please contact our support team
          </Text>
        </View>

        {/* Page Number */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => 
          `Page ${pageNumber} of ${totalPages}`
        } fixed />
      </Page>
    </Document>
  );
};

// Main Component with Download Link
export default function PaymentHistoryPDF(props: PaymentHistoryPDFProps) {
  const fileName = `payment-history-${format(new Date(), 'yyyy-MM-dd')}.pdf`;

  return (
    <PDFDownloadLink
      document={<PaymentHistoryDocument {...props} />}
      fileName={fileName}
      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
    >
      {({ blob, url, loading, error }) => {
        if (loading) return 'Generating PDF...';
        if (error) return 'Error generating PDF';
        return 'Download PDF';
      }}
    </PDFDownloadLink>
  );
}