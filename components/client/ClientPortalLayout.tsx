"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  CreditCard, 
  User, 
  LogOut, 
  Menu, 
  X,
  Home,
  Clock,
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ClientPortalLayoutProps {
  children: React.ReactNode
  currentPage?: 'dashboard' | 'invoices' | 'payments' | 'profile'
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  key: string
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/client',
    icon: Home,
    key: 'dashboard'
  },
  {
    name: 'Invoices',
    href: '/client/invoices',
    icon: FileText,
    key: 'invoices'
  },
  {
    name: 'Payments',
    href: '/client/payments',
    icon: CreditCard,
    key: 'payments'
  },
  {
    name: 'Profile',
    href: '/client/profile',
    icon: User,
    key: 'profile'
  }
]

export function ClientPortalLayout({ children, currentPage = 'dashboard' }: ClientPortalLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  const [warningTimeout, setWarningTimeout] = useState<NodeJS.Timeout | null>(null)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Session timeout handling (24 hours)
  useEffect(() => {
    if (session) {
      // Clear existing timeouts
      if (sessionTimeout) {
        clearTimeout(sessionTimeout)
      }
      if (warningTimeout) {
        clearTimeout(warningTimeout)
      }

      // Set warning timeout (23 hours 55 minutes)
      const warningTime = setTimeout(() => {
        setShowTimeoutWarning(true)
      }, 23 * 60 * 60 * 1000 + 55 * 60 * 1000) // 23 hours 55 minutes

      // Set session timeout (24 hours)
      const sessionTime = setTimeout(() => {
        handleSignOut()
      }, 24 * 60 * 60 * 1000) // 24 hours in milliseconds

      setWarningTimeout(warningTime)
      setSessionTimeout(sessionTime)
    }

    return () => {
      if (sessionTimeout) {
        clearTimeout(sessionTimeout)
      }
      if (warningTimeout) {
        clearTimeout(warningTimeout)
      }
    }
  }, [session, sessionTimeout, warningTimeout])

  // Reset session timeout on user activity
  useEffect(() => {
    const resetTimeout = () => {
      if (session) {
        // Clear existing timeouts
        if (sessionTimeout) {
          clearTimeout(sessionTimeout)
        }
        if (warningTimeout) {
          clearTimeout(warningTimeout)
        }

        // Hide warning if shown
        setShowTimeoutWarning(false)

        // Set new timeouts
        const warningTime = setTimeout(() => {
          setShowTimeoutWarning(true)
        }, 23 * 60 * 60 * 1000 + 55 * 60 * 1000) // 23 hours 55 minutes

        const sessionTime = setTimeout(() => {
          handleSignOut()
        }, 24 * 60 * 60 * 1000)

        setWarningTimeout(warningTime)
        setSessionTimeout(sessionTime)
      }
    }

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true)
      })
    }
  }, [session, sessionTimeout, warningTimeout])

  const handleSignOut = async () => {
    try {
      // Clear timeouts before signing out
      if (sessionTimeout) {
        clearTimeout(sessionTimeout)
      }
      if (warningTimeout) {
        clearTimeout(warningTimeout)
      }
      
      await signOut({ 
        callbackUrl: '/auth/signin',
        redirect: true 
      })
    } catch (error) {
      console.error('Sign out error:', error)
      // Force redirect if signOut fails
      router.push('/auth/signin')
    }
  }

  const extendSession = () => {
    setShowTimeoutWarning(false)
    // Trigger timeout reset by simulating user activity
    document.dispatchEvent(new Event('mousedown'))
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Mobile Menu Button */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              <div className="ml-2 md:ml-0">
                <h1 className="text-xl font-semibold text-gray-900">
                  Client Portal
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.key
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* User Info and Sign Out */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500">
                  {session.user.email}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.key
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
            <Separator />
            <div className="px-4 py-3">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-900">
                    {session.user.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {session.user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Session Timeout Warning */}
      {showTimeoutWarning && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="space-y-2">
                <p className="text-sm font-medium">Session Expiring Soon</p>
                <p className="text-xs">Your session will expire in 5 minutes due to inactivity.</p>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={extendSession}
                    className="text-xs h-7"
                  >
                    Stay Logged In
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleSignOut}
                    className="text-xs h-7"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}