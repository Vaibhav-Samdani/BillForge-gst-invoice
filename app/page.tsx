"use client";
import React from "react";
import Header from "@/components/layout/Header";
import BusinessInfoForm from "@/components/forms/BusinessInfoForm";
import ClientInfoForm from "@/components/forms/ClientInfoForm";
import LineItemsTableNew from "@/components/forms/LineItemsTableNew";
import InvoiceSummaryNew from "@/components/forms/InvoiceSummaryNew";
import InvoicePreviewPanel from "@/components/invoice/InvoicePreviewPanel";

const page = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <BusinessInfoForm />
            <ClientInfoForm />
            <LineItemsTableNew />
            <InvoiceSummaryNew />
          </div>
          <InvoicePreviewPanel />
        </div>
      </main>
    </div>
  );
};

export default page;
