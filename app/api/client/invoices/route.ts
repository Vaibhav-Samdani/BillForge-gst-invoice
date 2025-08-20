import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db/client"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'invoiceDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {
      clientId: user.id
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (paymentStatus && paymentStatus !== 'all') {
      where.paymentStatus = paymentStatus
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { businessData: { path: ['name'], string_contains: search } }
      ]
    }

    // Get total count
    const totalCount = await prisma.invoice.count({ where })

    // Get invoices with pagination
    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        paymentStatus: true,
        invoiceDate: true,
        dueDate: true,
        createdAt: true,
        totalAmount: true,
        currencyCode: true,
        businessData: true,
        paidAt: true
      }
    })

    // Transform data for client
    const transformedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.totalAmount,
      currency: invoice.currencyCode,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      createdAt: invoice.createdAt.toISOString().split('T')[0],
      businessName: (invoice.businessData as any)?.name || 'Unknown Business',
      description: (invoice.businessData as any)?.description,
      paidAt: invoice.paidAt?.toISOString().split('T')[0]
    }))

    return NextResponse.json({
      invoices: transformedInvoices,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching client invoices:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}