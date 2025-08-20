import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a test client user
  const testClient = await prisma.clientUser.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // password: 'password123'
      name: 'Test Client',
      company: 'Test Company Inc.',
      isVerified: true,
    },
  });

  console.log('✅ Created test client:', testClient.email);

  // Create some sample exchange rates
  const exchangeRates = [
    { baseCurrency: 'USD', targetCurrency: 'EUR', rate: 0.85, source: 'test' },
    { baseCurrency: 'USD', targetCurrency: 'GBP', rate: 0.73, source: 'test' },
    { baseCurrency: 'USD', targetCurrency: 'CAD', rate: 1.25, source: 'test' },
    { baseCurrency: 'USD', targetCurrency: 'AUD', rate: 1.35, source: 'test' },
    { baseCurrency: 'USD', targetCurrency: 'JPY', rate: 110.0, source: 'test' },
  ];

  for (const rate of exchangeRates) {
    await prisma.exchangeRate.upsert({
      where: {
        baseCurrency_targetCurrency_createdAt: {
          baseCurrency: rate.baseCurrency,
          targetCurrency: rate.targetCurrency,
          createdAt: new Date(),
        },
      },
      update: { rate: rate.rate },
      create: rate,
    });
  }

  console.log('✅ Created sample exchange rates');

  // Create a sample invoice
  const sampleInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-001',
      clientId: testClient.id,
      businessData: {
        name: 'Sample Business',
        address: '123 Business St',
        city: 'Business City',
        state: 'BC',
        zipCode: '12345',
        country: 'USA',
        email: 'business@example.com',
        phone: '+1-555-0123',
      },
      clientData: {
        name: 'Test Client',
        address: '456 Client Ave',
        city: 'Client City',
        state: 'CC',
        zipCode: '67890',
        country: 'USA',
        email: 'test@example.com',
      },
      lineItems: [
        {
          description: 'Web Development Services',
          quantity: 40,
          rate: 75.00,
          amount: 3000.00,
        },
        {
          description: 'Design Consultation',
          quantity: 10,
          rate: 100.00,
          amount: 1000.00,
        },
      ],
      currencyCode: 'USD',
      subtotal: 4000.00,
      taxAmount: 320.00, // 8% tax
      totalAmount: 4320.00,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  console.log('✅ Created sample invoice:', sampleInvoice.invoiceNumber);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });