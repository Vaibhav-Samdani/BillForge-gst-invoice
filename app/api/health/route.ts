import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkDatabaseConnection } from '@/lib/config/database';

export async function GET() {
  try {
    // Check database connection
    const isConnected = await checkDatabaseConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Database connection failed',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    // Get basic stats
    const stats = {
      clients: await prisma.clientUser.count(),
      invoices: await prisma.invoice.count(),
      payments: await prisma.payment.count(),
      exchangeRates: await prisma.exchangeRate.count(),
    };

    return NextResponse.json({
      status: 'healthy',
      message: 'Database connection successful',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}