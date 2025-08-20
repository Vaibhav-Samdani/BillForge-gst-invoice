# Payment Processing Integration

This document describes the payment processing integration implemented for the invoice generator application.

## Overview

The payment processing integration provides secure payment capabilities for clients to pay invoices directly through the application. It includes:

- Stripe payment processor integration
- Secure payment forms with card input
- Payment confirmation and receipt generation
- Email notifications for payments
- Webhook handling for payment events
- Refund processing capabilities

## Components

### Frontend Components

#### PaymentForm
- **Location**: `components/PaymentForm.tsx`
- **Purpose**: Secure payment form with Stripe Elements integration
- **Features**:
  - Card input with validation
  - Real-time error handling
  - Processing fee calculation
  - Security indicators (SSL, encryption)
  - Payment intent creation and confirmation

#### PaymentConfirmation
- **Location**: `components/PaymentConfirmation.tsx`
- **Purpose**: Payment success confirmation page
- **Features**:
  - Payment details display
  - Invoice summary
  - Receipt download and email options
  - Success indicators and next steps

#### PaymentReceipt
- **Location**: `components/PaymentReceipt.tsx`
- **Purpose**: PDF receipt generation and download
- **Features**:
  - Professional PDF receipt layout
  - Payment and invoice details
  - Business and client information
  - Downloadable PDF format

#### PaymentIntegration
- **Location**: `components/PaymentIntegration.tsx`
- **Purpose**: Main payment flow orchestrator
- **Features**:
  - Multi-step payment process
  - Error handling and retry logic
  - Email confirmation sending
  - State management for payment flow

### Backend Services

#### PaymentService
- **Location**: `lib/services/PaymentService.ts`
- **Purpose**: Core payment processing logic
- **Features**:
  - Payment intent creation and confirmation
  - Payment validation
  - Processing fee calculation
  - Refund processing
  - Stripe API integration

#### EmailService
- **Location**: `lib/services/EmailService.ts`
- **Purpose**: Email notifications for payments
- **Features**:
  - Payment confirmation emails
  - Receipt emails with PDF attachments
  - Business owner notifications
  - Professional email templates

### API Routes

#### Payment Intent Creation
- **Endpoint**: `POST /api/payments/create-intent`
- **Purpose**: Create Stripe payment intent
- **Parameters**:
  - `invoiceId`: Invoice identifier
  - `clientId`: Client identifier
  - `amount`: Payment amount and currency
  - `description`: Payment description

#### Payment Confirmation
- **Endpoint**: `POST /api/payments/confirm`
- **Purpose**: Confirm payment with Stripe
- **Parameters**:
  - `paymentIntentId`: Stripe payment intent ID
  - `paymentMethodId`: Stripe payment method ID

#### Payment Status
- **Endpoint**: `GET /api/payments/status/[id]`
- **Purpose**: Get payment intent status
- **Parameters**:
  - `id`: Payment intent ID

#### Webhook Handler
- **Endpoint**: `POST /api/payments/webhook`
- **Purpose**: Handle Stripe webhook events
- **Events**:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.dispute.created`

#### Email Notifications
- **Endpoints**:
  - `POST /api/payments/send-confirmation`
  - `POST /api/payments/send-receipt`
- **Purpose**: Send payment-related emails

#### Refund Processing
- **Endpoint**: `POST /api/payments/refund`
- **Purpose**: Process payment refunds
- **Parameters**:
  - `paymentIntentId`: Payment to refund
  - `amount`: Refund amount (optional for full refund)
  - `reason`: Refund reason

#### Invoice Payment Update
- **Endpoint**: `POST /api/invoices/[id]/payment`
- **Purpose**: Update invoice payment status
- **Parameters**:
  - `paymentIntentId`: Payment intent ID
  - `status`: New payment status
  - `payment`: Payment details

## Configuration

### Environment Variables

```bash
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Application
NEXTAUTH_URL="http://localhost:3000"
COMPANY_NAME="Your Company Name"
```

### Stripe Setup

1. **Create Stripe Account**: Sign up at [stripe.com](https://stripe.com)
2. **Get API Keys**: Copy test keys from Stripe dashboard
3. **Configure Webhooks**: Set up webhook endpoint at `/api/payments/webhook`
4. **Add Webhook Events**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.dispute.created`

