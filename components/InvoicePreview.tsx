"use client";

import useInvoiceStore, { useSafeInvoiceTotals } from "@/lib/store";
import { InvoiceDoc } from "./template/Invoice";
import { formatDate } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Button } from "./ui/button";
import { useState } from "react";

export default function InvoicePreview() {
  const [previewError, setPreviewError] = useState<string | null>(null);
  
  const business = useInvoiceStore((state) => state.business);
  const client = useInvoiceStore((state) => state.client);
  const items = useInvoiceStore((state) => state.items);
  const invoiceNumber = useInvoiceStore((state) => state.invoiceNumber);
  const invoiceDate = useInvoiceStore((state) => state.invoiceDate);
  const selectedCurrency = useInvoiceStore((state) => state.selectedCurrency);

  const totals = useSafeInvoiceTotals();

  const PDFViewer = dynamic(() => import("./pdf/PDFViewerWrapper"), {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    ),
  });
  const PDFDownloadLink = dynamic(
    () => import("./pdf/PDFDownloadLinkWrapper"),
    { ssr: false }
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-4">
      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        <PDFDownloadLink
          document={
            <InvoiceDoc
              business={business}
              client={client}
              items={items}
              invoiceNumber={invoiceNumber}
              invoiceDate={formatDate(invoiceDate)}
              totals={totals}
              currency={selectedCurrency}
            />
          }
          fileName={`invoice-${invoiceNumber}-${client.name}.pdf`}
          className="text-white no-underline"
        >
          {({ loading }) =>
            loading ? "Loading document..." : "📥 Download now!"
          }
        </PDFDownloadLink>
      </Button>

      <div className="w-full h-[600px] border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        {previewError ? (
          <div className="flex items-center justify-center h-full bg-red-50">
            <div className="text-center">
              <p className="text-red-600 font-medium">Preview Error</p>
              <p className="text-red-500 text-sm mt-1">{previewError}</p>
              <Button 
                onClick={() => setPreviewError(null)} 
                className="mt-3"
                variant="outline"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <PDFViewer 
            width="100%" 
            height="100%"
            showToolbar={true}
          >
            <InvoiceDoc
              business={business}
              client={client}
              items={items}
              invoiceNumber={invoiceNumber}
              invoiceDate={formatDate(invoiceDate)}
              totals={totals}
              currency={selectedCurrency}
            />
          </PDFViewer>
        )}
      </div>
    </div>
  );
}
