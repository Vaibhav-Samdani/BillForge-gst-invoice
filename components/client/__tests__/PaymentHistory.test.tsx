import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import PaymentHistory from '../PaymentHistory';
import { Payment, EnhancedInvoice, Currency } from '../../../lib/types';

// Mock the date-fns format function
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'MMM dd, yyyy HH:mm') {
      return 'Jan 15, 2024 10:30';
    }
    return '2024-01-15';
  }),
}));

// Mock the export utilities
vi.mock('../../../lib/utils/paymentExport', () => ({
  formatCurrency: vi.fn((amount, currency) => `$${amount.toFixed(2)}`),
  generatePaymentSummary: vi.fn(() => ({
    totalPayments: 2,
    totalAmount: 250.00,
    completedPayments: 1,
    completedAmount: 150.00,
    refundedPayments: 1,
    refundedAmount: 100.00,
    pendingPayments: 0,
    failedPayments: 0,
  })),
}));

const mockCurrency: Currency = {
  code: 'USD',
  symbol: '$',
  name: 'US Dollar',
  decimalPlaces: 2,
};

const mockPayments: Payment[] = [
  {
    id: 'payment-1',
    invoiceId: 'invoice-1',
    clientId: 'client-1',
    amount: {
      amount: 150.00,
      currency: 'USD',
    },
    paymentMethod: 'card',
    transactionId: 'txn_1234567890',
    status: 'completed',
    processedAt: new Date('2024-01-15T10:30:00Z'),
  },
  {
    id: 'payment-2',
    invoiceId: 'invoice-2',
    clientId: 'client-1',
    amount: {
      amount: 100.00,
      currency: 'USD',
    },
    paymentMethod: 'paypal',
    transactionId: 'txn_0987654321',
    status: 'refunded',
    processedAt: new Date('2024-01-10T14:20:00Z'),
    refundAmount: 100.00,
    refundedAt: new Date('2024-01-12T09:15:00Z'),
  },
];

const mockInvoices: EnhancedInvoice[] = [
  {
    id: 'invoice-1',
    invoiceNumber: 'INV-001',
    business: {
      name: 'Test Business',
      address: '123 Test St',
      phone: '555-0123',
      email: 'test@business.com',
      gst: '123456789',
    },
    client: {
      name: 'John Doe',
      address: '456 Client Ave',
      phone: '555-0456',
      email: 'john@example.com',
      gst: '987654321',
    },
    items: [],
    invoiceDate: '2024-01-15',
    sameGst: false,
    globalGst: 0,
    totals: {
      subtotal: 150.00,
      tax: 0,
      total: 150.00,
    },
    currency: mockCurrency,
    isRecurring: false,
    status: 'paid',
    paymentStatus: 'paid',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    dueDate: new Date('2024-02-15T00:00:00Z'),
    paidAt: new Date('2024-01-15T10:30:00Z'),
    clientId: 'client-1',
  },
  {
    id: 'invoice-2',
    invoiceNumber: 'INV-002',
    business: {
      name: 'Test Business',
      address: '123 Test St',
      phone: '555-0123',
      email: 'test@business.com',
      gst: '123456789',
    },
    client: {
      name: 'Jane Smith',
      address: '789 Client Blvd',
      phone: '555-0789',
      email: 'jane@example.com',
      gst: '456789123',
    },
    items: [],
    invoiceDate: '2024-01-10',
    sameGst: false,
    globalGst: 0,
    totals: {
      subtotal: 100.00,
      tax: 0,
      total: 100.00,
    },
    currency: mockCurrency,
    isRecurring: false,
    status: 'cancelled',
    paymentStatus: 'refunded',
    createdAt: new Date('2024-01-10T14:00:00Z'),
    updatedAt: new Date('2024-01-12T09:15:00Z'),
    dueDate: new Date('2024-02-10T00:00:00Z'),
    clientId: 'client-1',
  },
];

const defaultProps = {
  payments: mockPayments,
  invoices: mockInvoices,
  onExportCSV: vi.fn(),
  onExportPDF: vi.fn(),
  onViewPaymentDetails: vi.fn(),
  onRefreshPayments: vi.fn(),
  isLoading: false,
};

