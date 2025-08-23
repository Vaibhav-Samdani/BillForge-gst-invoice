import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db/client"

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
      },
      include: {
        payments: {
          orderBy: {
            processedAt: 'desc'
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    // Calculate amounts
    const totalPaid = invoice.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
    
    const amountDue = invoice.totalAmount - totalPaid

    // Transform data for client
    const transformedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      createdAt: invoice.createdAt.toISOString().split('T')[0],
      paidAt: invoice.paidAt?.toISOString().split('T')[0],
      
      // Financial details
      currency: invoice.currencyCode,
      exchangeRate: invoice.exchangeRate,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      amountPaid: totalPaid,
      amountDue: amountDue,
      
      // Business and client info
      business: invoice.businessData,
      client: invoice.clientData,
      
      // Line items
      items: invoice.lineItems,
      
      // Additional info from business data
      notes: (invoice.businessData as any)?.notes,
      terms: (invoice.businessData as any)?.terms,
      paymentInstructions: (invoice.businessData as any)?.paymentInstructions,
      
      // Payment history
      payments: invoice.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currencyCode,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        status: payment.status,
        processedAt: payment.processedAt.toISOString(),
        refundedAt: payment.refundedAt?.toISOString(),
        refundAmount: payment.refundAmount
      }))
    }

    return NextResponse.json({
      invoice: transformedInvoice
    })

  } catch (error) {
    console.error('Error fetching invoice details:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}