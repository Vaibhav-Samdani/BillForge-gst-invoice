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

// Services
import { RecurringInvoiceService } from "@/lib/services/RecurringInvoiceService";
import { RecurringInvoiceScheduler } from "@/lib/services/RecurringInvoiceScheduler";
import { RecurringConfig, EnhancedInvoice } from "@/lib/types/invoice";
import { LineItem } from "@/lib/store";

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
import { toast } from "sonner";

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
  const setCurrency = useInvoiceStore((state) => state.setCurrency);
  const updateExchangeRates = useInvoiceStore((state) => state.updateExchangeRates);
  
  // Recurring invoice state
  const [recurringTemplates, setRecurringTemplates] = useState(RecurringInvoiceService.getAllTemplates());

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
              await currencyService.refreshAllRates();
              const freshRates = await currencyService.getCachedRates();
              updateExchangeRates(freshRates);
            }
          } catch (error) {
            handleError(error as Error, { context: 'Failed to initialize currency service' });
          }
        }

        // Load any persisted data
        // This could include loading saved invoices, recurring schedules, etc.
        
        // Initialize recurring invoice scheduler if enabled
        if (enableRecurringInvoices) {
          RecurringInvoiceScheduler.start(60); // Check every hour
        }

      } catch (error) {
        handleError(error as Error, { context: 'Failed to initialize application' });
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [enableMultiCurrency, updateExchangeRates, handleError]);

  const handleRecurringToggle = async (enabled: boolean) => {
    if (!enabled) {
      setRecurringConfig(null);
    } else {
      // When enabling recurring, create a default config
      const defaultConfig: RecurringConfig = {
        frequency: 'monthly',
        interval: 1,
        startDate: new Date(),
        nextGenerationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
      };
      setRecurringConfig(defaultConfig);
      
      // Automatically create the recurring template
      try {
        const store = useInvoiceStore.getState();
        const currentInvoice: EnhancedInvoice = {
          id: `invoice-${Date.now()}`,
          invoiceNumber: store.invoiceNumber,
          invoiceDate: store.invoiceDate,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          business: store.business,
          client: store.client,
          items: store.items,
          totals: store.totals,
          currency: store.selectedCurrency,
          status: 'draft',
          paymentStatus: 'unpaid',
          createdAt: new Date(),
          updatedAt: new Date(),
          recurringConfig: undefined,
          isRecurring: true,
          sameGst: false,
          globalGst: 0,
          clientId: store.client.email || `client-${Date.now()}`,
        };

        const template = await RecurringInvoiceService.createRecurringTemplate(
          currentInvoice,
          defaultConfig,
          `Recurring ${store.invoiceNumber}`
        );

        setRecurringTemplates(RecurringInvoiceService.getAllTemplates());
        toast.success(`Recurring template created: ${template.templateName}`);
      } catch (error) {
        handleError(error as Error, { context: 'Failed to create recurring template' });
        toast.error("Failed to create recurring template");
      }
    }
  };

  const handleCurrencyChange = async (currency: any) => {
    try {
      await setCurrency(currency);
    } catch (error) {
      handleError(error as Error, { context: 'Failed to change currency' });
    }
  };

  // Recurring invoice handlers
  const handleEditRecurring = (template: any) => {
    try {
      // Switch to invoice tab and load the template data
      setActiveTab("invoice");
      
      // Load template data into the current invoice form
      const store = useInvoiceStore.getState();
      store.setBusiness(template.baseInvoice.business);
      store.setClient(template.baseInvoice.client);
      
      // Clear existing items and add template items
      const currentItems = store.items;
      currentItems.forEach((item: LineItem) => store.removeItem(item.id));
      template.baseInvoice.items.forEach((item: LineItem) => {
        store.addItem();
        const newItems = store.items;
        const lastItem = newItems[newItems.length - 1];
        store.updateItem(lastItem.id, item);
      });
      
      store.setInvoiceNumber(template.baseInvoice.invoiceNumber);
      store.setInvoiceDate(template.baseInvoice.invoiceDate);
      store.setCurrency(template.baseInvoice.currency);
      store.setRecurringConfig(template.recurringConfig);
      
      toast.success("Template loaded for editing");
    } catch (error) {
      handleError(error as Error, { context: 'Failed to edit recurring invoice' });
    }
  };

  const handleDeleteRecurring = async (templateId: string) => {
    try {
      const success = await RecurringInvoiceService.deleteTemplate(templateId);
      if (success) {
        setRecurringTemplates(RecurringInvoiceService.getAllTemplates());
        toast.success("Recurring invoice template deleted");
      } else {
        toast.error("Failed to delete template");
      }
    } catch (error) {
      handleError(error as Error, { context: 'Failed to delete recurring invoice' });
      toast.error("Failed to delete recurring invoice");
    }
  };

  const handleToggleRecurring = async (templateId: string, isActive: boolean) => {
    try {
      const updatedTemplate = await RecurringInvoiceService.toggleTemplate(templateId, isActive);
      if (updatedTemplate) {
        setRecurringTemplates(RecurringInvoiceService.getAllTemplates());
        toast.success(`Recurring invoice ${isActive ? 'activated' : 'paused'}`);
      } else {
        toast.error("Failed to update template");
      }
    } catch (error) {
      handleError(error as Error, { context: 'Failed to toggle recurring invoice' });
      toast.error("Failed to update recurring invoice");
    }
  };

  const handleViewInvoice = (template: any) => {
    try {
      // Switch to invoice tab and load the template data for preview
      setActiveTab("invoice");
      
      const store = useInvoiceStore.getState();
      store.setBusiness(template.baseInvoice.business);
      store.setClient(template.baseInvoice.client);
      
      // Clear existing items and add template items
      const currentItems = store.items;
      currentItems.forEach((item: LineItem) => store.removeItem(item.id));
      template.baseInvoice.items.forEach((item: LineItem) => {
        store.addItem();
        const newItems = store.items;
        const lastItem = newItems[newItems.length - 1];
        store.updateItem(lastItem.id, item);
      });
      
      store.setInvoiceNumber(template.baseInvoice.invoiceNumber);
      store.setInvoiceDate(template.baseInvoice.invoiceDate);
      store.setCurrency(template.baseInvoice.currency);
      
      toast.info("Template loaded for preview");
    } catch (error) {
      handleError(error as Error, { context: 'Failed to view invoice' });
    }
  };

  const handleGenerateNow = async (templateId: string) => {
    try {
      const generatedInvoice = await RecurringInvoiceService.generateInvoiceFromTemplate(templateId);
      if (generatedInvoice) {
        setRecurringTemplates(RecurringInvoiceService.getAllTemplates());
        toast.success(`Invoice ${generatedInvoice.invoiceNumber} generated successfully!`);
        
        // Optionally switch to the generated invoice
        const store = useInvoiceStore.getState();
        store.setBusiness(generatedInvoice.business);
        store.setClient(generatedInvoice.client);
        
        // Clear existing items and add generated invoice items
        const currentItems = store.items;
        currentItems.forEach((item: LineItem) => store.removeItem(item.id));
        generatedInvoice.items.forEach((item: LineItem) => {
          store.addItem();
          const newItems = store.items;
          const lastItem = newItems[newItems.length - 1];
          store.updateItem(lastItem.id, item);
        });
        
        store.setInvoiceNumber(generatedInvoice.invoiceNumber);
        store.setInvoiceDate(generatedInvoice.invoiceDate);
        store.setCurrency(generatedInvoice.currency);
        
        setActiveTab("invoice");
      } else {
        toast.error("Failed to generate invoice - template may not be ready");
      }
    } catch (error) {
      handleError(error as Error, { context: 'Failed to generate invoice' });
      toast.error("Failed to generate invoice");
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
          <TabsList className={`grid w-full ${
            showClientPortal ? 'grid-cols-3' : 
            enableRecurringInvoices ? 'grid-cols-2' : 'grid-cols-1'
          }`}>
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
              <RecurringInvoiceManager 
                recurringInvoices={recurringTemplates.map(template => ({
                  ...template.baseInvoice,
                  recurringConfig: template.recurringConfig,
                  id: template.id,
                }))}
                onEditRecurring={handleEditRecurring}
                onDeleteRecurring={handleDeleteRecurring}
                onToggleRecurring={handleToggleRecurring}
                onViewInvoice={handleViewInvoice}
                onGenerateNow={handleGenerateNow}
                isLoading={isLoading}
              />
            </TabsContent>
          )}

          {/* Client Portal Tab */}
          {showClientPortal && (
            <TabsContent value="client" className="space-y-6">
              <ClientPortal>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    {/* Main content area */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-xl font-semibold mb-4">Recent Invoices</h2>
                      <p className="text-gray-600 mb-4">View and manage your invoices</p>
                      {/* Invoice list component would be rendered here */}
                      <div className="space-y-3">
                        <div className="border rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">Invoice #INV-001</h3>
                              <p className="text-sm text-gray-500">Due: Jan 15, 2025</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">$1,250.00</p>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    {/* Sidebar content */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold mb-4">Account Summary</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Outstanding</p>
                          <p className="text-2xl font-bold text-red-600">$2,450.00</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Paid This Month</p>
                          <p className="text-2xl font-bold text-green-600">$5,200.00</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Invoices</p>
                          <p className="text-2xl font-bold">12</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ClientPortal>
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