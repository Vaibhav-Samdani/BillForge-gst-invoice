"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedInvoice, RecurringConfig } from "@/lib/types/invoice";
import { 
  Clock, 
  Calendar, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Eye, 
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { formatCurrencyAmount } from "@/lib/utils/currency";

interface RecurringInvoiceManagerProps {
  recurringInvoices?: EnhancedInvoice[]; // Make optional
  onEditRecurring: (invoice: EnhancedInvoice) => void;
  onDeleteRecurring: (invoiceId: string) => void;
  onToggleRecurring: (invoiceId: string, isActive: boolean) => void;
  onViewInvoice: (invoice: EnhancedInvoice) => void;
  onGenerateNow: (invoiceId: string) => void;
  isLoading?: boolean;
}

type FilterStatus = 'all' | 'active' | 'paused' | 'ended';
type SortField = 'nextDate' | 'frequency' | 'total' | 'created';
type SortDirection = 'asc' | 'desc';

export default function RecurringInvoiceManager({
  recurringInvoices,
  onEditRecurring,
  onDeleteRecurring,
  onToggleRecurring,
  onViewInvoice,
  onGenerateNow,
  isLoading = false,
}: RecurringInvoiceManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('nextDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filter and sort invoices
  const filteredAndSortedInvoices = React.useMemo(() => {
    // Add null/undefined check
    if (!recurringInvoices || !Array.isArray(recurringInvoices)) {
      return [];
    }
    
    let filtered = recurringInvoices.filter(invoice => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client.company.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Status filter
      if (filterStatus === 'all') return true;
      
      const config = invoice.recurringConfig;
      if (!config) return false;

      switch (filterStatus) {
        case 'active':
          return config.isActive && (!config.endDate || config.endDate > new Date());
        case 'paused':
          return !config.isActive;
        case 'ended':
          return config.endDate && config.endDate <= new Date();
        default:
          return true;
      }
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'nextDate':
          aValue = a.recurringConfig?.nextGenerationDate || new Date(0);
          bValue = b.recurringConfig?.nextGenerationDate || new Date(0);
          break;
        case 'frequency':
          aValue = a.recurringConfig?.frequency || '';
          bValue = b.recurringConfig?.frequency || '';
          break;
        case 'total':
          aValue = a.totals.total;
          bValue = b.totals.total;
          break;
        case 'created':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [recurringInvoices, searchTerm, filterStatus, sortField, sortDirection]);

  const getStatusIcon = (invoice: EnhancedInvoice) => {
    const config = invoice.recurringConfig;
    if (!config) return <XCircle className="h-4 w-4 text-destructive" />;
    
    if (!config.isActive) return <Pause className="h-4 w-4 text-yellow-500" />;
    if (config.endDate && config.endDate <= new Date()) return <XCircle className="h-4 w-4 text-destructive" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = (invoice: EnhancedInvoice) => {
    const config = invoice.recurringConfig;
    if (!config) return 'No Config';
    
    if (!config.isActive) return 'Paused';
    if (config.endDate && config.endDate <= new Date()) return 'Ended';
    return 'Active';
  };

  const getFrequencyText = (config: RecurringConfig) => {
    const { frequency, interval } = config;
    const frequencyMap = {
      weekly: interval === 1 ? 'Weekly' : `Every ${interval} weeks`,
      monthly: interval === 1 ? 'Monthly' : `Every ${interval} months`,
      quarterly: interval === 1 ? 'Quarterly' : `Every ${interval} quarters`,
      yearly: interval === 1 ? 'Yearly' : `Every ${interval} years`,
    };
    
    return frequencyMap[frequency] || frequency;
  };

  const isOverdue = (nextDate: Date) => {
    return nextDate < new Date();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Loading recurring invoices...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recurring Invoice Manager
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by invoice number, client name, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sort-field">Sort By</Label>
            <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nextDate">Next Date</SelectItem>
                <SelectItem value="frequency">Frequency</SelectItem>
                <SelectItem value="total">Amount</SelectItem>
                <SelectItem value="created">Created</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Recurring Invoices List */}
        {filteredAndSortedInvoices.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Recurring Invoices</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterStatus !== 'all' 
                ? 'No invoices match your current filters.' 
                : 'Create your first recurring invoice to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedInvoices.map((invoice) => {
              const config = invoice.recurringConfig;
              if (!config) return null;

              const nextDate = config.nextGenerationDate;
              const overdue = isOverdue(nextDate);

              return (
                <Card key={invoice.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(invoice)}
                            <span className="font-medium">{invoice.invoiceNumber}</span>
                            <span className="text-sm text-muted-foreground">
                              ({getStatusText(invoice)})
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <Label className="text-xs text-muted-foreground">Client</Label>
                            <p className="font-medium">{invoice.client.name}</p>
                            {invoice.client.company && (
                              <p className="text-muted-foreground">{invoice.client.company}</p>
                            )}
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Frequency</Label>
                            <p>{getFrequencyText(config)}</p>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Amount</Label>
                            <p className="font-medium">
                              {formatCurrencyAmount(invoice.totals.total, invoice.currency)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="text-muted-foreground">Next:</span>
                            <span className={overdue ? 'text-destructive font-medium' : ''}>
                              {nextDate.toLocaleDateString()}
                              {overdue && (
                                <span className="ml-1 text-xs">(Overdue)</span>
                              )}
                            </span>
                          </div>
                          
                          {config.endDate && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Ends:</span>
                              <span>{config.endDate.toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewInvoice(invoice)}
                          title="View Invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditRecurring(invoice)}
                          title="Edit Recurring Settings"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onToggleRecurring(invoice.id, !config.isActive)}
                          title={config.isActive ? "Pause Recurring" : "Resume Recurring"}
                        >
                          {config.isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        
                        {config.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onGenerateNow(invoice.id)}
                            title="Generate Invoice Now"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteRecurring(invoice.id)}
                          title="Delete Recurring Invoice"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {overdue && config.isActive && (
                      <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          <span>This recurring invoice is overdue for generation.</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}