import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClientInvoiceList } from '../ClientInvoiceList'

// Mock fetch
global.fetch = jest.fn()

const mockInvoices = [
  {
    id: '1',
    invoiceNumber: 'INV-001',
    amount: 1200.00,
    currency: 'USD',
    status: 'sent',
    paymentStatus: 'overdue',
    invoiceDate: '2025-01-01',
    dueDate: '2025-01-15',
    createdAt: '2025-01-01',
    businessName: 'Acme Corp',
    description: 'Web development services'
  },
  {
    id: '2',
    invoiceNumber: 'INV-002',
    amount: 850.00,
    currency: 'USD',
    status: 'sent',
    paymentStatus: 'unpaid',
    invoiceDate: '2025-01-15',
    dueDate: '2025-02-01',
    createdAt: '2025-01-15',
    businessName: 'Acme Corp',
    description: 'Consulting services'
  }
]

const mockProps = {
  onViewInvoice: jest.fn(),
  onDownloadPDF: jest.fn(),
  onPayInvoice: jest.fn()
}

describe('ClientInvoiceList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        invoices: mockInvoices,
        pagination: {
          page: 1,
          limit: 50,
          totalCount: 2,
          totalPages: 1
        }
      })
    })
  })

  it('renders invoice list with correct data', async () => {
    render(<ClientInvoiceList {...mockProps} />)

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Your Invoices')).toBeInTheDocument()
    })

    // Check if invoices are displayed
    expect(screen.getByText('INV-001')).toBeInTheDocument()
    expect(screen.getByText('INV-002')).toBeInTheDocument()
    expect(screen.getByText('$1,200.00')).toBeInTheDocument()
    expect(screen.getByText('$850.00')).toBeInTheDocument()
  })

  it('displays overdue badge for overdue invoices', async () => {
    render(<ClientInvoiceList {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('Overdue')).toBeInTheDocument()
    })
  })

  it('calls onViewInvoice when view button is clicked', async () => {
    render(<ClientInvoiceList {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument()
    })

    const viewButtons = screen.getAllByText('View')
    fireEvent.click(viewButtons[0])

    expect(mockProps.onViewInvoice).toHaveBeenCalledWith('1')
  })

  it('calls onDownloadPDF when PDF button is clicked', async () => {
    render(<ClientInvoiceList {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument()
    })

    const pdfButtons = screen.getAllByText('PDF')
    fireEvent.click(pdfButtons[0])

    expect(mockProps.onDownloadPDF).toHaveBeenCalledWith('1')
  })

  it('calls onPayInvoice when pay now button is clicked', async () => {
    render(<ClientInvoiceList {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('INV-002')).toBeInTheDocument()
    })

    const payButtons = screen.getAllByText('Pay Now')
    fireEvent.click(payButtons[0])

    expect(mockProps.onPayInvoice).toHaveBeenCalledWith('2')
  })

  it('filters invoices by search term', async () => {
    render(<ClientInvoiceList {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search invoices...')
    fireEvent.change(searchInput, { target: { value: 'INV-001' } })

    // Should show only INV-001
    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument()
      expect(screen.queryByText('INV-002')).not.toBeInTheDocument()
    })
  })

  it('sorts invoices by different fields', async () => {
    render(<ClientInvoiceList {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument()
    })

    const amountSortButton = screen.getByText('Amount')
    fireEvent.click(amountSortButton)

    // Should trigger re-fetch with new sort parameters
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('sortBy=amount')
    )
  })

  it('shows empty state when no invoices found', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        invoices: [],
        pagination: {
          page: 1,
          limit: 50,
          totalCount: 0,
          totalPages: 0
        }
      })
    })

    render(<ClientInvoiceList {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('No invoices found')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new Error('API Error'))

    render(<ClientInvoiceList {...mockProps} />)

    // Should fall back to mock data
    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument()
    })
  })
})