import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db/client"
import { renderToBuffer } from "@react-pdf/renderer"
import { InvoiceDoc } from "@/components/template/Invoice"
import React from "react"
import { SUPPORTED_CURRENCIES } from "@/lib/types/invoice"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: id,
        clientId: user.id // Ensure client can only access their own invoices
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    // Transform data for PDF generation
    const business = invoice.businessData as any
    const client = invoice.clientData as any
    const items = invoice.lineItems as any[]
    
    // Get currency information
    const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === invoice.currencyCode) || SUPPORTED_CURRENCIES[0]
    
    const currency = {
      code: currencyInfo.code,
      symbol: currencyInfo.symbol,
      name: currencyInfo.name,
      decimalPlaces: currencyInfo.decimalPlaces
    }

    // Ensure totals structure matches what InvoiceDoc expects
    // Note: The current schema only has taxAmount, so we'll split it for CGST/SGST display
    const taxAmount = invoice.taxAmount || 0;
    const totals = {
      subtotal: invoice.subtotal || 0,
      cgst: taxAmount / 2, // Split tax equally between CGST and SGST
      sgst: taxAmount / 2,
      igst: 0, // IGST is 0 when CGST/SGST are used
      round_off: 0, // Not tracked in current schema
      total: invoice.totalAmount || 0
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoiceDoc, {
        business,
        client,
        items,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
        totals,
        currency
      }) as any
    )

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}-${currency.code}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}