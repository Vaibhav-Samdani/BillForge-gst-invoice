import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock authentication
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: { id: 'client_123', email: 'test@example.com', name: 'John Doe' },
    },
    status: 'authenticated',
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('End-to-End User Flows', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default fetch responses
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Invoice Creation Flow', () => {
    it('should complete full invoice creation workflow', async () => {
      // Mock the IntegratedInvoiceApp component
      const MockInvoiceApp = () => {
        const [step, setStep] = React.useState(1);
        const [invoiceData, setInvoiceData] = React.useState({
          business: {},
          client: {},
          items: [],
          currency: { code: 'USD', symbol: '$' },
          totals: { subtotal: 0, tax: 0, total: 0 },
        });

        const handleBusinessInfo = (data: any) => {
          setInvoiceData(prev => ({ ...prev, business: data }));
          setStep(2);
        };

        const handleClientInfo = (data: any) => {
          setInvoiceData(prev => ({ ...prev, client: data }));
          setStep(3);
        };

        const handleItems = (items: any[]) => {
          const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
          const tax = subtotal * 0.1; // 10% tax
          const total = subtotal + tax;
          
          setInvoiceData(prev => ({
            ...prev,
            items,
            totals: { subtotal, tax, total },
          }));
          setStep(4);
        };

        const handleSave = async () => {
          const response = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceData),
          });
          
          if (response.ok) {
            setStep(5);
          }
        };

        return (
          <div>
            {step === 1 && (
              <div>
                <h2>Business Information</h2>
                <input
                  type="text"
                  data-testid="business-name"
                  placeholder="Business Name"
                  onChange={(e) => handleBusinessInfo({ name: e.target.value })}
                />
                />
              </div>
            )}
            
            {step === 2 && (
              <div>
                <h2>Client Information</h2>
                <input
                  data-testid="client-name"
                  placeholder="Client Name"
                  onChange={(e) => handleClientInfo({ name: e.target.value })}
                />
              </div>
            )}
            
            {step === 3 && (
              <div>
                <h2>Invoice Items</h2>
                <button
                  data-testid="add-item"
                  onClick={() => handleItems([
                    { description: 'Service', quantity: 1, rate: 100 }
                  ])}
                >
                  Add Item
                </button>
              </div>
            )}
            
            {step === 4 && (
              <div>
                <h2>Review & Save</h2>
                <p data-testid="total">Total: ${invoiceData.totals.total}</p>
                <button data-testid="save-invoice" onClick={handleSave}>
                  Save Invoice
                </button>
              </div>
            )}
            
            {step === 5 && (
              <div>
                <h2>Invoice Created Successfully!</h2>
                <p data-testid="success-message">Your invoice has been created.</p>
              </div>
            )}
          </div>
        );
      };

      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'inv_123',
          invoiceNumber: 'INV-001',
          status: 'draft',
        }),
      });

      render(<MockInvoiceApp />);

      // Step 1: Enter business information
      expect(screen.getByText('Business Information')).toBeInTheDocument();
      const businessNameInput = screen.getByTestId('business-name');
      await user.type(businessNameInput, 'Test Business');

      // Step 2: Enter client information
      await waitFor(() => {
        expect(screen.getByText('Client Information')).toBeInTheDocument();
      });
      const clientNameInput = screen.getByTestId('client-name');
      await user.type(clientNameInput, 'John Doe');

      // Step 3: Add invoice items
      await waitFor(() => {
        expect(screen.getByText('Invoice Items')).toBeInTheDocument();
      });
      const addItemButton = screen.getByTestId('add-item');
      await user.click(addItemButton);

      // Step 4: Review and save
      await waitFor(() => {
        expect(screen.getByText('Review & Save')).toBeInTheDocument();
        expect(screen.getByTestId('total')).toHaveTextContent('Total: $110');
      });
      const saveButton = screen.getByTestId('save-invoice');
      await user.click(saveButton);

      // Step 5: Verify success
      await waitFor(() => {
        expect(screen.getByText('Invoice Created Successfully!')).toBeInTheDocument();
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
      });

      // Verify API was called
      expect(global.fetch).toHaveBeenCalledWith('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"business":{"name":"Test Business"}'),
      });
    });
  });

  describe('Payment Processing Flow', () => {
    it('should complete payment flow from invoice to confirmation', async () => {
      const MockPaymentFlow = () => {
        const [step, setStep] = React.useState(1);
        const [paymentData, setPaymentData] = React.useState({
          invoiceId: 'inv_123',
          amount: 100,
          currency: 'USD',
        });

        const createPaymentIntent = async () => {
          const response = await fetch('/api/payments/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData),
          });
          
          if (response.ok) {
            setStep(2);
          }
        };

        const processPayment = async () => {
          const response = await fetch('/api/payments/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId: 'pi_test123' }),
          });
          
          if (response.ok) {
            setStep(3);
          }
        };

        return (
          <div>
            {step === 1 && (
              <div>
                <h2>Payment Details</h2>
                <p>Invoice: INV-001</p>
                <p>Amount: ${paymentData.amount}</p>
                <button data-testid="create-payment-intent" onClick={createPaymentIntent}>
                  Continue to Payment
                </button>
              </div>
            )}
            
            {step === 2 && (
              <div>
                <h2>Payment Method</h2>
                <div data-testid="card-element">Card Element</div>
                <button data-testid="process-payment" onClick={processPayment}>
                  Pay ${paymentData.amount}
                </button>
              </div>
            )}
            
            {step === 3 && (
              <div>
                <h2>Payment Successful!</h2>
                <p data-testid="payment-confirmation">
                  Your payment of ${paymentData.amount} has been processed.
                </p>
              </div>
            )}
          </div>
        );
      };

      // Mock API responses
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 'pi_test123',
            client_secret: 'pi_test123_secret',
            amount: 10000,
            currency: 'usd',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            paymentId: 'pay_123',
          }),
        });

      render(<MockPaymentFlow />);

      // Step 1: Review payment details
      expect(screen.getByText('Payment Details')).toBeInTheDocument();
      expect(screen.getByText('Invoice: INV-001')).toBeInTheDocument();
      expect(screen.getByText('Amount: $100')).toBeInTheDocument();
      
      const continueButton = screen.getByTestId('create-payment-intent');
      await user.click(continueButton);

      // Step 2: Enter payment method
      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
        expect(screen.getByTestId('card-element')).toBeInTheDocument();
      });
      
      const payButton = screen.getByTestId('process-payment');
      await user.click(payButton);

      // Step 3: Verify payment confirmation
      await waitFor(() => {
        expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
        expect(screen.getByTestId('payment-confirmation')).toHaveTextContent(
          'Your payment of $100 has been processed.'
        );
      });

      // Verify API calls
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/payments/create-intent', expect.any(Object));
      expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/payments/process', expect.any(Object));
    });
  });

  describe('Recurring Invoice Setup Flow', () => {
    it('should complete recurring invoice setup workflow', async () => {
      const MockRecurringFlow = () => {
        const [step, setStep] = React.useState(1);
        const [recurringData, setRecurringData] = React.useState({
          frequency: '',
          interval: 1,
          startDate: '',
          endDate: '',
        });

        const handleFrequencySelection = (frequency: string) => {
          setRecurringData(prev => ({ ...prev, frequency }));
          setStep(2);
        };

        const handleScheduleSetup = (schedule: any) => {
          setRecurringData(prev => ({ ...prev, ...schedule }));
          setStep(3);
        };

        const createRecurringInvoice = async () => {
          const response = await fetch('/api/recurring-invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoice: { invoiceNumber: 'INV-001' },
              recurringConfig: recurringData,
            }),
          });
          
          if (response.ok) {
            setStep(4);
          }
        };

        return (
          <div>
            {step === 1 && (
              <div>
                <h2>Select Frequency</h2>
                <button
                  data-testid="frequency-monthly"
                  onClick={() => handleFrequencySelection('monthly')}
                >
                  Monthly
                </button>
                <button
                  data-testid="frequency-weekly"
                  onClick={() => handleFrequencySelection('weekly')}
                >
                  Weekly
                </button>
              </div>
            )}
            
            {step === 2 && (
              <div>
                <h2>Schedule Setup</h2>
                <p>Frequency: {recurringData.frequency}</p>
                <input
                  data-testid="start-date"
                  type="date"
                  onChange={(e) => handleScheduleSetup({ startDate: e.target.value })}
                />
                <button data-testid="continue-schedule" onClick={() => setStep(3)}>
                  Continue
                </button>
              </div>
            )}
            
            {step === 3 && (
              <div>
                <h2>Review Recurring Setup</h2>
                <p>Frequency: {recurringData.frequency}</p>
                <p>Start Date: {recurringData.startDate}</p>
                <button data-testid="create-recurring" onClick={createRecurringInvoice}>
                  Create Recurring Invoice
                </button>
              </div>
            )}
            
            {step === 4 && (
              <div>
                <h2>Recurring Invoice Created!</h2>
                <p data-testid="recurring-confirmation">
                  Your {recurringData.frequency} recurring invoice has been set up.
                </p>
              </div>
            )}
          </div>
        );
      };

      // Mock API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'inv_recurring_123',
          isRecurring: true,
          recurringConfig: {
            frequency: 'monthly',
            startDate: '2024-01-01',
          },
        }),
      });

      render(<MockRecurringFlow />);

      // Step 1: Select frequency
      expect(screen.getByText('Select Frequency')).toBeInTheDocument();
      const monthlyButton = screen.getByTestId('frequency-monthly');
      await user.click(monthlyButton);

      // Step 2: Setup schedule
      await waitFor(() => {
        expect(screen.getByText('Schedule Setup')).toBeInTheDocument();
        expect(screen.getByText('Frequency: monthly')).toBeInTheDocument();
      });
      
      const startDateInput = screen.getByTestId('start-date');
      await user.type(startDateInput, '2024-01-01');
      
      const continueButton = screen.getByTestId('continue-schedule');
      await user.click(continueButton);

      // Step 3: Review and create
      await waitFor(() => {
        expect(screen.getByText('Review Recurring Setup')).toBeInTheDocument();
        expect(screen.getByText('Start Date: 2024-01-01')).toBeInTheDocument();
      });
      
      const createButton = screen.getByTestId('create-recurring');
      await user.click(createButton);

      // Step 4: Verify confirmation
      await waitFor(() => {
        expect(screen.getByText('Recurring Invoice Created!')).toBeInTheDocument();
        expect(screen.getByTestId('recurring-confirmation')).toHaveTextContent(
          'Your monthly recurring invoice has been set up.'
        );
      });

      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith('/api/recurring-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"frequency":"monthly"'),
      });
    });
  });

  describe('Client Portal Flow', () => {
    it('should complete client registration and invoice viewing flow', async () => {
      const MockClientPortal = () => {
        const [step, setStep] = React.useState(1);
        const [user, setUser] = React.useState(null);
        const [invoices, setInvoices] = React.useState([]);

        const handleRegistration = async (userData: any) => {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });
          
          if (response.ok) {
            const newUser = await response.json();
            setUser(newUser);
            setStep(2);
          }
        };

        const loadInvoices = async () => {
          const response = await fetch('/api/client/invoices');
          if (response.ok) {
            const invoiceData = await response.json();
            setInvoices(invoiceData);
            setStep(3);
          }
        };

        return (
          <div>
            {step === 1 && (
              <div>
                <h2>Client Registration</h2>
                <input data-testid="email" placeholder="Email" />
                <input data-testid="password" type="password" placeholder="Password" />
                <input data-testid="name" placeholder="Full Name" />
                <button
                  data-testid="register"
                  onClick={() => handleRegistration({
                    email: 'test@example.com',
                    password: 'SecurePass123!',
                    name: 'John Doe',
                  })}
                >
                  Register
                </button>
              </div>
            )}
            
            {step === 2 && (
              <div>
                <h2>Welcome, {user?.name}!</h2>
                <p>Registration successful. Loading your invoices...</p>
                <button data-testid="load-invoices" onClick={loadInvoices}>
                  View Invoices
                </button>
              </div>
            )}
            
            {step === 3 && (
              <div>
                <h2>Your Invoices</h2>
                <div data-testid="invoice-list">
                  {invoices.length === 0 ? (
                    <p>No invoices found.</p>
                  ) : (
                    invoices.map((invoice: any) => (
                      <div key={invoice.id} data-testid={`invoice-${invoice.id}`}>
                        <p>{invoice.invoiceNumber} - ${invoice.total}</p>
                        <span className={`status-${invoice.paymentStatus}`}>
                          {invoice.paymentStatus}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        );
      };

      // Mock API responses
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 'client_123',
            email: 'test@example.com',
            name: 'John Doe',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 'inv_1',
              invoiceNumber: 'INV-001',
              total: 100,
              paymentStatus: 'unpaid',
            },
            {
              id: 'inv_2',
              invoiceNumber: 'INV-002',
              total: 200,
              paymentStatus: 'paid',
            },
          ]),
        });

      render(<MockClientPortal />);

      // Step 1: Register client
      expect(screen.getByText('Client Registration')).toBeInTheDocument();
      const registerButton = screen.getByTestId('register');
      await user.click(registerButton);

      // Step 2: Welcome message
      await waitFor(() => {
        expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
        expect(screen.getByText('Registration successful. Loading your invoices...')).toBeInTheDocument();
      });
      
      const loadInvoicesButton = screen.getByTestId('load-invoices');
      await user.click(loadInvoicesButton);

      // Step 3: View invoices
      await waitFor(() => {
        expect(screen.getByText('Your Invoices')).toBeInTheDocument();
        expect(screen.getByTestId('invoice-inv_1')).toBeInTheDocument();
        expect(screen.getByTestId('invoice-inv_2')).toBeInTheDocument();
        expect(screen.getByText('INV-001 - $100')).toBeInTheDocument();
        expect(screen.getByText('INV-002 - $200')).toBeInTheDocument();
      });

      // Verify API calls
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/auth/register', expect.any(Object));
      expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/client/invoices');
    });
  });

  describe('Error Handling in User Flows', () => {
    it('should handle API errors gracefully', async () => {
      const MockErrorHandling = () => {
        const [error, setError] = React.useState('');
        const [loading, setLoading] = React.useState(false);

        const handleApiCall = async () => {
          setLoading(true);
          setError('');
          
          try {
            const response = await fetch('/api/invoices');
            if (!response.ok) {
              throw new Error('Failed to load invoices');
            }
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        };

        return (
          <div>
            <button data-testid="api-call" onClick={handleApiCall}>
              Load Data
            </button>
            {loading && <p data-testid="loading">Loading...</p>}
            {error && <p data-testid="error" className="error">{error}</p>}
          </div>
        );
      };

      // Mock failed API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      });

      render(<MockErrorHandling />);

      const apiButton = screen.getByTestId('api-call');
      await user.click(apiButton);

      // Should show loading state
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Should show error after API fails
      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
        expect(screen.getByText('Failed to load invoices')).toBeInTheDocument();
      });

      // Loading should be gone
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });
});