"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedInvoice } from "@/lib/types/invoice";
import { 
  Clock, 
  Calendar, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Pause,
  XCircle,
  Eye,
  Download,
  MoreHorizontal
} from "lucide-react";
import { formatCurrencyAmount } from "@/lib/utils/currency";

interface RecurringInvoiceListProps {
  invoices: EnhancedInvoice[];
  onViewInvoice: (invoice: EnhancedInvoice) => void;
  onDownloadInvoice: (invoice: EnhancedInvoice) => void;
  onManageRecurring: (invoice: EnhancedInvoice) => void;
  isLoading?: boolean;
}

type StatusType = 'active' | 'paused' | 'ended' | 'overdue';

export default function RecurringInvoiceList({
  invoices,
  onViewInvoice,
  onDownloadInvoice,
  onManageRecurring,
  isLoading = false,
}: RecurringInvoiceListProps) {
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  const getInvoiceStatus = (invoice: EnhancedInvoice): StatusType => {
    const config = invoice.recurringConfig;
    if (!config) return 'ended';
    
    const now = new Date();
    const nextDate = config.nextGenerationDate;
    
    if (!config.isActive) return 'paused';
    if (config.endDate && config.endDate <= now) return 'ended';
    if (nextDate < now) return 'overdue';
    return 'active';
  };

  const getStatusBadge = (status: StatusType) => {
    const statusConfig = {
      active: {
        variant: 'default' as const,
        icon: CheckCircle,
        label: 'Active',
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      paused: {
        variant: 'secondary' as const,
        icon: Pause,
        label: 'Paused',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      ended: {
        variant: 'outline' as const,
        icon: XCircle,
        label: 'Ended',
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      },
      overdue: {
        variant: 'destructive' as const,
        icon: AlertTriangle,
        label: 'Overdue',
        className: 'bg-red-100 text-red-800 border-red-200'
      }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getFrequencyText = (invoice: EnhancedInvoice) => {
    const config = invoice.recurringConfig;
    if (!config) return 'N/A';
    
    const { frequency, interval } = config;
    const frequencyMap = {
      weekly: interval === 1 ? 'Weekly' : `Every ${interval} weeks`,
      monthly: interval === 1 ? 'Monthly' : `Every ${interval} months`,
      quarterly: interval === 1 ? 'Quarterly' : `Every ${interval} quarters`,
      yearly: interval === 1 ? 'Yearly' : `Every ${interval} years`,
    };
    
    return frequencyMap[frequency] || frequency;
  };

  const getDaysUntilNext = (nextDate: Date): number => {
    const now = new Date();
    const diffTime = nextDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const toggleExpanded = (invoiceId: string) => {
    setExpandedInvoice(expandedInvoice === invoiceId ? null : invoiceId);
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

  const recurringInvoices = invoices.filter(invoice => invoice.isRecurring && invoice.recurringConfig);

  if (recurringInvoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recurring Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Recurring Invoices</h3>
            <p className="text-muted-foreground">
              Create your first recurring invoice to automate your billing process.
            </p>
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
          Recurring Invoices ({recurringInvoices.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {recurringInvoices.map((invoice) => {
          const status = getInvoiceStatus(invoice);
          const config = invoice.recurringConfig!;
          const isExpanded = expandedInvoice === invoice.id;
          const daysUntilNext = getDaysUntilNext(config.nextGenerationDate);

          return (
            <Card key={invoice.id} className="border-l-4 border-l-primary/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header Row */}
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg">{invoice.invoiceNumber}</span>
                      {getStatusBadge(status)}
                      <span className="text-sm text-muted-foreground">
                        {getFrequencyText(invoice)}
                      </span>
                    </div>

                    {/* Client and Amount Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="font-medium">{invoice.client.name}</p>
                        {invoice.client.company && (
                          <p className="text-sm text-muted-foreground">{invoice.client.company}</p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="font-semibold text-lg">
                          {formatCurrencyAmount(invoice.totals.total, invoice.currency)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Next Generation</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className={`font-medium ${status === 'overdue' ? 'text-destructive' : ''}`}>
                            {config.nextGenerationDate.toLocaleDateString()}
                          </span>
                        </div>
                        {status === 'active' && (
                          <p className="text-xs text-muted-foreground">
                            {daysUntilNext > 0 ? `in ${daysUntilNext} days` : 'Today'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t pt-3 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Created</p>
                            <p>{invoice.createdAt.toLocaleDateString()}</p>
                          </div>
                          
                          {config.endDate && (
                            <div>
                              <p className="text-muted-foreground">End Date</p>
                              <p>{config.endDate.toLocaleDateString()}</p>
                            </div>
                          )}
                          
                          {config.maxOccurrences && (
                            <div>
                              <p className="text-muted-foreground">Max Occurrences</p>
                              <p>{config.maxOccurrences}</p>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="capitalize">{config.isActive ? 'Active' : 'Paused'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
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
                      onClick={() => onDownloadInvoice(invoice)}
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManageRecurring(invoice)}
                      title="Manage Recurring Settings"
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(invoice.id)}
                      title={isExpanded ? "Show Less" : "Show More"}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Status-specific alerts */}
                {status === 'overdue' && (
                  <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span>This recurring invoice is overdue for generation.</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}