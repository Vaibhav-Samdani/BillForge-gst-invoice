"use client";

import useInvoiceStore, { useSafeInvoiceTotals } from "@/lib/store";
import { InvoiceDoc } from "./template/Invoice";
import { formatDate } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Button } from "./ui/button";

export default function InvoicePreview() {
  const business = useInvoiceStore((state) => state.business);
  const client = useInvoiceStore((state) => state.client);
  const items = useInvoiceStore((state) => state.items);
  const invoiceNumber = useInvoiceStore((state) => state.invoiceNumber);
  const invoiceDate = useInvoiceStore((state) => state.invoiceDate);

  const totals = useSafeInvoiceTotals();

  const PDFViewer = dynamic(() => import("./pdf/PDFViewerWrapper"), {
    ssr: false,
  });
  const PDFDownloadLink = dynamic(
    () => import("./pdf/PDFDownloadLinkWrapper"),
    { ssr: false }
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-4">
      <Button>
        <PDFDownloadLink
          document={
            <InvoiceDoc
              business={business}
              client={client}
              items={items}
              invoiceNumber={invoiceNumber}
              invoiceDate={formatDate(invoiceDate)}
              totals={totals}
            />
          }
          fileName={`invoice-${invoiceNumber}-${client.name}.pdf`}
        >
          {({  loading, }) =>
            loading ? "Loading document..." : "Download now!"
          }
        </PDFDownloadLink>
      </Button>

      <PDFViewer className="w-full h-screen">
        <InvoiceDoc
          business={business}
          client={client}
          items={items}
          invoiceNumber={invoiceNumber}
          invoiceDate={formatDate(invoiceDate)}
          totals={totals}
        />
      </PDFViewer>
    </div>
  );
}
