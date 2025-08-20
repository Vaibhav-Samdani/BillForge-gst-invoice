import React from "react";
import Header from "@/components/layout/Header";
import BusinessInfoForm from "@/components/forms/BusinessInfoForm";
import ClientInfoForm from "@/components/forms/ClientInfoForm";
import LineItemsTable from "@/components/forms/LineItemsTable";
import InvoiceSummary from "@/components/forms/InvoiceSummary";
import dynamic from 'next/dynamic';

const InvoicePreviewPanel = dynamic(() => import('@/components/invoice/InvoicePreviewPanel'), { ssr: false });

const page = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-4 sm:py-6 lg:py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 px-2 sm:px-4 lg:px-8">
          <div className="space-y-4 sm:space-y-6">
            <BusinessInfoForm />
            <ClientInfoForm />
            <LineItemsTable />
            <InvoiceSummary />
          </div>
          <div className="order-first xl:order-last">
            <InvoicePreviewPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default page;