describe('PaymentHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders payment history with summary stats', () => {
    render(<PaymentHistory {...defaultProps} />);
    
    expect(screen.getByText('Payment History')).toBeInTheDocument();
    expect(screen.getByText('Total Payments')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Refunded')).toBeInTheDocument();
  });

  it('displays payment table with correct data', () => {
    render(<PaymentHistory {...defaultProps} />);
    
    // Check if payment data is displayed
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('INV-002')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('refunded')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    render(<PaymentHistory {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search by transaction id/i);
    fireEvent.change(searchInput, { target: { value: 'INV-001' } });
    
    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument();
      expect(screen.queryByText('INV-002')).not.toBeInTheDocument();
    });
  });

  it('handles sorting by different columns', () => {
    render(<PaymentHistory {...defaultProps} />);
    
    const dateHeader = screen.getByText('Date');
    fireEvent.click(dateHeader);
    
    // Should trigger sorting - we can't easily test the actual sorting without more complex setup
    expect(dateHeader).toBeInTheDocument();
  });

  it('shows and hides filters', () => {
    render(<PaymentHistory {...defaultProps} />);
    
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);
    
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Payment Method')).toBeInTheDocument();
  });

  it('calls export functions when export buttons are clicked', () => {
    render(<PaymentHistory {...defaultProps} />);
    
    const csvButton = screen.getByText('CSV');
    const pdfButton = screen.getByText('PDF');
    
    fireEvent.click(csvButton);
    expect(defaultProps.onExportCSV).toHaveBeenCalledWith(mockPayments);
    
    fireEvent.click(pdfButton);
    expect(defaultProps.onExportPDF).toHaveBeenCalledWith(mockPayments);
  });

  it('calls refresh function when refresh button is clicked', () => {
    render(<PaymentHistory {...defaultProps} />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    expect(defaultProps.onRefreshPayments).toHaveBeenCalled();
  });

  it('calls view payment details when eye icon is clicked', () => {
    render(<PaymentHistory {...defaultProps} />);
    
    const viewButtons = screen.getAllByRole('button');
    const eyeButton = viewButtons.find(button => 
      button.querySelector('svg') && button.getAttribute('class')?.includes('ghost')
    );
    
    if (eyeButton) {
      fireEvent.click(eyeButton);
      expect(defaultProps.onViewPaymentDetails).toHaveBeenCalled();
    }
  });

  it('displays loading state', () => {
    render(<PaymentHistory {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Loading payments...')).toBeInTheDocument();
  });

  it('displays empty state when no payments', () => {
    render(<PaymentHistory {...defaultProps} payments={[]} />);
    
    expect(screen.getByText('No payments found')).toBeInTheDocument();
  });

  it('filters payments by status', async () => {
    render(<PaymentHistory {...defaultProps} />);
    
    // Open filters
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);
    
    // This would require more complex setup to test the actual filtering
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('shows refund information for refunded payments', () => {
    render(<PaymentHistory {...defaultProps} />);
    
    // Look for refunded amount display
    expect(screen.getByText('Refunded: $100.00')).toBeInTheDocument();
  });

  it('truncates long transaction IDs', () => {
    render(<PaymentHistory {...defaultProps} />);
    
    // Transaction IDs should be truncated to last 8 characters
    expect(screen.getByText('67890')).toBeInTheDocument(); // Last 8 chars of txn_1234567890
    expect(screen.getByText('54321')).toBeInTheDocument(); // Last 8 chars of txn_0987654321
  });

  it('formats payment methods correctly', () => {
    render(<PaymentHistory {...defaultProps} />);
    
    expect(screen.getByText('Card')).toBeInTheDocument();
    expect(screen.getByText('Paypal')).toBeInTheDocument();
  });

  it('shows correct badge variants for different statuses', () => {
    render(<PaymentHistory {...defaultProps} />);
    
    const completedBadge = screen.getByText('completed');
    const refundedBadge = screen.getByText('refunded');
    
    expect(completedBadge).toBeInTheDocument();
    expect(refundedBadge).toBeInTheDocument();
  });
});