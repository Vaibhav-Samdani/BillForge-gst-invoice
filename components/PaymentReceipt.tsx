'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { EnhancedInvoice, Payment } from '../lib/types';

interface PaymentReceiptProps {
  invoice: EnhancedInvoice;
  payment: Payment;
  businessInfo?: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
  };
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
    marginBottom: 20,
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
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  value: {
    fontSize: 12,
    color: '#111827',
  },
  transactionId: {
    fontSize: 10,
    fontFamily: 'Courier',
    backgroundColor: '#f3f4f6',
    padding: 4,
    borderRadius: 2,
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#2563eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
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
  successBadge: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    padding: 6,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
});

// PDF Document Component
const PaymentReceiptDocument: React.FC<PaymentReceiptProps> = ({
  invoice,
  payment,
  businessInfo,
}) => {
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
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Payment Receipt</Text>
          <Text style={styles.subtitle}>
            Receipt for Invoice #{invoice.invoiceNumber}
          </Text>
        </View>

        {/* Success Badge */}
        <View style={styles.successBadge}>
          <Text>✓ PAYMENT SUCCESSFUL</Text>
        </View>

        {/* Business Information */}
        {businessInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>From</Text>
            <Text style={styles.value}>{businessInfo.name}</Text>
            <Text style={styles.value}>{businessInfo.address}</Text>
            {businessInfo.phone && <Text style={styles.value}>{businessInfo.phone}</Text>}
            {businessInfo.email && <Text style={styles.value}>{businessInfo.email}</Text>}
          </View>
        )}

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.value}>{invoice.client.name}</Text>
          {invoice.client.email && <Text style={styles.value}>{invoice.client.email}</Text>}
          {invoice.client.address && <Text style={styles.value}>{invoice.client.address}</Text>}
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Transaction ID:</Text>
            <Text style={styles.transactionId}>{payment.transactionId}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Payment Date:</Text>
            <Text style={styles.value}>{formatDate(payment.processedAt)}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method:</Text>
            <Text style={styles.value}>
              {payment.paymentMethod.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{payment.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Invoice Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Summary</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Invoice Number:</Text>
            <Text style={styles.value}>{invoice.invoiceNumber}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Invoice Date:</Text>
            <Text style={styles.value}>{invoice.invoiceDate}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Due Date:</Text>
            <Text style={styles.value}>{invoice.dueDate?.toLocaleDateString() || 'N/A'}</Text>
          </View>
        </View>

        {/* Amount Breakdown */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Subtotal:</Text>
            <Text style={styles.value}>
              {formatCurrency(invoice.totals.subtotal, invoice.currency.code)}
            </Text>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.label}>Tax:</Text>
            <Text style={styles.value}>
              {formatCurrency(invoice.totals.tax, invoice.currency.code)}
            </Text>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(payment.amount.amount, payment.amount.currency)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is an official payment receipt generated on {formatDate(new Date())}
          </Text>
          <Text style={styles.footerText}>
            For questions about this payment, please contact our support team.
          </Text>
          <Text style={styles.footerText}>
            Thank you for your business!
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// Main Component with Download Link
export default function PaymentReceipt(props: PaymentReceiptProps) {
  const fileName = `receipt-${props.invoice.invoiceNumber}-${props.payment.transactionId}.pdf`;

  return (
    <PDFDownloadLink
      document={<PaymentReceiptDocument {...props} />}
      fileName={fileName}
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      {({ blob, url, loading, error }) => {
        if (loading) return 'Generating receipt...';
        if (error) return 'Error generating receipt';
        return 'Download Receipt';
      }}
    </PDFDownloadLink>
  );
}