import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db/client"
import { renderToBuffer } from "@react-pdf/renderer"
import { InvoiceDoc } from "@/components/template/Invoice"
import React from "react"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
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
    
    const currency = {
      code: invoice.currencyCode,
      symbol: getCurrencySymbol(invoice.currencyCode),
      name: getCurrencyName(invoice.currencyCode),
      decimalPlaces: 2
    }

    const totals = {
      subtotal: invoice.subtotal,
      tax: invoice.taxAmount,
      total: invoice.totalAmount
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
      })
    )

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
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

function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
    'INR': '₹'
  }
  return symbols[code] || '$'
}

function getCurrencyName(code: string): string {
  const names: Record<string, string> = {
    'USD': 'US Dollar',
    'EUR': 'Euro',
    'GBP': 'British Pound',
    'CAD': 'Canadian Dollar',
    'AUD': 'Australian Dollar',
    'JPY': 'Japanese Yen',
    'INR': 'Indian Rupee'
  }
  return names[code] || 'US Dollar'
}