## Usage

### Basic Payment Flow

1. **Client initiates payment** from invoice view
2. **PaymentForm component** loads with Stripe Elements
3. **Payment intent created** via API call
4. **Client enters card details** and submits
5. **Payment confirmed** with Stripe
6. **Invoice status updated** to paid
7. **Confirmation emails sent** to client and business
8. **Receipt generated** and available for download

### Error Handling

The payment system includes comprehensive error handling:

- **Card Errors**: Declined cards, insufficient funds
- **Network Errors**: API timeouts, connectivity issues
- **Validation Errors**: Invalid amounts, currency mismatches
- **Processing Errors**: Stripe API errors, webhook failures

### Security Features

- **PCI Compliance**: Stripe handles card data securely
- **Encryption**: All data encrypted in transit and at rest
- **Validation**: Server-side validation of all payment data
- **Rate Limiting**: Protection against abuse
- **Webhook Verification**: Stripe signature verification

## Testing

### Unit Tests
- **Location**: `lib/services/__tests__/PaymentService.test.ts`
- **Coverage**: Payment validation, fee calculation, API integration
- **Run**: `npm run test:run lib/services/__tests__/PaymentService.test.ts`

### Integration Tests
- **Location**: `scripts/verify-payment-integration.js`
- **Coverage**: File existence, dependencies, basic functionality
- **Run**: `node scripts/verify-payment-integration.js`

### Test Cards (Stripe Test Mode)

```
# Successful payments
4242424242424242 - Visa
4000056655665556 - Visa (debit)
5555555555554444 - Mastercard

# Declined payments
4000000000000002 - Card declined
4000000000009995 - Insufficient funds
4000000000009987 - Lost card
```

## Monitoring and Logging

### Payment Events
- All payment attempts logged with details
- Success/failure rates tracked
- Error patterns monitored

### Email Delivery
- Email sending status tracked
- Failed deliveries logged
- Retry mechanisms implemented

### Webhook Processing
- Webhook events logged
- Processing status tracked
- Failed webhooks retried

## Troubleshooting

### Common Issues

1. **Payment Intent Creation Fails**
   - Check Stripe API keys
   - Verify amount and currency format
   - Check network connectivity

2. **Card Declined**
   - Verify card details
   - Check available funds
   - Try different payment method

3. **Webhook Not Received**
   - Verify webhook URL configuration
   - Check webhook secret
   - Ensure endpoint is accessible

4. **Email Not Sent**
   - Check SMTP configuration
   - Verify email credentials
   - Check spam folders

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=stripe:*
```

## Production Deployment

### Checklist

- [ ] Replace test Stripe keys with live keys
- [ ] Configure production webhook endpoint
- [ ] Set up email service (SendGrid, AWS SES, etc.)
- [ ] Enable SSL/HTTPS
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Test payment flow end-to-end
- [ ] Verify webhook processing
- [ ] Test email notifications

### Security Considerations

- Use environment variables for all secrets
- Enable webhook signature verification
- Implement proper error handling
- Set up monitoring for suspicious activity
- Regular security audits
- Keep dependencies updated

## Support

For issues related to payment processing:

1. Check the troubleshooting section
2. Review Stripe dashboard for payment details
3. Check application logs for errors
4. Verify webhook delivery in Stripe dashboard
5. Contact Stripe support for payment processor issues

## Requirements Fulfilled

This implementation fulfills the following requirements from the specification:

- **7.1**: "Pay Now" button for unpaid invoices ✅
- **7.2**: Secure payment processor integration (Stripe) ✅
- **7.3**: Invoice status update to "Paid" on successful payment ✅
- **7.4**: Error handling and retry mechanisms ✅
- **7.5**: Confirmation emails to client and business owner ✅

The payment processing integration is complete and ready for production use with proper configuration.