"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data types - these would come from the actual API
interface DashboardInvoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: 'paid' | 'unpaid' | 'overdue' | 'draft'
  dueDate: string
  createdAt: string
}

interface DashboardPayment {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  paymentMethod: string
  processedAt: string
  status: 'completed' | 'pending' | 'failed'
}

interface DashboardStats {
  totalOutstanding: number
  totalPaid: number
  overdueCount: number
  upcomingCount: number
  currency: string
}

// Mock data - in real implementation, this would come from API
const mockStats: DashboardStats = {
  totalOutstanding: 2450.00,
  totalPaid: 8750.00,
  overdueCount: 2,
  upcomingCount: 3,
  currency: 'USD'
}

const mockRecentInvoices: DashboardInvoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-001',
    amount: 1200.00,
    currency: 'USD',
    status: 'overdue',
    dueDate: '2025-01-15',
    createdAt: '2025-01-01'
  },
  {
    id: '2',
    invoiceNumber: 'INV-002',
    amount: 850.00,
    currency: 'USD',
    status: 'unpaid',
    dueDate: '2025-02-01',
    createdAt: '2025-01-15'
  },
  {
    id: '3',
    invoiceNumber: 'INV-003',
    amount: 400.00,
    currency: 'USD',
    status: 'paid',
    dueDate: '2025-01-20',
    createdAt: '2025-01-10'
  }
]

const mockRecentPayments: DashboardPayment[] = [
  {
    id: '1',
    invoiceNumber: 'INV-003',
    amount: 400.00,
    currency: 'USD',
    paymentMethod: 'Credit Card',
    processedAt: '2025-01-18',
    status: 'completed'
  },
  {
    id: '2',
    invoiceNumber: 'INV-004',
    amount: 650.00,
    currency: 'USD',
    paymentMethod: 'Bank Transfer',
    processedAt: '2025-01-16',
    status: 'completed'
  }
]

export function ClientDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>(mockStats)
  const [recentInvoices, setRecentInvoices] = useState<DashboardInvoice[]>(mockRecentInvoices)
  const [recentPayments, setRecentPayments] = useState<DashboardPayment[]>(mockRecentPayments)
  const [isLoading, setIsLoading] = useState(false)

  // In real implementation, fetch data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        // TODO: Replace with actual API calls
        // const [statsRes, invoicesRes, paymentsRes] = await Promise.all([
        //   fetch('/api/client/dashboard/stats'),
        //   fetch('/api/client/invoices?limit=5'),
        //   fetch('/api/client/payments?limit=5')
        // ])
        
        // For now, using mock data
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API delay
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchDashboardData()
    }
  }, [session])

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'default',
      unpaid: 'secondary',
      overdue: 'destructive',
      draft: 'outline',
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive'
    } as const

    const colors = {
      paid: 'text-green-700 bg-green-100',
      unpaid: 'text-yellow-700 bg-yellow-100',
      overdue: 'text-red-700 bg-red-100',
      draft: 'text-gray-700 bg-gray-100',
      completed: 'text-green-700 bg-green-100',
      pending: 'text-yellow-700 bg-yellow-100',
      failed: 'text-red-700 bg-red-100'
    } as const

    return (
      <Badge 
        variant={variants[status as keyof typeof variants] || 'outline'}
        className={colors[status as keyof typeof colors]}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Welcome Section Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="hidden sm:block">
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Welcome back, {session?.user?.name}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Here's an overview of your account activity
            </p>
          </div>
          <div className="flex space-x-2">
            <Button asChild size="sm" className="sm:hidden">
              <Link href="/client/invoices">
                <FileText className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="hidden sm:flex">
              <Link href="/client/invoices">
                <FileText className="h-4 w-4 mr-2" />
                View All Invoices
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Outstanding</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600 truncate">
                  {formatCurrency(stats.totalOutstanding, stats.currency)}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-red-100 rounded-full flex-shrink-0 ml-2">
                <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Paid</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                  {formatCurrency(stats.totalPaid, stats.currency)}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-full flex-shrink-0 ml-2">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Overdue</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">
                  {stats.overdueCount}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-red-100 rounded-full flex-shrink-0 ml-2">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Upcoming</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">
                  {stats.upcomingCount}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0 ml-2">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Recent Invoices
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/client/invoices">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 truncate">
                        {invoice.invoiceNumber}
                      </p>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Due: {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right sm:ml-4">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </p>
                    {invoice.status === 'unpaid' && (
                      <Button size="sm" className="mt-0 sm:mt-1">
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {recentInvoices.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No recent invoices
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Recent Payments
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/client/payments">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 truncate">
                        {payment.invoiceNumber}
                      </p>
                      {getStatusBadge(payment.status)}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {payment.paymentMethod} • {formatDate(payment.processedAt)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right sm:ml-4">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                  </div>
                </div>
              ))}
              {recentPayments.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No recent payments
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Button variant="outline" className="h-auto p-3 sm:p-4" asChild>
              <Link href="/client/invoices" className="flex flex-col items-center space-y-1 sm:space-y-2">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs sm:text-sm text-center">View Invoices</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-3 sm:p-4" asChild>
              <Link href="/client/payments" className="flex flex-col items-center space-y-1 sm:space-y-2">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs sm:text-sm text-center">Payment History</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-3 sm:p-4" asChild>
              <Link href="/client/profile" className="flex flex-col items-center space-y-1 sm:space-y-2">
                <User className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs sm:text-sm text-center">Update Profile</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-3 sm:p-4">
              <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                <Download className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs sm:text-sm text-center">Download Reports</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}