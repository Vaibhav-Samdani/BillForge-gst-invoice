"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecurringInvoiceManager from "@/components/RecurringInvoiceManager";
import RecurringInvoiceList from "@/components/RecurringInvoiceList";
import RecurringInvoiceForm from "@/components/RecurringInvoiceForm";
import useInvoiceStore from "@/lib/store";
import { EnhancedInvoice, RecurringConfig } from "@/lib/types/invoice";
import { Clock, Plus, FileText } from "lucide-react";
import Image from "next/image";

export default function RecurringInvoicesPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<EnhancedInvoice | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get state from store
  const recurringInvoices = useInvoiceStore((state) => state.recurringInvoices);
  const savedInvoices = useInvoiceStore((state) => state.savedInvoices);
  const loadInvoices = useInvoiceStore((state) => state.loadInvoices);
  const saveInvoice = useInvoiceStore((state) => state.saveInvoice);
  const generateRecurringInvoice = useInvoiceStore((state) => state.generateRecurringInvoice);

  // Mock data for demonstration (in real app, this would come from database)
  const [mockRecurringInvoices, setMockRecurringInvoices] = useState<EnhancedInvoice[]>([]);

  useEffect(() => {
    // Initialize with some mock data for demonstration
    const mockData: EnhancedInvoice[] = [
      {
        id: "rec-1",
        business: {
          name: "SHREE GANPATI SANITARY",
          company: "",
          address: "Nayi Aabadi Nahri, Raipur Road, Nahri, Teh. Raipur, Bhilwara, Rajasthan 311803",
          gstin: "08GWPPB19XXX1ZS",
          email: "sanitaryati@gmail.com",
          phone: "8955555509",
        },
        client: {
          name: "Vaibhadani",
          company: "Sanitary Sanitary",
          address: "SHOP NO O1, Mohan Market, Bigod, Bhira, Rajasthan, 311601",
          gstin: "08GEPPB1xx9N1ZS",
          email: "client@example.com",
          phone: "9079245896",
        },
        items: [
          {
            id: "1",
            description: "PVC PIPE",
            hsnSac: "3917",
            quantity: 60,
            rate: 220.35,
            per: "NOS",
            gst: 18,
            amount: 13221.0,
          },
        ],
        invoiceNumber: "REC-001",
        invoiceDate: "2024-01-15",
        sameGst: true,
        globalGst: 18,
        totals: {
          subtotal: 13221.0,
          cgst: 1189.89,
          sgst: 1189.89,
          igst: 0,
          round_off: 0.22,
          total: 15601.0,
        },
        currency: {
          code: "USD",
          symbol: "$",
          name: "US Dollar",
          decimalPlaces: 2,
        },
        isRecurring: true,
        recurringConfig: {
          frequency: "monthly",
          interval: 1,
          startDate: new Date("2024-01-15"),
          endDate: new Date("2024-12-15"),
          maxOccurrences: 12,
          nextGenerationDate: new Date("2024-02-15"),
          isActive: true,
        },
        status: "sent",
        paymentStatus: "unpaid",
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        dueDate: new Date("2024-02-15"),
        clientId: "client-1",
      },
      {
        id: "rec-2",
        business: {
          name: "SHREE GANPATI SANITARY",
          company: "",
          address: "Nayi Aabadi Nahri, Raipur Road, Nahri, Teh. Raipur, Bhilwara, Rajasthan 311803",
          gstin: "08GWPPB19XXX1ZS",
          email: "sanitaryati@gmail.com",
          phone: "8955555509",
        },
        client: {
          name: "ABC Corporation",
          company: "ABC Corp",
          address: "123 Business Street, City, State 12345",
          gstin: "08GEPPB1xx9N1ZS",
          email: "abc@example.com",
          phone: "9876543210",
        },
        items: [
          {
            id: "1",
            description: "Monthly Service",
            hsnSac: "9954",
            quantity: 1,
            rate: 5000.0,
            per: "Service",
            gst: 18,
            amount: 5000.0,
          },
        ],
        invoiceNumber: "REC-002",
        invoiceDate: "2024-01-01",
        sameGst: true,
        globalGst: 18,
        totals: {
          subtotal: 5000.0,
          cgst: 450.0,
          sgst: 450.0,
          igst: 0,
          round_off: 0,
          total: 5900.0,
        },
        currency: {
          code: "USD",
          symbol: "$",
          name: "US Dollar",
          decimalPlaces: 2,
        },
        isRecurring: true,
        recurringConfig: {
          frequency: "quarterly",
          interval: 1,
          startDate: new Date("2024-01-01"),
          endDate: undefined,
          maxOccurrences: undefined,
          nextGenerationDate: new Date("2024-04-01"),
          isActive: false, // Paused
        },
        status: "sent",
        paymentStatus: "paid",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        dueDate: new Date("2024-01-31"),
        clientId: "client-2",
      },
    ];

    setMockRecurringInvoices(mockData);
  }, []);

  const handleEditRecurring = (invoice: EnhancedInvoice) => {
    setSelectedInvoice(invoice);
    setShowCreateForm(true);
  };

  const handleDeleteRecurring = async (invoiceId: string) => {
    if (confirm("Are you sure you want to delete this recurring invoice?")) {
      setMockRecurringInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    }
  };

  const handleToggleRecurring = async (invoiceId: string, isActive: boolean) => {
    setMockRecurringInvoices(prev => 
      prev.map(inv => 
        inv.id === invoiceId && inv.recurringConfig
          ? { ...inv, recurringConfig: { ...inv.recurringConfig, isActive } }
          : inv
      )
    );
  };

  const handleViewInvoice = (invoice: EnhancedInvoice) => {
    // In a real app, this would navigate to the invoice view
    console.log("Viewing invoice:", invoice.invoiceNumber);
  };

  const handleDownloadInvoice = (invoice: EnhancedInvoice) => {
    // In a real app, this would trigger PDF download
    console.log("Downloading invoice:", invoice.invoiceNumber);
  };

  const handleGenerateNow = async (invoiceId: string) => {
    setIsLoading(true);
    try {
      // In a real app, this would call the recurring invoice service
      const invoice = mockRecurringInvoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        console.log("Generating invoice now for:", invoice.invoiceNumber);
        // Update next generation date
        const config = invoice.recurringConfig!;
        const nextDate = new Date(config.nextGenerationDate);
        
        switch (config.frequency) {
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + (7 * config.interval));
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + config.interval);
            break;
          case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + (3 * config.interval));
            break;
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + config.interval);
            break;
        }
        
        setMockRecurringInvoices(prev => 
          prev.map(inv => 
            inv.id === invoiceId && inv.recurringConfig
              ? { ...inv, recurringConfig: { ...inv.recurringConfig, nextGenerationDate: nextDate } }
              : inv
          )
        );
      }
    } catch (error) {
      console.error("Failed to generate invoice:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageRecurring = (invoice: EnhancedInvoice) => {
    setSelectedInvoice(invoice);
    setShowCreateForm(true);
  };

  const handleSaveRecurringConfig = () => {
    setShowCreateForm(false);
    setSelectedInvoice(null);
  };

  const handleCancelRecurringConfig = () => {
    setShowCreateForm(false);
    setSelectedInvoice(null);
  };

  if (showCreateForm) {
    return (
      <main className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Image
            loading="lazy"
            src="/logo.png"
            alt="BillForge Logo"
            width={50}
            height={50}
            className="rounded-xl"
          />
          <div>
            <h1 className="text-3xl font-bold">BillForge</h1>
            <p className="text-muted-foreground">
              {selectedInvoice ? "Edit Recurring Invoice" : "Create Recurring Invoice"}
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <RecurringInvoiceForm
            config={selectedInvoice?.recurringConfig || null}
            onConfigChange={(config) => {
              // In a real app, this would update the invoice
              console.log("Config changed:", config);
            }}
            onSave={handleSaveRecurringConfig}
            onCancel={handleCancelRecurringConfig}
            isEnabled={selectedInvoice?.recurringConfig !== null}
            onToggle={(enabled) => {
              // In a real app, this would toggle the recurring status
              console.log("Recurring toggled:", enabled);
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Image
            loading="lazy"
            src="/logo.png"
            alt="BillForge Logo"
            width={50}
            height={50}
            className="rounded-xl"
          />
          <div>
            <h1 className="text-3xl font-bold">BillForge</h1>
            <p className="text-muted-foreground">Recurring Invoice Management</p>
          </div>
        </div>

        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Recurring Invoice
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoice List
          </TabsTrigger>
          <TabsTrigger value="manager" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Manager View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <RecurringInvoiceList
            invoices={mockRecurringInvoices}
            onViewInvoice={handleViewInvoice}
            onDownloadInvoice={handleDownloadInvoice}
            onManageRecurring={handleManageRecurring}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="manager">
          <RecurringInvoiceManager
            recurringInvoices={mockRecurringInvoices}
            onEditRecurring={handleEditRecurring}
            onDeleteRecurring={handleDeleteRecurring}
            onToggleRecurring={handleToggleRecurring}
            onViewInvoice={handleViewInvoice}
            onGenerateNow={handleGenerateNow}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}