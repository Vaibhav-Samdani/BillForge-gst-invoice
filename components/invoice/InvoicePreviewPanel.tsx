"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import useInvoiceStore from "@/lib/store";
import { InvoiceDoc } from "./Templates/Invoice";
import { ModernInvoiceTemplate } from "./Templates/ModernTemplate";
import { MinimalistInvoiceTemplate } from "./Templates/MinimalistTemplate";
import { CreativeInvoiceTemplate } from "./Templates/CreativeTemplate";
import { usePDF } from '@react-pdf/renderer';
import { toast } from 'sonner';

const PDFViewerWrapper = dynamic(() => import('@/components/pdf/PDFViewerWrapper'), {
  ssr: false,
});

const TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional invoice design",
    component: InvoiceDoc,
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean and professional",
    component: ModernInvoiceTemplate,
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Simple and elegant",
    component: MinimalistInvoiceTemplate,
  },
  {
    id: "creative",
    name: "Creative",
    description: "Colorful and engaging",
    component: CreativeInvoiceTemplate,
  },
];

interface DownloadButtonProps {
  doc: React.ReactElement;
  fileName: string;
  children: ({ loading, onClick }: { loading: boolean; onClick: () => void; }) => React.ReactNode;
}

const DownloadButton = ({ doc, fileName, children }: DownloadButtonProps) => {
  const [instance] = usePDF({ document: doc });

  const handleClick = () => {
    if (instance.loading) return;
    if (instance.error) {
      toast.error('Failed to generate PDF. Please try again.');
      console.error(instance.error);
      return;
    }
    if (instance.url) {
      const link = document.createElement('a');
      link.href = instance.url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return children({ loading: instance.loading, onClick: handleClick });
};

export default function InvoicePreviewPanel() {
  const [selectedTemplate, setSelectedTemplate] = useState("classic");
  const business = useInvoiceStore((state) => state.business);
  const client = useInvoiceStore((state) => state.client);
  const items = useInvoiceStore((state) => state.items);
  const invoiceNumber = useInvoiceStore((state) => state.invoiceNumber);
  const invoiceDate = useInvoiceStore((state) => state.invoiceDate);
  const totals = useInvoiceStore((state) => state.totals);

  const selectedTemplateData = TEMPLATES.find(t => t.id === selectedTemplate);
  const TemplateComponent = selectedTemplateData?.component || InvoiceDoc;

  const invoiceProps = {
    business,
    client,
    items,
    invoiceNumber,
    invoiceDate,
    totals,
  };

  return (
    <div className="xl:sticky top-10 h-full">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full flex flex-col">
        {/* Template Selector */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Choose Template</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-3 text-left rounded-lg border-2 transition-all ${
                  selectedTemplate === template.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-gray-500">{template.description}</div>
              </button>
            ))}
          </div>
          
          {/* Download Button */}
          <DownloadButton
            doc={<TemplateComponent {...invoiceProps} />}
            fileName={`invoice-${invoiceNumber || "draft"}-${selectedTemplate}.pdf`}
          >
            {({ loading, onClick }: { loading: boolean, onClick: () => void }) => (
              <button 
                className="btn btn-primary w-full"
                disabled={loading}
                onClick={onClick}
              >
                <span className="material-icons mr-2 text-sm">download</span>
                {loading ? "Generating..." : `Download ${selectedTemplateData?.name} Template`}
              </button>
            )}
          </DownloadButton>
        </div>

        {/* Preview Area */}
        <div className="p-4 bg-gray-100 flex-grow overflow-y-auto">
          <div className="bg-gray-700 p-4 rounded-t-lg flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <button className="text-white">
                <span className="material-icons">chevron_left</span>
              </button>
              <span className="text-sm">1 / 1</span>
              <button className="text-white">
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-white">
                <span className="material-icons">remove</span>
              </button>
              <button className="text-white">
                <span className="material-icons">add</span>
              </button>
              <div className="w-px h-5 bg-gray-500"></div>
              <DownloadButton
                doc={<TemplateComponent {...invoiceProps} />}
                fileName={`invoice-${invoiceNumber || "draft"}-${selectedTemplate}.pdf`}
              >
                {({ loading, onClick }: { loading: boolean, onClick: () => void }) => (
                  <button className="text-white" onClick={onClick}>
                    <span className="material-icons">download</span>
                  </button>
                )}
              </DownloadButton>
              <button className="text-white">
                <span className="material-icons">print</span>
              </button>
              <button className="text-white">
                <span className="material-icons">more_vert</span>
              </button>
            </div>
          </div>
          <div className="bg-white shadow-lg h-full">
            <PDFViewerWrapper className="w-full h-full">
              <TemplateComponent {...invoiceProps} />
            </PDFViewerWrapper>
          </div>
        </div>
      </div>
    </div>
  );
}