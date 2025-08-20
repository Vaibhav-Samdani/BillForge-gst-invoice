import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { InvoiceDetailView } from '../InvoiceDetailView'

// Mock fetch
global.fetch = jest.fn()

const mockDetailedInvoice = {
  id: '1',
  invoiceNumber: 'INV-001',
  status: 'sent',
  paymentStatus: 'overdue',
  invoiceDate: '2025-01-01',
  dueDate: '2025-01-15',
  createdAt: '2025-01-01',
  currency: 'USD',
  subtotal: 1000.00,
  taxAmount: 200.00,
  totalAmount: 1200.00,
  amountDue: 1200.00,
  business: {
    name: 'Acme Corp',
    email: 'billing@acmecorp.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business St, Suite 100\nNew York, NY 10001',
    taxId: 'TAX123456789',
    website: 'www.acmecorp.com'
  },
  client: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 987-6543',
    address: '456 Client Ave\nLos Angeles, CA 90210',
    company: 'Client Company Inc.'
  },
  items: [
    {
      id: '1',
      description: 'Web Development Services',
      quantity: 40,
      rate: 20.00,
      amount: 800.00,
      taxRate: 20,
      taxAmount: 160.00
    },
    {
      id: '2',
      description: 'UI/UX Design',
      quantity: 10,
      rate: 20.00,
      amount: 200.00,
      taxRate: 20,
      taxAmount: 40.00
    }
  ],
  notes: 'Thank you for your business!',
  terms: 'Payment terms: Net 15 days.',
  paymentInstructions: 'Please pay via the online portal.'
}

const mockProps = {
  invoiceId: '1',
  onBack: jest.fn(),
  onDownloadPDF: jest.fn(),
  onPayInvoice: jest.fn()
}

describe('InvoiceDetailView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        invoice: mockDetailedInvoice
      })
    })
  })

  it('renders invoice details correctly', async () => {
    render(<InvoiceDetailView {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument()
    })

    // Check invoice information
    expect(screen.getByText('Invoice Information')).toBeInTheDocument()
    expect(screen.getByText('January 1, 2025')).toBeInTheDocument()
    expect(screen.getByText('January 15, 2025')).toBeInTheDocument()
    expect(screen.getByText('$1,200.00')).toBeInTheDocument()

    // Check business information
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('billing@acmecorp.com')).toBeInTheDocument()

    // Check client information
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Client Company Inc.')).toBeInTheDocument()
  })

  it('displays line items correctly', async () => {
    render(<InvoiceDetailView {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('Items & Services')).toBeInTheDocument()
    })

    expect(screen.getByText('Web Development Services')).toBeInTheDocument()
    expect(screen.getByText('UI/UX Design')).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument() // quantity
    expect(screen.getByText('10')).toBeInTheDocument() // quantity
  })

  it('shows overdue status for overdue invoices', async () => {
    render(<InvoiceDetailView {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('Overdue')).toBeInTheDocument()
    })
  })

  it('calls onBack when back button is clicked', async () => {
    render(<InvoiceDetailView {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Back'))
    expect(mockProps.onBack).toHaveBeenCalled()
  })

  it('calls onDownloadPDF when download button is clicked', async () => {
    render(<InvoiceDetailView {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('Download PDF')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Download PDF'))
    expect(mockProps.onDownloadPDF).toHaveBeenCalledWith('1')
  })

  it('calls onPayInvoice when pay now button is clicked', async () => {
    render(<InvoiceDetailView {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('Pay Now')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Pay Now'))
    expect(mockProps.onPayInvoice).toHaveBeenCalledWith('1')
  })

  it('displays additional information when available', async () => {
    render(<InvoiceDetailView {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('Additional Information')).toBeInTheDocument()
    })

    expect(screen.getByText('Notes')).toBeInTheDocument()
    expect(screen.getByText('Thank you for your business!')).toBeInTheDocument()
    expect(screen.getByText('Terms & Conditions')).toBeInTheDocument()
    expect(screen.getByText('Payment terms: Net 15 days.')).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new Error('API Error'))

    render(<InvoiceDetailView {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('Error Loading Invoice')).toBeInTheDocument()
    })

    expect(screen.getByText('API Error')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<InvoiceDetailView {...mockProps} />)

    // Should show loading skeletons
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('handles 404 errors when invoice not found', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Invoice not found' })
    })

    render(<InvoiceDetailView {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('Error Loading Invoice')).toBeInTheDocument()
    })
  })
})