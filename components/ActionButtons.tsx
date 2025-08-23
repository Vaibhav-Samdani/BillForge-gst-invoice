'use client';
import { Button } from "@/components/ui/button";
import useInvoiceStore, { useSafeInvoiceTotals } from "@/lib/store";
import { Share2, Mail, Printer } from "lucide-react";
import { toast } from "sonner";
import { InvoiceDoc } from "./template/Invoice";
import { formatDate } from "@/lib/utils";
import { pdf } from "@react-pdf/renderer";
import { useState } from "react";


export default function ActionButtons() {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const totals = useSafeInvoiceTotals();
  const invoiceNumber = useInvoiceStore((state) => state.invoiceNumber);
  const invoiceDate = useInvoiceStore((state) => state.invoiceDate);
  const business = useInvoiceStore((state) => state.business);
  const client = useInvoiceStore((state) => state.client);
  const items = useInvoiceStore((state) => state.items);
  const selectedCurrency = useInvoiceStore((state) => state.selectedCurrency);


  const generatePdfBlob = async (): Promise<Blob> => {
    const doc = (
      <InvoiceDoc
        business={business}
        client={client}
        items={items}
        invoiceNumber={invoiceNumber}
        invoiceDate={formatDate(invoiceDate)}
        totals={totals}
        currency={selectedCurrency}
      />
    );
    
    return await pdf(doc).toBlob();
  };

  const shareViaWhatsApp = async () => {
    try {
      setIsGeneratingPdf(true);
      toast.info("Generating PDF for sharing...");
      
      const pdfBlob = await generatePdfBlob();
      const fileName = `invoice-${invoiceNumber}-${client.name}.pdf`;
      
      // Check if Web Share API is supported and can share files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        await navigator.share({
          title: `Invoice ${invoiceNumber}`,
          text: `Invoice ${invoiceNumber} from ${business.name}`,
          files: [file]
        });
        toast.success("PDF shared successfully!");
      } else {
        // Fallback: Download the PDF and show WhatsApp message
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Open WhatsApp with message
        const message = `*Invoice ${invoiceNumber} from ${business.name}*\n\n*To:* ${client.name}\n*Total Amount:* ${selectedCurrency.symbol}${totals.total.toFixed(2)}\n\nPDF has been downloaded. Please attach it to your WhatsApp message.`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
        
        toast.success("PDF downloaded! Please attach it to WhatsApp.");
      }
    } catch (error) {
      toast.error("Failed to share via WhatsApp");
      console.error("WhatsApp sharing error:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const shareViaEmail = async () => {
    try {
      setIsGeneratingPdf(true);
      toast.info("Generating PDF for email...");
      
      const pdfBlob = await generatePdfBlob();
      const fileName = `invoice-${invoiceNumber}-${client.name}.pdf`;
      
      // Check if Web Share API is supported and can share files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        await navigator.share({
          title: `Invoice ${invoiceNumber}`,
          text: `Invoice ${invoiceNumber} from ${business.name}`,
          files: [file]
        });
        toast.success("PDF shared successfully!");
      } else {
        // Fallback: Download the PDF and open email client
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Open email client
        const subject = `Invoice ${invoiceNumber} from ${business.name}`;
        const body = `Dear ${client.name},\n\nPlease find attached your invoice.\n\n- Invoice Number: ${invoiceNumber}\n- Total Amount: ${selectedCurrency.symbol}${totals.total.toFixed(2)}\n\nBest regards,\n${business.name}`;
        
        window.location.href = `mailto:${client.email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        toast.success("PDF downloaded! Please attach it to your email.");
      }
    } catch (error) {
      toast.error("Failed to share via email");
      console.error("Email sharing error:", error);
    } finally {
      setIsGeneratingPdf(false);
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
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg flex space-x-2 z-50">
      <Button
        variant="outline"
        onClick={shareViaWhatsApp}
        disabled={isGeneratingPdf}
        className="bg-green-50 hover:bg-green-100 border-green-200"
      >
        <Share2 className="mr-2 h-4 w-4 text-green-600" /> 
        {isGeneratingPdf ? "Generating..." : "WhatsApp"}
      </Button>

      <Button
        variant="outline"
        onClick={shareViaEmail}
        disabled={isGeneratingPdf}
        className="bg-blue-50 hover:bg-blue-100 border-blue-200"
      >
        <Mail className="mr-2 h-4 w-4 text-blue-600" /> 
        {isGeneratingPdf ? "Generating..." : "Email"}
      </Button>

      <Button
        variant="outline"
        onClick={printInvoice}
        className="bg-purple-50 hover:bg-purple-100 border-purple-200"
      >
        <Printer className="mr-2 h-4 w-4 text-purple-600" /> Print
      </Button>

      
    </div>
  );
}
