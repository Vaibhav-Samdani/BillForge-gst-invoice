"use client";
import React from 'react';
import useInvoiceStore from '@/lib/store';
import { toast } from 'sonner';

export default function Header() {
  const client = useInvoiceStore((state) => state.client);
  const business = useInvoiceStore((state) => state.business);
  const invoiceNumber = useInvoiceStore((state) => state.invoiceNumber);

  const shareViaWhatsApp = () => {
    const message = `Hello ${client.name}, here is your invoice ${invoiceNumber} from ${business.name}.`;
    const whatsappUrl = `https://wa.me/${client.phone}?text=${encodeURIComponent(message)}`;
    try {
      window.open(whatsappUrl, '_blank');
      toast.info("WhatsApp sharing initiated");
    } catch (error) {
      toast.error("Failed to open WhatsApp");
      console.error("WhatsApp sharing error:", error);
    }
  };

  const shareViaEmail = () => {
    const subject = `Invoice ${invoiceNumber} from ${business.name}`;
    const body = `Hello ${client.name},\n\nPlease find attached your invoice.\n\nThank you,\n${business.name}`;
    const mailtoUrl = `mailto:${client.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
      window.location.href = mailtoUrl;
      toast.info("Email client opened");
    } catch (error) {
      toast.error("Failed to open email client");
      console.error("Email sharing error:", error);
    }
  };

  const printInvoice = () => {
    try {
      window.print();
      toast.info("Print dialog opened");
    } catch (error) {
      toast.error("Printing failed");
      console.error("Print error:", error);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img src="/logo.png" alt="BillForge Logo" className="h-8 w-auto" />
            <span className="text-xl font-bold ml-2 text-gray-800">BillForge</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button onClick={shareViaWhatsApp} className="btn btn-secondary btn-sm sm:btn-md">
              <span className="material-icons mr-1 sm:mr-2 text-xs sm:text-sm">message</span>
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button onClick={shareViaEmail} className="btn btn-secondary btn-sm sm:btn-md">
              <span className="material-icons mr-1 sm:mr-2 text-xs sm:text-sm">email</span>
              <span className="hidden sm:inline">Email</span>
            </button>
            <button onClick={printInvoice} className="btn btn-secondary btn-sm sm:btn-md">
              <span className="material-icons mr-1 sm:mr-2 text-xs sm:text-sm">print</span>
              <span className="hidden lg:inline">Print</span>
              <span className="lg:hidden sm:inline hidden">Print</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
