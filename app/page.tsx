"use client";
import React from "react";
import InvoiceSummary from "../components/forms/InvoiceSummary";
import LineItemsTable from "../components/forms/LineItemsTable";
import ActionButtons from "../components/invoice/Preview/ActionButtons";
import BusinessInfoForm from "@/components/forms/BusinessInfoForm";
import ClientInfoForm from "@/components/forms/ClientInfoForm";
import dynamic from "next/dynamic";
import Image from "next/image";

const page = () => {
  const InvoicePreview = dynamic(
    () => import("@/components/invoice/Preview/InvoicePreview").then((mod) => mod.default),
    { ssr: false }
  );
  return (
    <main className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-2">
        <Image
        loading="lazy"
          src="/logo.png"
          alt="BillForge Logo"
          width={50}
          height={50}
          className="mb-4 rounded-xl"
        />
        <h1 className="text-3xl font-bold mb-6">BillForge</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ">
        <section className="space-y-6 space-x-4">
          <BusinessInfoForm />
          <ClientInfoForm />
          <LineItemsTable />
          <InvoiceSummary />
          <ActionButtons />
        </section>
        <aside>
          <InvoicePreview />
        </aside>
      </div>
    </main>
  );
};

export default page;
