import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentForm from '../PaymentForm';
import { EnhancedInvoice } from '../../lib/types';

// Mock Stripe
const mockStripe = {
  confirmCardPayment: vi.fn(),
};

const mockElements = {
  getElement: vi.fn(),
};

const mockCardElement = {
  mount: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  update: vi.fn(),
};

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardElement: () => <div data-testid="card-element">Card Element</div>,
  useStripe: () => mockStripe,
  useElements: () => mockElements,
}));

vi.mock('../../lib/config/stripe', () => ({
  getStripe: vi.fn(() => Promise.resolve(mockStripe)),
}));

// Mock fetch
global.fetch = vi.fn();

const mockInvoice: EnhancedInvoice = {
  id: 'inv_123',
  invoiceNumber: 'INV-001',
  currency: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
  totals: { total: 100.00, subtotal: 90.00, tax: 10.00 },
  client: { name: 'John Doe', email: 'john@example.com' },
  business: { name: 'Test Business' },
  items: [],
  invoiceDate: '2024-01-01',
  isRecurring: false,
  status: 'sent',
  paymentStatus: 'unpaid',
  createdAt: new Date(),
  updatedAt: new Date(),
  dueDate: new Date(),
  clientId: 'client_123',
};

describe('PaymentForm', () => {
  const mockOnPaymentSuccess = vi.fn();
  const mockOnPaymentError = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockElements.getElement.mockReturnValue(mockCardElement);
    
    // Mock successful payment intent creation
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: 'pi_test123',
        clientSecret: 'pi_test123_secret',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method',
      }),
    });
  });

  it('should render payment form with invoice details', async () => {
    render(
      <PaymentForm
        invoice={mockInvoice}
        clientId="client_123"
        onPaymentSuccess={mockOnPaymentSuccess}
        onPaymentError={mockOnPaymentError}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Payment Details')).toBeInTheDocument();
      expect(screen.getByText('Invoice: INV-001')).toBeInTheDocument();
      expect(screen.getByText('Amount: $100.00')).toBeInTheDocument();
      expect(screen.getByTestId('card-element')).toBeInTheDocument();
    });
  });

  it('should create payment intent on mount', async () => {
    render(
      <PaymentForm
        invoice={mockInvoice}
        clientId="client_123"
        onPaymentSuccess={mockOnPaymentSuccess}
        onPaymentError={mockOnPaymentError}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: 'inv_123',
          clientId: 'client_123',
          amount: {
            amount: 100.00,
            currency: 'USD',
          },
          description: 'Payment for Invoice INV-001',
        }),
      });
    });
  });

  it('should handle successful payment', async () => {
    mockStripe.confirmCardPayment.mockResolvedValue({
      paymentIntent: {
        id: 'pi_test123',
        status: 'succeeded',
      },
    });

    // Mock successful invoice update
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('create-intent')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'pi_test123',
            clientSecret: 'pi_test123_secret',
          }),
        });
      }
      if (url.includes('payment')) {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({ ok: true });
    });

    render(
      <PaymentForm
        invoice={mockInvoice}
        clientId="client_123"
        onPaymentSuccess={mockOnPaymentSuccess}
        onPaymentError={mockOnPaymentError}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pay \$100\.00/i })).toBeInTheDocument();
    });

    const payButton = screen.getByRole('button', { name: /pay \$100\.00/i });
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(mockOnPaymentSuccess).toHaveBeenCalledWith('pi_test123');
    });
  });

  it('should handle payment errors', async () => {
    mockStripe.confirmCardPayment.mockResolvedValue({
      error: {
        message: 'Your card was declined.',
        code: 'card_declined',
        type: 'card_error',
      },
    });

    render(
      <PaymentForm
        invoice={mockInvoice}
        clientId="client_123"
        onPaymentSuccess={mockOnPaymentSuccess}
        onPaymentError={mockOnPaymentError}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pay \$100\.00/i })).toBeInTheDocument();
    });

    const payButton = screen.getByRole('button', { name: /pay \$100\.00/i });
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(mockOnPaymentError).toHaveBeenCalled();
      expect(screen.getByText('Your card was declined.')).toBeInTheDocument();
    });
  });

  it('should show cancel button when onCancel is provided', () => {
    render(
      <PaymentForm
        invoice={mockInvoice}
        clientId="client_123"
        onPaymentSuccess={mockOnPaymentSuccess}
        onPaymentError={mockOnPaymentError}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <PaymentForm
        invoice={mockInvoice}
        clientId="client_123"
        onPaymentSuccess={mockOnPaymentSuccess}
        onPaymentError={mockOnPaymentError}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should disable pay button when card is not complete', async () => {
    render(
      <PaymentForm
        invoice={mockInvoice}
        clientId="client_123"
        onPaymentSuccess={mockOnPaymentSuccess}
        onPaymentError={mockOnPaymentError}
      />
    );

    await waitFor(() => {
      const payButton = screen.getByRole('button', { name: /pay \$100\.00/i });
      expect(payButton).toBeDisabled();
    });
  });

  it('should show processing state during payment', async () => {
    mockStripe.confirmCardPayment.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        paymentIntent: { id: 'pi_test123', status: 'succeeded' }
      }), 100))
    );

    render(
      <PaymentForm
        invoice={mockInvoice}
        clientId="client_123"
        onPaymentSuccess={mockOnPaymentSuccess}
        onPaymentError={mockOnPaymentError}
      />
    );

    // Simulate card being complete
    const payButton = screen.getByRole('button', { name: /pay \$100\.00/i });
    
    // Enable the button by mocking card complete state
    Object.defineProperty(payButton, 'disabled', { value: false, writable: true });
    
    fireEvent.click(payButton);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });
});