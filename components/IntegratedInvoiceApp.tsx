"use client";
import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorProvider } from "@/components/error/ErrorProvider";
import { CurrencyErrorBoundary } from "@/components/error/CurrencyErrorBoundary";
import { PaymentErrorBoundary } from "@/components/error/PaymentErrorBoundary";
import { Toaster } from "sonner";

// Main invoice components
import InvoiceSummary from "./InvoiceSummary";
import LineItemsTable from "./LineItemsTable";
import ActionButtons from "./ActionButtons";
import BusinessInfoForm from "./BusinessInfoForm";
import ClientInfoForm from "./ClientInfoForm";
import RecurringInvoiceToggle from "./RecurringInvoiceToggle";
import InvoicePreview from "./InvoicePreview";

// Currency components
import CurrencySelector from "./CurrencySelector";
import ExchangeRateDisplay from "./ExchangeRateDisplay";

// Recurring invoice components
import RecurringInvoiceManager from "./RecurringInvoiceManager";

// Client portal components (conditionally rendered)
import dynamic from "next/dynamic";

// Dynamically import client portal to avoid SSR issues
const ClientPortal = dynamic(() => import("./client/ClientPortal"), {
  ssr: false,
  loading: () => <div className="animate-pulse">Loading client portal...</div>
});

// Store and services
import useInvoiceStore from "@/lib/store";
import { currencyService } from "@/lib/services/CurrencyService";
import { useErrorHandler } from "@/lib/hooks/useErrorHandler";

interface IntegratedInvoiceAppProps {
  showClientPortal?: boolean;
  enableRecurringInvoices?: boolean;
  enableMultiCurrency?: boolean;
}

const IntegratedInvoiceApp: React.FC<IntegratedInvoiceAppProps> = ({
  showClientPortal = false,
  enableRecurringInvoices = true,
  enableMultiCurrency = true,
}) => {
  const [activeTab, setActiveTab] = useState("invoice");
  const [isLoading, setIsLoading] = useState(true);

  // Store state
  const recurringConfig = useInvoiceStore((state) => state.recurringConfig);
  const setRecurringConfig = useInvoiceStore((state) => state.setRecurringConfig);
  const selectedCurrency = useInvoiceStore((state) => state.selectedCurrency);
  const supportedCurrencies = useInvoiceStore((state) => state.supportedCurrencies);
  const recurringInvoices = useInvoiceStore((state) => state.recurringInvoices);
  const setCurrency = useInvoiceStore((state) => state.setCurrency);
  const updateExchangeRates = useInvoiceStore((state) => state.updateExchangeRates);

  // Error handling
  const { handleError } = useErrorHandler();

  // Initialize services and load data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);

        // Initialize currency service if multi-currency is enabled
        if (enableMultiCurrency) {
          try {
            const rates = await currencyService.getCachedRates();
            updateExchangeRates(rates);

            // Refresh rates if they're stale
            const shouldRefresh = rates.length === 0 ||
              rates.some(rate => Date.now() - rate.timestamp.getTime() > 3600000); // 1 hour

            if (shouldRefresh) {
              await currencyService.refreshRates();
              const freshRates = await currencyService.getCachedRates();
              updateExchangeRates(freshRates);
            }
          } catch (error) {
            handleError(error as Error, 'Failed to initialize currency service');
          }
        }

        // Load any persisted data
        // This could include loading saved invoices, recurring schedules, etc.

      } catch (error) {
        handleError(error as Error, 'Failed to initialize application');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [enableMultiCurrency, updateExchangeRates, handleError]);

  const handleRecurringToggle = (enabled: boolean) => {
    if (!enabled) {
      setRecurringConfig(null);
    }
  };

  const handleCurrencyChange = async (currency: any) => {
    try {
      await setCurrency(currency);
    } catch (error) {
      handleError(error as Error, 'Failed to change currency');
    }
  };

  // Recurring invoice handlers
  const handleEditRecurring = (invoice: any) => {
    try {
      // TODO: Implement edit functionality
      // This could open a modal or navigate to an edit page
      console.log('Edit recurring invoice:', invoice.id);
    } catch (error) {
      handleError(error as Error, 'Failed to edit recurring invoice');
    }
  };

  const handleDeleteRecurring = async (invoiceId: string) => {
    try {
      // TODO: Implement delete functionality
      // This should call the recurring invoice service to delete the template
      console.log('Delete recurring invoice:', invoiceId);
    } catch (error) {
      handleError(error as Error, 'Failed to delete recurring invoice');
    }
  };

  const handleToggleRecurring = async (invoiceId: string, isActive: boolean) => {
    try {
      // TODO: Implement toggle functionality
      // This should call the recurring invoice service to pause/resume
      console.log('Toggle recurring invoice:', invoiceId, 'active:', isActive);
    } catch (error) {
      handleError(error as Error, 'Failed to toggle recurring invoice');
    }
  };

  const handleViewInvoice = (invoice: any) => {
    try {
      // TODO: Implement view functionality
      // This could open a preview modal or navigate to a view page
      console.log('View invoice:', invoice.id);
    } catch (error) {
      handleError(error as Error, 'Failed to view invoice');
    }
  };

  const handleGenerateNow = async (invoiceId: string) => {
    try {
      // TODO: Implement generate now functionality
      // This should call the recurring invoice service to generate immediately
      console.log('Generate now for recurring invoice:', invoiceId);
    } catch (error) {
      handleError(error as Error, 'Failed to generate invoice');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <ErrorProvider>
      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="invoice">Invoice Generator</TabsTrigger>
            {enableRecurringInvoices && (
              <TabsTrigger value="recurring">Recurring Invoices</TabsTrigger>
            )}
            {showClientPortal && (
              <TabsTrigger value="client">Client Portal</TabsTrigger>
            )}
          </TabsList>

          {/* Main Invoice Generator Tab */}
          <TabsContent value="invoice" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-6">
                <CurrencyErrorBoundary>
                  <BusinessInfoForm />
                  {enableMultiCurrency && (
                    <div className="space-y-4">
                      <CurrencySelector
                        selectedCurrency={selectedCurrency}
                        supportedCurrencies={supportedCurrencies}
                        onCurrencyChange={handleCurrencyChange}
                      />
                      <ExchangeRateDisplay />
                    </div>
                  )}
                </CurrencyErrorBoundary>

                <ClientInfoForm />
                <LineItemsTable />
                <InvoiceSummary />

                {enableRecurringInvoices && (
                  <RecurringInvoiceToggle
                    config={recurringConfig}
                    onConfigChange={setRecurringConfig}
                    isEnabled={recurringConfig !== null}
                    onToggle={handleRecurringToggle}
                  />
                )}

                <PaymentErrorBoundary>
                  <ActionButtons />
                </PaymentErrorBoundary>
              </section>

              <aside>
                <InvoicePreview />
              </aside>
            </div>
          </TabsContent>

          {/* Recurring Invoices Tab */}
          {enableRecurringInvoices && (
            <TabsContent value="recurring" className="space-y-6">
              <RecurringInvoiceManager />
            </TabsContent>
          )}

          {/* Client Portal Tab */}
          {showClientPortal && (
            <TabsContent value="client" className="space-y-6">
              <ClientPortal />
            </TabsContent>
          )}
        </Tabs>

        {/* Global toast notifications */}
        <Toaster position="top-right" />
      </div>
    </ErrorProvider>
  );
};

export default IntegratedInvoiceApp;