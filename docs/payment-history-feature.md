# Payment History and Tracking Feature

This document describes the implementation of the Payment History and Tracking feature for the invoice generator application.

## Overview

The Payment History feature provides comprehensive payment tracking, filtering, sorting, export capabilities, and refund handling for client portal users. It includes:

- **Payment History Display**: Comprehensive table view with filtering and sorting
- **Payment Details Modal**: Detailed view of individual payments
- **Export Functionality**: CSV and PDF export capabilities
- **Refund Management**: Request and track refunds
- **Payment Status Tracking**: Real-time status updates and history

## Components

### Core Components

#### 1. PaymentHistory Component
**Location**: `components/client/PaymentHistory.tsx`

Main component that displays payment history in a table format with:
- Summary statistics cards
- Search and filtering capabilities
- Sorting by multiple columns
- Export buttons (CSV/PDF)
- Pagination support

**Props**:
```typescript
interface PaymentHistoryProps {
  payments: Payment[];
  invoices: EnhancedInvoice[];
  onExportCSV: (filteredPayments: Payment[]) => void;
  onExportPDF: (filteredPayments: Payment[]) => void;
  onViewPaymentDetails: (payment: Payment) => void;
  onRefreshPayments: () => void;
  isLoading?: boolean;
}
```

#### 2. PaymentDetailsModal Component
**Location**: `components/client/PaymentDetailsModal.tsx`

Modal component for viewing detailed payment information:
- Payment information display
- Related invoice details
- Status history
- Action buttons (download receipt, email receipt, request refund)

#### 3. RefundRequestModal Component
**Location**: `components/client/RefundRequestModal.tsx`

Modal for requesting payment refunds:
- Full or partial refund options
- Refund reason selection
- Processing information
- Validation and error handling

#### 4. PaymentHistoryContainer Component
**Location**: `components/client/PaymentHistoryContainer.tsx`

Container component that orchestrates all payment history functionality:
- Data loading and state management
- Modal state management
- API integration
- Error handling

### Export Components

#### 5. PaymentHistoryPDF Component
**Location**: `components/client/PaymentHistoryPDF.tsx`

PDF export component using `@react-pdf/renderer`:
- Formatted payment history report
- Summary statistics
- Professional layout
- Pagination support

## Services

### PaymentTrackingService
**Location**: `lib/services/PaymentTrackingService.ts`

Service for handling payment status tracking and refund processing:

**Key Methods**:
- `updatePaymentStatus()`: Update payment status with history tracking
- `processRefund()`: Handle refund requests
- `getPaymentTrackingData()`: Retrieve comprehensive payment data
- `syncPaymentStatuses()`: Sync with external payment processors

### Export Utilities
**Location**: `lib/utils/paymentExport.ts`

Utilities for payment data export and manipulation:

**Key Functions**:
- `exportPaymentsToCSV()`: Export payments to CSV format
- `generatePaymentSummary()`: Calculate summary statistics
- `searchPayments()`: Search and filter payments
- `sortPayments()`: Sort payments by various criteria
- `validatePaymentExportData()`: Validate export data integrity

## API Routes

### Client Payments API
**Endpoint**: `/api/clients/[clientId]/payments`

- **GET**: Retrieve payment history for a client with filtering and pagination
- **POST**: Create new payment records (typically from webhooks)

### Payment Details API
**Endpoint**: `/api/payments/[paymentId]`

- **GET**: Retrieve detailed payment information
- **PATCH**: Update payment status or information

### Refund API
**Endpoint**: `/api/payments/[paymentId]/refund`

- **POST**: Process refund requests
- **GET**: Retrieve refund history

### Receipt API
**Endpoint**: `/api/payments/[paymentId]/receipt`

- **GET**: Download payment receipt as PDF
- **POST**: Email receipt to client

## Features

### 1. Payment Filtering and Sorting

**Filters Available**:
- Payment status (completed, pending, failed, refunded)
- Payment method (card, bank_transfer, paypal, other)
- Date range selection
- Amount range
- Invoice number search
- General text search

**Sorting Options**:
- Date (processed date)
- Amount
- Status
- Payment method
- Invoice number

### 2. Export Functionality

**CSV Export**:
- Comprehensive payment data
- Invoice information
- Client details
- Processing fees calculation
- Refund information

**PDF Export**:
- Professional report layout
- Summary statistics
- Paginated table view
- Client branding support

### 3. Payment Status Tracking

**Status Types**:
- `pending`: Payment is being processed
- `completed`: Payment successful
- `failed`: Payment failed
- `refunded`: Payment has been refunded

