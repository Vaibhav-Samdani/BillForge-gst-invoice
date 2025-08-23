"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  Download, 
  CreditCard,
  Calendar,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Printer
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types for detailed invoice data
interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
  taxRate?: number
  taxAmount?: number
}

interface BusinessInfo {
  name: string
  email: string
  phone?: string
  address?: string
  taxId?: string
  website?: string
}

interface ClientInfo {
  name: string
  email: string
  phone?: string
  address?: string
  company?: string
}

interface DetailedInvoice {
  id: string
  invoiceNumber: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded'
  invoiceDate: string
  dueDate: string
  createdAt: string
  paidAt?: string
  
  // Financial details
  currency: string
  exchangeRate?: number
  subtotal: number
  taxAmount: number
  totalAmount: number
  amountPaid?: number
  amountDue?: number
  
  // Business and client info
  business: BusinessInfo
  client: ClientInfo
  
  // Line items
  items: InvoiceLineItem[]
  
  // Additional info
  notes?: string
  terms?: string
  paymentInstructions?: string
}

interface InvoiceDetailViewProps {
  invoiceId: string
  onBack: () => void
  onDownloadPDF: (invoiceId: string) => void
  onPayInvoice?: (invoiceId: string) => void
}

// Mock detailed invoice data
const mockDetailedInvoice: DetailedInvoice = {
  id: '1',
  invoiceNumber: 'INV-001',
  status: 'sent',
  paymentStatus: 'unpaid',
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
  notes: 'Thank you for your business! Payment is due within 15 days of invoice date.',
  terms: 'Payment terms: Net 15 days. Late payments may incur additional fees.',
  paymentInstructions: 'Please pay via the online portal or contact us for alternative payment methods.'
}

export function InvoiceDetailView({ 
  invoiceId, 
  onBack, 
  onDownloadPDF, 
  onPayInvoice 
}: InvoiceDetailViewProps) {
  const [invoice, setInvoice] = useState<DetailedInvoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/client/invoices/${invoiceId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch invoice')
        }
        
        const data = await response.json()
        setInvoice(data.invoice)
      } catch (err) {
        console.error('Error fetching invoice details:', err)
        setError(err instanceof Error ? err.message : 'Failed to load invoice')
        // Fallback to mock data for development
        setInvoice(mockDetailedInvoice)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoiceDetails()
  }, [invoiceId])

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string, paymentStatus?: string) => {
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

  const isOverdue = (invoice: DetailedInvoice) => {
    const today = new Date()
    const dueDate = new Date(invoice.dueDate)
    return dueDate < today && invoice.paymentStatus !== 'paid'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Details</h1>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Invoice</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invoice) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {invoice.invoiceNumber}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(invoice.status, invoice.paymentStatus)}
              {isOverdue(invoice) && (
                <Badge variant="destructive" className="text-red-700 bg-red-100">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onDownloadPDF(invoice.id)}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {invoice.paymentStatus === 'unpaid' && onPayInvoice && (
            <Button onClick={() => onPayInvoice(invoice.id)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay Now
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Invoice Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice Number:</span>
                      <span className="font-medium">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice Date:</span>
                      <span>{formatDate(invoice.invoiceDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className={cn(
                        isOverdue(invoice) && invoice.paymentStatus !== 'paid' 
                          ? "text-red-600 font-medium" 
                          : ""
                      )}>
                        {formatDate(invoice.dueDate)}
                      </span>
                    </div>
                    {invoice.paidAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paid Date:</span>
                        <span className="text-green-600 font-medium">
                          {formatDate(invoice.paidAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Payment Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Currency:</span>
                      <span className="font-medium">{invoice.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-medium">
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </span>
                    </div>
                    {invoice.amountPaid && invoice.amountPaid > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount Paid:</span>
                        <span className="text-green-600 font-medium">
                          {formatCurrency(invoice.amountPaid, invoice.currency)}
                        </span>
                      </div>
                    )}
                    {invoice.amountDue && invoice.amountDue > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount Due:</span>
                        <span className={cn(
                          "font-medium",
                          isOverdue(invoice) ? "text-red-600" : "text-yellow-600"
                        )}>
                          {formatCurrency(invoice.amountDue, invoice.currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items & Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Description</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600">Qty</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600">Rate</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3 text-sm">
                          <div className="font-medium text-gray-900">{item.description}</div>
                        </td>
                        <td className="py-3 text-sm text-right text-gray-600">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-sm text-right text-gray-600">
                          {formatCurrency(item.rate, invoice.currency)}
                        </td>
                        <td className="py-3 text-sm text-right font-medium">
                          {formatCurrency(item.amount, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <Separator className="my-4" />
              
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms || invoice.paymentInstructions) && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Terms & Conditions</h4>
                    <p className="text-sm text-gray-600">{invoice.terms}</p>
                  </div>
                )}
                {invoice.paymentInstructions && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Payment Instructions</h4>
                    <p className="text-sm text-gray-600">{invoice.paymentInstructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Contact Information */}
        <div className="space-y-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                From
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">{invoice.business.name}</h4>
                  {invoice.business.taxId && (
                    <p className="text-sm text-gray-600">Tax ID: {invoice.business.taxId}</p>
                  )}
                </div>
                
                {invoice.business.address && (
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-600 whitespace-pre-line">
                      {invoice.business.address}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <a 
                    href={`mailto:${invoice.business.email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {invoice.business.email}
                  </a>
                </div>
                
                {invoice.business.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <a 
                      href={`tel:${invoice.business.phone}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {invoice.business.phone}
                    </a>
                  </div>
                )}
                
                {invoice.business.website && (
                  <div className="text-sm">
                    <a 
                      href={`https://${invoice.business.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {invoice.business.website}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Bill To
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">{invoice.client.name}</h4>
                  {invoice.client.company && (
                    <p className="text-sm text-gray-600">{invoice.client.company}</p>
                  )}
                </div>
                
                {invoice.client.address && (
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-600 whitespace-pre-line">
                      {invoice.client.address}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{invoice.client.email}</span>
                </div>
                
                {invoice.client.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">{invoice.client.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onDownloadPDF(invoice.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Invoice
                </Button>
                {invoice.paymentStatus === 'unpaid' && onPayInvoice && (
                  <Button 
                    className="w-full justify-start"
                    onClick={() => onPayInvoice(invoice.id)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}