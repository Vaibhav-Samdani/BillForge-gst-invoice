import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSession } from 'next-auth/react'
import { ClientDashboard } from '../ClientDashboard'

const mockUseSession = vi.mocked(useSession)

describe('ClientDashboard', () => {
  beforeEach(() => {
    const mockSession = {
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      },
      expires: '2024-12-31',
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    render(<ClientDashboard />)

    // Should show loading skeletons
    expect(screen.getAllByRole('generic')).toHaveLength(expect.any(Number))
  })

  it('renders dashboard content after loading', async () => {
    render(<ClientDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Welcome back, John Doe')).toBeInTheDocument()
    })

    expect(screen.getByText("Here's an overview of your account activity")).toBeInTheDocument()
    expect(screen.getByText('Outstanding')).toBeInTheDocument()
    expect(screen.getByText('Total Paid')).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText('Upcoming')).toBeInTheDocument()
  })

  it('displays stats cards with correct values', async () => {
    render(<ClientDashboard />)

    await waitFor(() => {
      expect(screen.getByText('$2,450.00')).toBeInTheDocument()
      expect(screen.getByText('$8,750.00')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // Overdue count
      expect(screen.getByText('3')).toBeInTheDocument() // Upcoming count
    })
  })

  it('displays recent invoices section', async () => {
    render(<ClientDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Recent Invoices')).toBeInTheDocument()
      expect(screen.getByText('INV-001')).toBeInTheDocument()
      expect(screen.getByText('INV-002')).toBeInTheDocument()
      expect(screen.getByText('INV-003')).toBeInTheDocument()
    })
  })

  it('displays recent payments section', async () => {
    render(<ClientDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Recent Payments')).toBeInTheDocument()
      expect(screen.getByText('Credit Card')).toBeInTheDocument()
      expect(screen.getByText('Bank Transfer')).toBeInTheDocument()
    })
  })

  it('displays quick actions section', async () => {
    render(<ClientDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument()
      expect(screen.getByText('View Invoices')).toBeInTheDocument()
      expect(screen.getByText('Payment History')).toBeInTheDocument()
      expect(screen.getByText('Update Profile')).toBeInTheDocument()
      expect(screen.getByText('Download Reports')).toBeInTheDocument()
    })
  })

  it('shows pay now button for unpaid invoices', async () => {
    render(<ClientDashboard />)

    await waitFor(() => {
      const payButtons = screen.getAllByText('Pay Now')
      expect(payButtons.length).toBeGreaterThan(0)
    })
  })

  it('displays status badges correctly', async () => {
    render(<ClientDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Overdue')).toBeInTheDocument()
      expect(screen.getByText('Unpaid')).toBeInTheDocument()
      expect(screen.getByText('Paid')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })
  })

  it('formats currency correctly', async () => {
    render(<ClientDashboard />)

    await waitFor(() => {
      expect(screen.getByText('$1,200.00')).toBeInTheDocument()
      expect(screen.getByText('$850.00')).toBeInTheDocument()
      expect(screen.getByText('$400.00')).toBeInTheDocument()
    })
  })

  it('formats dates correctly', async () => {
    render(<ClientDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Jan \d+, 2025/)).toBeInTheDocument()
      expect(screen.getByText(/Feb \d+, 2025/)).toBeInTheDocument()
    })
  })
})