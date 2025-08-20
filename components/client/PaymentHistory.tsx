'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Download, 
  Filter, 
  Search, 
  Calendar,
  CreditCard,
  RefreshCw,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye
} from 'lucide-react';
import { Payment, EnhancedInvoice } from '../../lib/types';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface PaymentHistoryProps {
  payments: Payment[];
  invoices: EnhancedInvoice[];
  onExportCSV: (filteredPayments: Payment[]) => void;
  onExportPDF: (filteredPayments: Payment[]) => void;
  onViewPaymentDetails: (payment: Payment) => void;
  onRefreshPayments: () => void;
  isLoading?: boolean;
}

interface PaymentFilters {
  status: string[];
  paymentMethod: string[];
  dateRange?: DateRange;
  amountRange?: {
    min: number;
    max: number;
  };
  invoiceNumber?: string;
}

interface SortConfig {
  field: keyof Payment | 'invoiceNumber';
  direction: 'asc' | 'desc';
}

const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'] as const;
const PAYMENT_METHODS = ['card', 'bank_transfer', 'paypal', 'other'] as const;

export default function PaymentHistory({
  payments,
  invoices,
  onExportCSV,
  onExportPDF,
  onViewPaymentDetails,
  onRefreshPayments,
  isLoading = false,
}: PaymentHistoryProps) {
  const [filters, setFilters] = useState<PaymentFilters>({
    status: [],
    paymentMethod: [],
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'processedAt',
    direction: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Create a map of invoice numbers for quick lookup
  const invoiceMap = useMemo(() => {
    return invoices.reduce((map, invoice) => {
      map[invoice.id] = invoice;
      return map;
    }, {} as Record<string, EnhancedInvoice>);
  }, [invoices]);

  // Filter and sort payments
  const filteredAndSortedPayments = useMemo(() => {
    let filtered = payments.filter((payment) => {
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(payment.status)) {
        return false;
      }

      // Payment method filter
      if (filters.paymentMethod.length > 0 && !filters.paymentMethod.includes(payment.paymentMethod)) {
        return false;
      }

      // Date range filter
      if (filters.dateRange?.from && filters.dateRange?.to) {
        const paymentDate = new Date(payment.processedAt);
        if (paymentDate < filters.dateRange.from || paymentDate > filters.dateRange.to) {
          return false;
        }
      }

      // Amount range filter
      if (filters.amountRange) {
        const amount = payment.amount.amount;
        if (amount < filters.amountRange.min || amount > filters.amountRange.max) {
          return false;
        }
      }

      // Invoice number search
      if (filters.invoiceNumber) {
        const invoice = invoiceMap[payment.invoiceId];
        if (!invoice || !invoice.invoiceNumber.toLowerCase().includes(filters.invoiceNumber.toLowerCase())) {
          return false;
        }
      }

      // General search term
      if (searchTerm) {
        const invoice = invoiceMap[payment.invoiceId];
        const searchLower = searchTerm.toLowerCase();
        return (
          payment.transactionId.toLowerCase().includes(searchLower) ||
          payment.paymentMethod.toLowerCase().includes(searchLower) ||
          payment.status.toLowerCase().includes(searchLower) ||
          (invoice && invoice.invoiceNumber.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });

    // Sort payments
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.field === 'invoiceNumber') {
        aValue = invoiceMap[a.invoiceId]?.invoiceNumber || '';
        bValue = invoiceMap[b.invoiceId]?.invoiceNumber || '';
      } else {
        aValue = a[sortConfig.field];
        bValue = b[sortConfig.field];
      }

      // Handle different data types
      if (aValue instanceof Date && bValue instanceof Date) {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (sortConfig.field === 'amount') {
        aValue = a.amount.amount;
        bValue = b.amount.amount;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [payments, filters, sortConfig, searchTerm, invoiceMap]);

  const handleSort = (field: keyof Payment | 'invoiceNumber') => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFilterChange = (key: keyof PaymentFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      paymentMethod: [],
    });
    setSearchTerm('');
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
  };

  const getStatusBadgeVariant = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'refunded':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getSortIcon = (field: keyof Payment | 'invoiceNumber') => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const stats = filteredAndSortedPayments.reduce(
      (acc, payment) => {
        acc.totalAmount += payment.amount.amount;
        acc.totalCount += 1;
        
        switch (payment.status) {
          case 'completed':
            acc.completedAmount += payment.amount.amount;
            acc.completedCount += 1;
            break;
          case 'refunded':
            acc.refundedAmount += (payment.refundAmount || payment.amount.amount);
            acc.refundedCount += 1;
            break;
          case 'pending':
            acc.pendingCount += 1;
            break;
          case 'failed':
            acc.failedCount += 1;
            break;
        }
        
        return acc;
      },
      {
        totalAmount: 0,
        totalCount: 0,
        completedAmount: 0,
        completedCount: 0,
        refundedAmount: 0,
        refundedCount: 0,
        pendingCount: 0,
        failedCount: 0,
      }
    );
    
    return stats;
  }, [filteredAndSortedPayments]);

  return (
    <div className="space-y-6">
      {/* Header with Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold">{summaryStats.totalCount}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{summaryStats.completedCount}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Refunded</p>
                <p className="text-2xl font-bold text-orange-600">{summaryStats.refundedCount}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">
                  {filteredAndSortedPayments.length > 0 
                    ? formatCurrency(summaryStats.completedAmount, filteredAndSortedPayments[0].amount.currency)
                    : '$0.00'
                  }
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">$</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Payment History</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshPayments}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportCSV(filteredAndSortedPayments)}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportPDF(filteredAndSortedPayments)}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by transaction ID, invoice number, or payment method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={filters.status.join(',')}
                    onValueChange={(value) => 
                      handleFilterChange('status', value ? value.split(',') : [])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      {PAYMENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Payment Method</label>
                  <Select
                    value={filters.paymentMethod.join(',')}
                    onValueChange={(value) => 
                      handleFilterChange('paymentMethod', value ? value.split(',') : [])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All methods</SelectItem>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method.replace('_', ' ').charAt(0).toUpperCase() + method.replace('_', ' ').slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Invoice Number</label>
                  <Input
                    placeholder="Filter by invoice number"
                    value={filters.invoiceNumber || ''}
                    onChange={(e) => handleFilterChange('invoiceNumber', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {/* Payment Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('processedAt')}
                  >
                    <div className="flex items-center gap-2">
                      Date
                      {getSortIcon('processedAt')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('invoiceNumber')}
                  >
                    <div className="flex items-center gap-2">
                      Invoice
                      {getSortIcon('invoiceNumber')}
                    </div>
                  </TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center gap-2">
                      Amount
                      {getSortIcon('amount')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('paymentMethod')}
                  >
                    <div className="flex items-center gap-2">
                      Method
                      {getSortIcon('paymentMethod')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {isLoading ? 'Loading payments...' : 'No payments found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedPayments.map((payment) => {
                    const invoice = invoiceMap[payment.invoiceId];
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {formatDate(payment.processedAt)}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {invoice?.invoiceNumber || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {payment.transactionId.slice(-8)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-semibold">
                              {formatCurrency(payment.amount.amount, payment.amount.currency)}
                            </span>
                            {payment.refundAmount && payment.refundAmount > 0 && (
                              <div className="text-xs text-orange-600">
                                Refunded: {formatCurrency(payment.refundAmount, payment.amount.currency)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {payment.paymentMethod.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewPaymentDetails(payment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination info */}
          {filteredAndSortedPayments.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              Showing {filteredAndSortedPayments.length} of {payments.length} payments
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}