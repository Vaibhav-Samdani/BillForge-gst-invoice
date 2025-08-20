# BillForge API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Error Handling](#error-handling)
4. [Invoice Management](#invoice-management)
5. [Currency Operations](#currency-operations)
6. [Recurring Invoices](#recurring-invoices)
7. [Client Management](#client-management)
8. [Payment Processing](#payment-processing)
9. [Security](#security)
10. [Webhooks](#webhooks)

## Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

### Overview
BillForge uses JWT-based authentication with secure session management.

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user and create session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt_token_here",
    "expiresAt": "2024-01-01T12:00:00Z"
  }
}
```

#### POST /api/auth/register
Register new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "company": "Acme Corp"
}
```

#### POST /api/auth/logout
Invalidate current session.

#### POST /api/auth/refresh
Refresh authentication token.

### Authorization Headers
Include JWT token in all authenticated requests:
```
Authorization: Bearer <jwt_token>
```

## Rate Limiting

### Limits by Endpoint Type
- **Authentication**: 5 requests per 15 minutes
- **Payment Processing**: 10 requests per minute
- **General API**: 100 requests per minute
- **Currency Rates**: 60 requests per hour

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "req_123456"
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED`: Missing or invalid authentication
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid input data
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `CURRENCY_API_ERROR`: External currency service error
- `PAYMENT_PROCESSING_ERROR`: Payment gateway error

## Invoice Management

### GET /api/invoices
Retrieve list of invoices with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `status`: Filter by status (draft, sent, paid, overdue)
- `currency`: Filter by currency code
- `client_id`: Filter by client ID
- `date_from`: Start date filter (ISO 8601)
- `date_to`: End date filter (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "inv_123",
        "invoiceNumber": "INV-001",
        "status": "sent",
        "paymentStatus": "unpaid",
        "currency": {
          "code": "USD",
          "symbol": "$",
          "name": "US Dollar"
        },
        "total": 1500.00,
        "dueDate": "2024-01-15",
        "client": {
          "id": "client_456",
          "name": "Acme Corp",
          "email": "billing@acme.com"
        },
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

### POST /api/invoices
Create new invoice.

**Request Body:**
```json
{
  "invoiceNumber": "INV-001",
  "clientId": "client_456",
  "currency": "USD",
  "dueDate": "2024-01-15",
  "lineItems": [
    {
      "description": "Web Development Services",
      "quantity": 40,
      "rate": 75.00,
      "taxRate": 0.18
    }
  ],
  "businessInfo": {
    "name": "Your Company",
    "address": "123 Business St",
    "gstin": "12ABCDE1234F1Z5"
  },
  "clientInfo": {
    "name": "Client Company",
    "address": "456 Client Ave",
    "gstin": "98ZYXWV9876E1A2"
  }
}
```

### GET /api/invoices/{id}
Retrieve specific invoice by ID.

### PUT /api/invoices/{id}
Update existing invoice.

### DELETE /api/invoices/{id}
Delete invoice (soft delete).

### POST /api/invoices/{id}/send
Send invoice to client via email.

### GET /api/invoices/{id}/pdf
Generate and download PDF version of invoice.

## Currency Operations

### GET /api/currencies
Get list of supported currencies.

**Response:**
```json
{
  "success": true,
  "data": {
    "currencies": [
      {
        "code": "USD",
        "symbol": "$",
        "name": "US Dollar",
        "decimalPlaces": 2
      },
      {
        "code": "EUR",
        "symbol": "€",
        "name": "Euro",
        "decimalPlaces": 2
      }
    ]
  }
}
```

### GET /api/exchange-rates
Get current exchange rates.

**Query Parameters:**
- `base`: Base currency code (default: USD)
- `targets`: Comma-separated target currencies

**Response:**
```json
{
  "success": true,
  "data": {
    "rates": [
      {
        "baseCurrency": "USD",
        "targetCurrency": "EUR",
        "rate": 0.85,
        "timestamp": "2024-01-01T12:00:00Z",
        "source": "ExchangeRate-API"
      }
    ],
    "lastUpdated": "2024-01-01T12:00:00Z"
  }
}
```

### POST /api/exchange-rates/refresh
Force refresh of exchange rates.

## Recurring Invoices

### GET /api/recurring-invoices
Get list of recurring invoice templates.

### POST /api/recurring-invoices
Create new recurring invoice template.

**Request Body:**
```json
{
  "templateInvoiceId": "inv_123",
  "frequency": "monthly",
  "interval": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "maxOccurrences": 12,
  "isActive": true
}
```

### PUT /api/recurring-invoices/{id}
Update recurring invoice configuration.

### DELETE /api/recurring-invoices/{id}
Cancel recurring invoice (stops future generations).

### POST /api/recurring-invoices/{id}/generate
Manually generate next invoice from template.

### GET /api/recurring-invoices/{id}/history
Get history of generated invoices from template.

## Client Management

### GET /api/clients
Get list of clients.

### POST /api/clients
Create new client.

**Request Body:**
```json
{
  "name": "John Doe",
  "company": "Acme Corp",
  "email": "john@acme.com",
  "phone": "+1-555-0123",
  "address": "123 Business St, City, State 12345",
  "gstin": "12ABCDE1234F1Z5"
}
```

### GET /api/clients/{id}
Get specific client details.

### PUT /api/clients/{id}
Update client information.

### DELETE /api/clients/{id}
Delete client (soft delete).

### GET /api/clients/{id}/invoices
Get all invoices for specific client.

## Payment Processing

### POST /api/payments/intent
Create payment intent for invoice.

**Request Body:**
```json
{
  "invoiceId": "inv_123",
  "amount": 1500.00,
  "currency": "USD",
  "paymentMethod": "card"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_123456",
    "clientSecret": "pi_123456_secret_abc",
    "amount": 1500.00,
    "currency": "USD"
  }
}
```

### POST /api/payments/confirm
Confirm payment completion.

### GET /api/payments
Get payment history.

### GET /api/payments/{id}
Get specific payment details.

### POST /api/payments/{id}/refund
Process payment refund.

## Security

### Security Headers
All API responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### Input Validation
- All inputs are validated and sanitized
- SQL injection protection via parameterized queries
- XSS protection via input sanitization
- CSRF protection for state-changing operations

### Data Encryption
- All sensitive data encrypted at rest
- TLS 1.3 for data in transit
- Payment data tokenized (PCI DSS compliant)

## Webhooks

### Webhook Events
- `invoice.created`
- `invoice.updated`
- `invoice.paid`
- `payment.completed`
- `payment.failed`
- `recurring_invoice.generated`

### Webhook Payload Format
```json
{
  "id": "evt_123456",
  "type": "invoice.paid",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "invoice": {
      "id": "inv_123",
      "status": "paid",
      "paymentStatus": "paid"
    }
  }
}
```

### Webhook Security
- HMAC-SHA256 signature verification
- Timestamp validation to prevent replay attacks
- IP allowlist for webhook endpoints

## SDK Examples

### JavaScript/Node.js
```javascript
const BillForge = require('@billforge/sdk');

const client = new BillForge({
  apiKey: 'your_api_key',
  baseUrl: 'https://your-domain.com/api'
});

// Create invoice
const invoice = await client.invoices.create({
  invoiceNumber: 'INV-001',
  clientId: 'client_123',
  currency: 'USD',
  lineItems: [...]
});

// Get exchange rates
const rates = await client.currencies.getExchangeRates('USD', ['EUR', 'GBP']);
```

### Python
```python
from billforge import BillForgeClient

client = BillForgeClient(
    api_key='your_api_key',
    base_url='https://your-domain.com/api'
)

# Create invoice
invoice = client.invoices.create({
    'invoiceNumber': 'INV-001',
    'clientId': 'client_123',
    'currency': 'USD',
    'lineItems': [...]
})

# Get exchange rates
rates = client.currencies.get_exchange_rates('USD', ['EUR', 'GBP'])
```

## Testing

### Test Environment
```
Base URL: https://sandbox.billforge.com/api
```

### Test Data
- Test credit cards provided for payment testing
- Sandbox mode for all external integrations
- Mock webhook endpoints available

### API Testing Tools
- Postman collection available
- OpenAPI/Swagger specification provided
- Integration test suite included

## Support

### Documentation
- User Guide: `/docs/USER_GUIDE.md`
- API Reference: This document
- SDK Documentation: Available per language

### Contact
- Technical Support: support@billforge.com
- API Issues: api-support@billforge.com
- Security Issues: security@billforge.com

### Status Page
Monitor API status and uptime: https://status.billforge.com

This API documentation provides comprehensive coverage of all BillForge API endpoints and functionality. For additional examples and use cases, please refer to the SDK documentation and user guide.