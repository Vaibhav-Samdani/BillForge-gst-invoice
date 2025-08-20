import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ClientPortalLayout } from '../ClientPortalLayout'

const mockUseSession = vi.mocked(useSession)
const mockSignOut = vi.mocked(signOut)
const mockUseRouter = vi.mocked(useRouter)
const mockPush = vi.fn()

describe('ClientPortalLayout', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    } as any)

    mockSignOut.mockResolvedValue(undefined as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
    })

    render(
      <ClientPortalLayout>
        <div>Test Content</div>
      </ClientPortalLayout>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('redirects to signin when no session', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })

    render(
      <ClientPortalLayout>
        <div>Test Content</div>
      </ClientPortalLayout>
    )

    expect(mockPush).toHaveBeenCalledWith('/auth/signin')
  })

  it('renders layout with navigation when authenticated', () => {
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

    render(
      <ClientPortalLayout currentPage="dashboard">
        <div>Test Content</div>
      </ClientPortalLayout>
    )

    expect(screen.getByText('Client Portal')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Invoices')).toBeInTheDocument()
    expect(screen.getByText('Payments')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('handles mobile menu toggle', () => {
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

    render(
      <ClientPortalLayout>
        <div>Test Content</div>
      </ClientPortalLayout>
    )

    // Click mobile menu button to open
    const menuButtons = screen.getAllByRole('button')
    const menuButton = menuButtons.find(button => 
      button.querySelector('svg') && 
      (button.querySelector('svg')?.getAttribute('class')?.includes('h-6') || 
       button.querySelector('svg')?.getAttribute('class')?.includes('h-5'))
    )
    
    if (menuButton) {
      fireEvent.click(menuButton)
    }

    // Should show mobile navigation items
    expect(screen.getAllByText('Dashboard')).toHaveLength(2) // Desktop + mobile
  })

  it('handles sign out', async () => {
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

    render(
      <ClientPortalLayout>
        <div>Test Content</div>
      </ClientPortalLayout>
    )

    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(signOutButton)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({
        callbackUrl: '/auth/signin',
        redirect: true,
      })
    })
  })

  it('highlights active navigation item', () => {
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

    render(
      <ClientPortalLayout currentPage="invoices">
        <div>Test Content</div>
      </ClientPortalLayout>
    )

    const invoicesLink = screen.getByRole('link', { name: /invoices/i })
    expect(invoicesLink).toHaveClass('bg-blue-100', 'text-blue-700')
  })
})