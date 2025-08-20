"use client";
import React from "react";
import IntegratedInvoiceApp from "@/components/IntegratedInvoiceApp";
import Image from "next/image";

const page = () => {
  return (
    <main>
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Image
            loading="lazy"
            src="/logo.png"
            alt="BillForge Logo"
            width={50}
            height={50}
            className="rounded-xl"
          />
          <h1 className="text-3xl font-bold">BillForge</h1>
        </div>
        
        <IntegratedInvoiceApp
          enableMultiCurrency={true}
          enableRecurringInvoices={true}
          showClientPortal={false} // Can be enabled based on user permissions
        />
      </div>
    </main>
  );
};

export default page;