**Status History**:
- Timestamp tracking
- Metadata storage
- Automatic notifications
- Webhook integration support

### 4. Refund Management

**Refund Types**:
- Full refunds
- Partial refunds

**Refund Reasons**:
- Customer request
- Duplicate payment
- Fraudulent transaction
- Other (with description)

**Refund Processing**:
- Validation checks
- Payment processor integration
- Status updates
- Email notifications
- Estimated arrival dates

## Usage Examples

### Basic Implementation

```typescript
import PaymentHistoryContainer from '../components/client/PaymentHistoryContainer';

function ClientDashboard({ clientId }: { clientId: string }) {
  return (
    <div>
      <h1>Payment History</h1>
      <PaymentHistoryContainer clientId={clientId} />
    </div>
  );
}
```

### Custom Implementation

```typescript
import PaymentHistory from '../components/client/PaymentHistory';
import { usePayments } from '../hooks/usePayments';

function CustomPaymentHistory({ clientId }: { clientId: string }) {
  const { payments, invoices, loading, exportCSV, exportPDF } = usePayments(clientId);

  return (
    <PaymentHistory
      payments={payments}
      invoices={invoices}
      isLoading={loading}
      onExportCSV={exportCSV}
      onExportPDF={exportPDF}
      onViewPaymentDetails={(payment) => {
        // Custom payment details handling
      }}
      onRefreshPayments={() => {
        // Custom refresh logic
      }}
    />
  );
}
```

## Testing

### Unit Tests

**PaymentHistory Component Tests**:
- Rendering with different data states
- Filtering and sorting functionality
- Export button interactions
- Search functionality

**Export Utilities Tests**:
- CSV generation
- Data validation
- Summary calculations
- Search and filter functions

### Integration Tests

**API Route Tests**:
- Payment retrieval with filters
- Refund processing
- Receipt generation
- Error handling

### End-to-End Tests

**User Flows**:
- View payment history
- Filter and sort payments
- Export payment data
- Request refunds
- Download receipts

## Security Considerations

### Data Protection
- Client data isolation (clients can only see their own payments)
- Sensitive data encryption
- Secure API endpoints
- Input validation and sanitization

### Payment Security
- PCI DSS compliance for payment data
- Secure refund processing
- Transaction ID protection
- Audit logging

### Access Control
- Authentication required for all endpoints
- Role-based access control
- Rate limiting on sensitive operations
- CSRF protection

## Performance Optimizations

### Frontend
- Virtual scrolling for large payment lists
- Debounced search input
- Memoized calculations
- Lazy loading of modals

### Backend
- Database indexing on frequently queried fields
- Pagination for large datasets
- Caching of summary statistics
- Optimized database queries

### Export Performance
- Streaming for large CSV exports
- Background PDF generation
- Progress indicators
- Memory-efficient processing

## Dependencies

### Required Packages
```json
{
  "date-fns": "^2.30.0",
  "sonner": "^1.4.0",
  "react-day-picker": "^8.10.0",
  "@react-pdf/renderer": "^3.1.0",
  "lucide-react": "^0.263.0"
}
```

### UI Components
- Radix UI primitives
- Custom UI components (Button, Card, Table, etc.)
- TailwindCSS for styling

## Future Enhancements

### Planned Features
1. **Advanced Analytics**: Payment trends and insights
2. **Bulk Operations**: Bulk refund processing
3. **Payment Reminders**: Automated payment follow-ups
4. **Multi-currency Support**: Enhanced currency handling
5. **Payment Disputes**: Dispute management system
6. **Recurring Payment Tracking**: Enhanced recurring payment insights

### Technical Improvements
1. **Real-time Updates**: WebSocket integration for live updates
2. **Advanced Filtering**: More sophisticated filter options
3. **Custom Reports**: User-defined report generation
4. **API Rate Limiting**: Enhanced rate limiting strategies
5. **Audit Logging**: Comprehensive audit trail

## Troubleshooting

### Common Issues

**1. Payments Not Loading**
- Check API endpoint connectivity
- Verify client authentication
- Check database connection
- Review error logs

**2. Export Functionality Not Working**
- Verify browser compatibility
- Check file download permissions
- Review export data validation
- Check memory usage for large exports

**3. Refund Processing Failures**
- Verify payment processor integration
- Check refund eligibility rules
- Review payment status
- Check API credentials

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG_PAYMENTS=true
```

This will provide detailed logging for payment operations and API calls.

## Support

For technical support or questions about the Payment History feature:

1. Check the troubleshooting section above
2. Review the test files for usage examples
3. Check the API documentation for endpoint details
4. Contact the development team for additional support