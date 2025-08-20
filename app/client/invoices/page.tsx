"use client"

import { useState } from "react"
import { ClientPortalLayout } from "@/components/client/ClientPortalLayout"
import { ClientInvoiceList } from "@/components/client/ClientInvoiceList"
import { InvoiceDetailView } from "@/components/client/InvoiceDetailView"

export default function ClientInvoicesPage() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)

  const handleViewInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId)
  }

  const handleBackToList = () => {
    setSelectedInvoiceId(null)
  }

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/client/invoices/${invoiceId}/pdf`)
      if (!response.ok) throw new Error('Failed to download PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      // TODO: Show error toast/notification
    }
  }

  const handlePayInvoice = (invoiceId: string) => {
    // TODO: Implement payment flow
    console.log('Pay invoice:', invoiceId)
    // This would typically redirect to a payment page or open a payment modal
  }

  return (
    <ClientPortalLayout currentPage="invoices">
      {selectedInvoiceId ? (
        <InvoiceDetailView
          invoiceId={selectedInvoiceId}
          onBack={handleBackToList}
          onDownloadPDF={handleDownloadPDF}
          onPayInvoice={handlePayInvoice}
        />
      ) : (
        <ClientInvoiceList
          onViewInvoice={handleViewInvoice}
          onDownloadPDF={handleDownloadPDF}
          onPayInvoice={handlePayInvoice}
        />
      )}
    </ClientPortalLayout>
  )
}