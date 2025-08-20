# Database Setup Documentation

## Overview

This project uses Prisma ORM with SQLite for development and PostgreSQL for production. The database supports multi-currency invoicing, recurring invoices, client portal functionality, and payment processing.

## Database Schema

### Tables

1. **client_users** - Client portal user accounts
2. **invoices** - Enhanced invoices with currency and recurring support
3. **payments** - Payment transactions and history
4. **exchange_rates** - Currency exchange rate data

### Key Features

- **Multi-currency support**: Invoices can be created in different currencies with exchange rate tracking
- **Recurring invoices**: Support for automated recurring invoice generation
- **Client portal**: Secure client authentication and invoice access
- **Payment tracking**: Complete payment history and status management

## Setup Instructions

### 1. Install Dependencies

```bash
npm install prisma @prisma/client pg @types/pg tsx
```

### 2. Environment Configuration

Create or update your `.env` file:

```env
# Development (SQLite)
DATABASE_URL="file:./dev.db"

# Production (PostgreSQL)
# DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

### 3. Generate Prisma Client

```bash
npm run db:generate
# or
npx prisma generate
```

### 4. Run Database Migrations

```bash
npm run db:migrate
# or
npx prisma migrate dev
```

### 5. Seed Database (Optional)

```bash
npm run db:seed
# or
npx tsx prisma/seed.ts
```

## Available Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:reset` - Reset database and run migrations

## Database Connection

The database connection is managed through:

- `lib/db/index.ts` - Main Prisma client instance
- `lib/db/utils.ts` - Database utility functions
- `lib/config/database.ts` - Configuration and health checks

### Usage Example

```typescript
import { prisma } from '@/lib/db';

// Create a new client user
const client = await prisma.clientUser.create({
  data: {
    email: 'client@example.com',
    passwordHash: 'hashed_password',
    name: 'Client Name',
    isVerified: true,
  },
});

// Create an invoice with relations
const invoice = await prisma.invoice.create({
  data: {
    invoiceNumber: 'INV-001',
    clientId: client.id,
    currencyCode: 'USD',
    subtotal: 1000.00,
    taxAmount: 80.00,
    totalAmount: 1080.00,
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    businessData: { /* business info */ },
    clientData: { /* client info */ },
    lineItems: [ /* line items */ ],
  },
});
```

## Data Types

### Currency Support

```typescript
interface CurrencyAmount {
  amount: number;
  currency: string;
  exchangeRate?: number;
  baseAmount?: number;
}
```

### Recurring Configuration

```typescript
interface RecurringConfig {
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number;
  startDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
  nextGenerationDate: Date;
  isActive: boolean;
}
```

## Migration History

- `20250816093037_init` - Initial database schema with all tables

## Testing

Run the database connection test:

```bash
npx tsx lib/db/test-connection.ts
```

This will verify:
- Database connectivity
- Table creation
- Basic CRUD operations
- Relationship queries

## Production Considerations

1. **Switch to PostgreSQL**: Update `DATABASE_URL` and change provider in `schema.prisma`
2. **Connection Pooling**: Configure appropriate connection limits
3. **Backup Strategy**: Implement regular database backups
4. **Monitoring**: Set up database performance monitoring
5. **Security**: Use environment variables for sensitive configuration

## Troubleshooting

### Common Issues

1. **Migration Errors**: Reset database with `npm run db:reset`
2. **Connection Issues**: Check `DATABASE_URL` format
3. **Type Errors**: Regenerate client with `npm run db:generate`

### Logs

Prisma logging is configured in `lib/db/index.ts`. Adjust log levels as needed:

```typescript
new PrismaClient({
  log: ['query', 'error', 'warn'], // Adjust as needed
});
```