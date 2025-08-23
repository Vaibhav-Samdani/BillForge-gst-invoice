"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Download, 
  Eye, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  SortAsc,
  SortDesc
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types for invoice data
interface ClientInvoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded'
  invoiceDate: string
  dueDate: string
  createdAt: string
  businessName: string
  description?: string
}

interface InvoiceFilters {
  status: string[]
  paymentStatus: string[]
  dateRange: {
    start: string
    end: string
  } | null
  searchTerm: string
}

interface SortConfig {
  field: 'invoiceDate' | 'dueDate' | 'amount' | 'status' | 'invoiceNumber'
  direction: 'asc' | 'desc'
}

interface ClientInvoiceListProps {
  onViewInvoice: (invoiceId: string) => void
  onDownloadPDF: (invoiceId: string) => void
  onPayInvoice?: (invoiceId: string) => void
}

// Mock data - in real implementation, this would come from API
const mockInvoices: ClientInvoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-001',
    amount: 1200.00,
    currency: 'USD',
    status: 'sent',
    paymentStatus: 'unpaid',
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
  },
  {
    id: '3',
    invoiceNumber: 'INV-003',
    amount: 400.00,
    currency: 'USD',
    status: 'sent',
    paymentStatus: 'paid',
    invoiceDate: '2025-01-10',
    dueDate: '2025-01-20',
    createdAt: '2025-01-10',
    businessName: 'Acme Corp',
    description: 'Design services'
  },
  {
    id: '4',
    invoiceNumber: 'INV-004',
    amount: 2100.00,
    currency: 'EUR',
    status: 'sent',
    paymentStatus: 'unpaid',
    invoiceDate: '2025-01-20',
    dueDate: '2025-02-10',
    createdAt: '2025-01-20',
    businessName: 'Acme Corp',
    description: 'Software development'
  }
]

