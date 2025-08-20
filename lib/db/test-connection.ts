import { prisma } from './index';
import { checkDatabaseConnection } from '../config/database';

/**
 * Test database connection and basic operations
 */
export async function testDatabaseConnection(): Promise<void> {
  console.log('🔍 Testing database connection...');

  try {
    // Test basic connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Test client users table
    const clientCount = await prisma.clientUser.count();
    console.log(`✅ Client users table: ${clientCount} records`);

    // Test invoices table
    const invoiceCount = await prisma.invoice.count();
    console.log(`✅ Invoices table: ${invoiceCount} records`);

    // Test payments table
    const paymentCount = await prisma.payment.count();
    console.log(`✅ Payments table: ${paymentCount} records`);

    // Test exchange rates table
    const rateCount = await prisma.exchangeRate.count();
    console.log(`✅ Exchange rates table: ${rateCount} records`);

    // Test a complex query with relations
    const invoicesWithClients = await prisma.invoice.findMany({
      include: {
        client: true,
        payments: true,
      },
      take: 1,
    });

    if (invoicesWithClients.length > 0) {
      console.log('✅ Complex query with relations working');
      console.log(`   Sample invoice: ${invoicesWithClients[0].invoiceNumber}`);
      console.log(`   Client: ${invoicesWithClients[0].client.name}`);
    }

    console.log('🎉 All database tests passed!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}