import { Payment, EnhancedInvoice } from '../types';
import { format } from 'date-fns';

export interface PaymentExportData {
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
}

/**
 * Export payments to CSV format
 */
export function exportPaymentsToCSV(data: PaymentExportData): void {
  const { payments, invoices } = data;

  // Create invoice lookup map
  const invoiceMap = invoices.reduce((map, invoice) => {
    map[invoice.id] = invoice;
    return map;
  }, {} as Record<string, EnhancedInvoice>);

  // Define CSV headers
  const headers = [
    'Payment Date',
    'Transaction ID',
    'Invoice Number',
    'Invoice Date',
    'Client Name',
    'Client Email',
    'Amount',
    'Currency',
    'Payment Method',
    'Status',
    'Refund Amount',
    'Refund Date',
    'Processing Fee',
    'Net Amount'
  ];

  // Convert payments to CSV rows
  const rows = payments.map(payment => {
    const invoice = invoiceMap[payment.invoiceId];
    const processingFee = calculateProcessingFee(payment.amount.amount, payment.amount.currency);
    const netAmount = payment.amount.amount - processingFee;

    return [
      format(new Date(payment.processedAt), 'yyyy-MM-dd HH:mm:ss'),
      payment.transactionId,
      invoice?.invoiceNumber || 'N/A',
      invoice?.invoiceDate || 'N/A',
      invoice?.client.name || 'N/A',
      invoice?.client.email || 'N/A',
      payment.amount.amount.toFixed(2),
      payment.amount.currency,
      payment.paymentMethod.replace('_', ' '),
      payment.status,
      payment.refundAmount?.toFixed(2) || '0.00',
      payment.refundedAt ? format(new Date(payment.refundedAt), 'yyyy-MM-dd HH:mm:ss') : '',
      processingFee.toFixed(2),
      netAmount.toFixed(2)
    ];
  });

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell =>
        typeof cell === 'string' && cell.includes(',')
          ? `"${cell.replace(/"/g, '""')}"`
          : cell
      ).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `payment-history-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate payment summary statistics
 */
export function generatePaymentSummary(payments: Payment[]) {
  const summary = payments.reduce(
    (acc, payment) => {
      acc.totalPayments += 1;
      acc.totalAmount += payment.amount.amount;

      switch (payment.status) {
        case 'completed':
          acc.completedPayments += 1;
          acc.completedAmount += payment.amount.amount;
          break;
        case 'pending':
          acc.pendingPayments += 1;
          acc.pendingAmount += payment.amount.amount;
          break;
        case 'failed':
          acc.failedPayments += 1;
          break;
        case 'refunded':
          acc.refundedPayments += 1;
          acc.refundedAmount += (payment.refundAmount || payment.amount.amount);
          break;
      }

      // Group by payment method
      if (!acc.paymentMethods[payment.paymentMethod]) {
        acc.paymentMethods[payment.paymentMethod] = {
          count: 0,
          amount: 0
        };
      }
      acc.paymentMethods[payment.paymentMethod].count += 1;
      acc.paymentMethods[payment.paymentMethod].amount += payment.amount.amount;

      // Group by currency
      if (!acc.currencies[payment.amount.currency]) {
        acc.currencies[payment.amount.currency] = {
          count: 0,
          amount: 0
        };
      }
      acc.currencies[payment.amount.currency].count += 1;
      acc.currencies[payment.amount.currency].amount += payment.amount.amount;

      return acc;
    },
    {
      totalPayments: 0,
      totalAmount: 0,
      completedPayments: 0,
      completedAmount: 0,
      pendingPayments: 0,
      pendingAmount: 0,
      failedPayments: 0,
      refundedPayments: 0,
      refundedAmount: 0,
      paymentMethods: {} as Record<string, { count: number; amount: number }>,
      currencies: {} as Record<string, { count: number; amount: number }>
    }
  );

  return summary;
}

/**
 * Calculate processing fee (simplified calculation)
 */
function calculateProcessingFee(amount: number, currency: string): number {
  // Stripe-like fee structure: 2.9% + fixed fee
  const percentageFee = amount * 0.029;
  const fixedFee = currency.toLowerCase() === 'usd' ? 0.30 : 0.25;

  return Math.round((percentageFee + fixedFee) * 100) / 100;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date, formatString: string = 'MMM dd, yyyy'): string {
  return format(new Date(date), formatString);
}

/**
 * Group payments by date range
 */
export function groupPaymentsByDateRange(
  payments: Payment[],
  range: 'day' | 'week' | 'month' | 'year' = 'month'
) {
  const groups: Record<string, Payment[]> = {};

  payments.forEach(payment => {
    let key: string;
    const date = new Date(payment.processedAt);

    switch (range) {
      case 'day':
        key = format(date, 'yyyy-MM-dd');
        break;
      case 'week':
        key = format(date, 'yyyy-\'W\'ww');
        break;
      case 'month':
        key = format(date, 'yyyy-MM');
        break;
      case 'year':
        key = format(date, 'yyyy');
        break;
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(payment);
  });

  return groups;
}

/**
 * Filter payments by date range
 */
export function filterPaymentsByDateRange(
  payments: Payment[],
  startDate: Date,
  endDate: Date
): Payment[] {
  return payments.filter(payment => {
    const paymentDate = new Date(payment.processedAt);
    return paymentDate >= startDate && paymentDate <= endDate;
  });
}

/**
 * Sort payments by specified field
 */
export function sortPayments(
  payments: Payment[],
  field: keyof Payment,
  direction: 'asc' | 'desc' = 'desc'
): Payment[] {
  return [...payments].sort((a, b) => {
    let aValue = a[field];
    let bValue = b[field];

    // Handle special cases
    if (field === 'amount') {
      aValue = a.amount?.amount as any;
      bValue = b.amount?.amount as any;
    }

    // Handle null/undefined values - put them at the end
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return direction === 'asc' ? 1 : -1;
    if (bValue == null) return direction === 'asc' ? -1 : 1;

    // At this point, both values are guaranteed to be non-null
    let processedAValue: any = aValue;
    let processedBValue: any = bValue;

    // Handle dates
    if (processedAValue instanceof Date && processedBValue instanceof Date) {
      processedAValue = processedAValue.getTime();
      processedBValue = processedBValue.getTime();
    }

    // Handle strings
    if (typeof processedAValue === 'string' && typeof processedBValue === 'string') {
      processedAValue = processedAValue.toLowerCase();
      processedBValue = processedBValue.toLowerCase();
    }

    if (processedAValue < processedBValue) {
      return direction === 'asc' ? -1 : 1;
    }
    if (processedAValue > processedBValue) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Search payments by text
 */
export function searchPayments(
  payments: Payment[],
  invoices: EnhancedInvoice[],
  searchTerm: string
): Payment[] {
  if (!searchTerm.trim()) {
    return payments;
  }

  const invoiceMap = invoices.reduce((map, invoice) => {
    map[invoice.id] = invoice;
    return map;
  }, {} as Record<string, EnhancedInvoice>);

  const searchLower = searchTerm.toLowerCase();

  return payments.filter(payment => {
    const invoice = invoiceMap[payment.invoiceId];

    return (
      payment.transactionId.toLowerCase().includes(searchLower) ||
      payment.paymentMethod.toLowerCase().includes(searchLower) ||
      payment.status.toLowerCase().includes(searchLower) ||
      payment.amount.currency.toLowerCase().includes(searchLower) ||
      (invoice && (
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.client.name.toLowerCase().includes(searchLower) ||
        invoice.client.email.toLowerCase().includes(searchLower)
      ))
    );
  });
}

/**
 * Validate payment data for export
 */
export function validatePaymentExportData(data: PaymentExportData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.payments || data.payments.length === 0) {
    errors.push('No payments to export');
  }

  if (!data.invoices || data.invoices.length === 0) {
    errors.push('Invoice data is required for export');
  }

  // Validate payment data integrity
  if (data.payments) {
    data.payments.forEach((payment, index) => {
      if (!payment.id) {
        errors.push(`Payment at index ${index} is missing ID`);
      }
      if (!payment.transactionId) {
        errors.push(`Payment at index ${index} is missing transaction ID`);
      }
      if (!payment.amount || payment.amount.amount <= 0) {
        errors.push(`Payment at index ${index} has invalid amount`);
      }
      if (!payment.amount.currency) {
        errors.push(`Payment at index ${index} is missing currency`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}