export function ClientInvoiceList({ onViewInvoice, onDownloadPDF, onPayInvoice }: ClientInvoiceListProps) {
  const [invoices, setInvoices] = useState<ClientInvoice[]>(mockInvoices)
  const [filteredInvoices, setFilteredInvoices] = useState<ClientInvoice[]>(mockInvoices)
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: [],
    paymentStatus: [],
    dateRange: null,
    searchTerm: ''
  })
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'invoiceDate',
    direction: 'desc'
  })

  // Load invoices from API
  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '50', // Load more invoices for better UX
          sortBy: sortConfig.field,
          sortOrder: sortConfig.direction
        })

        const response = await fetch(`/api/client/invoices?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch invoices')
        }
        
        const data = await response.json()
        setInvoices(data.invoices || [])
      } catch (error) {
        console.error('Failed to fetch invoices:', error)
        // Fallback to mock data for development
        setInvoices(mockInvoices)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoices()
  }, [sortConfig])

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...invoices]

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.businessName.toLowerCase().includes(searchLower) ||
        invoice.description?.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filters
    if (filters.status.length > 0) {
      filtered = filtered.filter(invoice => filters.status.includes(invoice.status))
    }

    if (filters.paymentStatus.length > 0) {
      filtered = filtered.filter(invoice => filters.paymentStatus.includes(invoice.paymentStatus))
    }

    // Apply date range filter
    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.start)
      const endDate = new Date(filters.dateRange.end)
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.invoiceDate)
        return invoiceDate >= startDate && invoiceDate <= endDate
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortConfig.field]
      let bValue: any = b[sortConfig.field]

      if (sortConfig.field === 'invoiceDate' || sortConfig.field === 'dueDate') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    setFilteredInvoices(filtered)
  }, [invoices, filters, sortConfig])

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

  const getStatusBadge = (status: string, paymentStatus?: string) => {
    // Determine the effective status for display
    let effectiveStatus = status
    if (status === 'sent' && paymentStatus === 'overdue') {
      effectiveStatus = 'overdue'
    } else if (status === 'sent' && paymentStatus === 'paid') {
      effectiveStatus = 'paid'
    } else if (status === 'sent' && paymentStatus === 'unpaid') {
      effectiveStatus = 'unpaid'
    }

    const statusConfig = {
      draft: { variant: 'outline' as const, className: 'text-gray-700 bg-gray-100', icon: FileText },
      sent: { variant: 'secondary' as const, className: 'text-blue-700 bg-blue-100', icon: FileText },
      unpaid: { variant: 'secondary' as const, className: 'text-yellow-700 bg-yellow-100', icon: Clock },
      paid: { variant: 'default' as const, className: 'text-green-700 bg-green-100', icon: CheckCircle },
      overdue: { variant: 'destructive' as const, className: 'text-red-700 bg-red-100', icon: AlertCircle },
      cancelled: { variant: 'outline' as const, className: 'text-gray-700 bg-gray-100', icon: FileText }
    }

    const config = statusConfig[effectiveStatus as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
      </Badge>
    )
  }

  const isOverdue = (invoice: ClientInvoice) => {
    const today = new Date()
    const dueDate = new Date(invoice.dueDate)
    return dueDate < today && invoice.paymentStatus !== 'paid'
  }

  const handleSort = (field: SortConfig['field']) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const clearFilters = () => {
    setFilters({
      status: [],
      paymentStatus: [],
      dateRange: null,
      searchTerm: ''
    })
  }

  const getSortIcon = (field: SortConfig['field']) => {
    if (sortConfig.field !== field) return null
    return sortConfig.direction === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        
        {/* Filters skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        {/* Invoice list skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-40"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Invoices</h2>
          <p className="text-gray-600">
            {filteredInvoices.length} of {invoices.length} invoices
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="sm:w-auto"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search invoices..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="pl-10"
          />
        </div>
        <Select
          value={filters.paymentStatus[0] || 'all'}
          onValueChange={(value) => 
            setFilters(prev => ({ 
              ...prev, 
              paymentStatus: value === 'all' ? [] : [value] 
            }))
          }
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Status
                </label>
                <Select
                  value={filters.status[0] || 'all'}
                  onValueChange={(value) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      status: value === 'all' ? [] : [value] 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <Input
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { 
                        start: e.target.value, 
                        end: prev.dateRange?.end || '' 
                      } 
                    }))
                  }
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <Input
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { 
                        start: prev.dateRange?.start || '', 
                        end: e.target.value 
                      } 
                    }))
                  }
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sorting Controls */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-600 self-center">Sort by:</span>
        {[
          { field: 'invoiceDate' as const, label: 'Invoice Date' },
          { field: 'dueDate' as const, label: 'Due Date' },
          { field: 'amount' as const, label: 'Amount' },
          { field: 'invoiceNumber' as const, label: 'Invoice #' }
        ].map(({ field, label }) => (
          <Button
            key={field}
            variant={sortConfig.field === field ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort(field)}
            className="flex items-center gap-1"
          >
            {label}
            {getSortIcon(field)}
          </Button>
        ))}
      </div>

      {/* Invoice List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-600">
                {filters.searchTerm || filters.status.length > 0 || filters.paymentStatus.length > 0
                  ? "Try adjusting your filters to see more results."
                  : "You don't have any invoices yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <Card 
              key={invoice.id} 
              className={cn(
                "transition-all hover:shadow-md",
                isOverdue(invoice) && "border-red-200 bg-red-50/50"
              )}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {invoice.invoiceNumber}
                      </h3>
                      {getStatusBadge(invoice.status, invoice.paymentStatus)}
                      {isOverdue(invoice) && (
                        <Badge variant="destructive" className="text-red-700 bg-red-100">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Overdue
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Due: {formatDate(invoice.dueDate)}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        <span className="font-medium">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </span>
                      </div>
                    </div>
                    
                    {invoice.description && (
                      <p className="text-sm text-gray-600 mt-2 truncate">
                        {invoice.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewInvoice(invoice.id)}
                      >
                        <Eye className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownloadPDF(invoice.id)}
                      >
                        <Download className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">PDF</span>
                      </Button>
                    </div>
                    
                    {invoice.paymentStatus === 'unpaid' && onPayInvoice && (
                      <Button
                        size="sm"
                        onClick={() => onPayInvoice(invoice.id)}
                        className="w-full sm:w-auto mt-2 sm:mt-1"
                      >
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More / Pagination could go here */}
      {filteredInvoices.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </p>
        </div>
      )}
    </div>
  )
}