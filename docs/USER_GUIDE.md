# BillForge User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Multi-Currency Support](#multi-currency-support)
3. [Recurring Invoices](#recurring-invoices)
4. [Client Portal](#client-portal)
5. [Payment Processing](#payment-processing)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### Creating Your First Invoice

1. **Business Information**: Fill in your company details including name, address, GST number, and contact information.
2. **Client Information**: Enter your client's details including company name, address, and GST number.
3. **Line Items**: Add products or services with descriptions, quantities, rates, and GST percentages.
4. **Review**: Check the invoice preview on the right side of the screen.
5. **Generate**: Click "Generate PDF" to create your invoice.

### Basic Navigation

- **Invoice Generator**: Main tab for creating standard invoices
- **Recurring Invoices**: Manage automated recurring billing
- **Client Portal**: Access client-facing features (if enabled)

## Multi-Currency Support

### Selecting Currency

1. In the Business Information section, you'll find a **Currency Selector**
2. Choose from supported currencies: USD, EUR, GBP, CAD, AUD, JPY, INR
3. Exchange rates are automatically fetched and updated hourly

### Currency Features

- **Real-time Exchange Rates**: Rates are fetched from reliable APIs
- **Automatic Conversion**: Line item amounts are converted when currency changes
- **Proper Formatting**: Amounts display with correct currency symbols and decimal places
- **Exchange Rate Display**: View current rates and last update time

### Working with Different Currencies

1. **Creating Multi-Currency Invoices**:
   - Select your preferred currency before adding line items
   - All calculations will be performed in the selected currency
   - Exchange rates are stored with the invoice for historical accuracy

2. **Currency Conversion**:
   - When changing currency, existing line items are automatically converted
   - Conversion uses current exchange rates
   - Original amounts are preserved if conversion fails

## Recurring Invoices

### Setting Up Recurring Invoices

1. **Create Base Invoice**: Start with a regular invoice containing all necessary details
2. **Enable Recurring**: Toggle the "Make this a recurring invoice" switch
3. **Configure Schedule**:
   - **Frequency**: Choose from Weekly, Monthly, Quarterly, or Yearly
   - **Start Date**: When the first recurring invoice should be generated
   - **End Date** (optional): When to stop generating invoices
   - **Max Occurrences** (optional): Limit the number of invoices generated

### Managing Recurring Invoices

1. **View Schedules**: Go to the "Recurring Invoices" tab to see all active schedules
2. **Edit Schedules**: Modify frequency, dates, or template content
3. **Pause/Resume**: Temporarily stop or restart recurring generation
4. **Cancel**: Stop future generations while preserving historical invoices

### Recurring Invoice Features

- **Automatic Generation**: Invoices are created automatically based on schedule
- **Sequential Numbering**: Each generated invoice gets a unique number
- **Template Preservation**: Original invoice data is maintained
- **Date Updates**: Invoice and due dates are automatically updated
- **Error Handling**: Failed generations are retried automatically

## Client Portal

### Client Registration and Login

1. **Registration**:
   - Clients register with email and password
   - Email verification is required before access
   - Strong password requirements are enforced

2. **Login Process**:
   - Secure authentication with session management
   - Account lockout after failed attempts
   - Password reset functionality available

### Client Portal Features

1. **Dashboard**:
   - Overview of all invoices and payment status
   - Outstanding balance summary
   - Recent activity feed

2. **Invoice Management**:
   - View all invoices with filtering and sorting
   - Download PDF copies of invoices
   - Track payment status and due dates
   - Overdue invoice highlighting

3. **Payment Processing**:
   - Secure online payment for unpaid invoices
   - Multiple payment methods supported
   - Payment confirmation and receipts
   - Payment history tracking

## Payment Processing

### Supported Payment Methods

- **Credit/Debit Cards**: Visa, MasterCard, American Express
- **Digital Wallets**: PayPal, Apple Pay, Google Pay
- **Bank Transfers**: ACH and wire transfers (where supported)

### Payment Security

- **PCI DSS Compliance**: All payment data is handled securely
- **Encryption**: Sensitive data is encrypted in transit and at rest
- **Tokenization**: Card details are never stored directly
- **Fraud Protection**: Advanced fraud detection and prevention

### Payment Workflow

1. **Invoice Generation**: Create invoice with payment terms
2. **Client Access**: Client views invoice in portal
3. **Payment Initiation**: Client clicks "Pay Now" button
4. **Secure Processing**: Payment is processed through secure gateway
5. **Confirmation**: Both parties receive payment confirmation
6. **Status Update**: Invoice status is automatically updated

## Advanced Features

### Exchange Rate Management

- **Automatic Updates**: Rates refresh every hour
- **Manual Refresh**: Force rate updates when needed
- **Rate History**: View historical exchange rates
- **Offline Mode**: Cached rates used when API is unavailable

### Invoice Templates

- **Customization**: Modify invoice layout and branding
- **Multi-language**: Support for different languages
- **Tax Calculations**: Automatic GST/VAT calculations
- **Rounding**: Proper currency rounding rules

### Data Export

- **PDF Generation**: High-quality PDF invoices
- **CSV Export**: Export invoice data for accounting
- **Payment Reports**: Detailed payment history reports
- **Tax Reports**: GST/VAT reporting capabilities

### Security Features

- **Data Encryption**: All sensitive data is encrypted
- **Secure Sessions**: Session management with timeout
- **Rate Limiting**: Protection against abuse
- **Audit Logging**: Comprehensive security logging

## Troubleshooting

### Common Issues

1. **Currency Rates Not Loading**:
   - Check internet connection
   - Try refreshing the page
   - Rates may be cached for up to 1 hour

2. **Payment Processing Errors**:
   - Verify payment method details
   - Check for sufficient funds
   - Contact support if issues persist

3. **Recurring Invoice Not Generated**:
   - Check if schedule is active
   - Verify next generation date
   - Review error logs in admin panel

4. **Client Portal Access Issues**:
   - Confirm email verification
   - Check password requirements
   - Try password reset if needed

### Error Messages

- **"Currency API Unavailable"**: Using cached rates, try again later
- **"Payment Declined"**: Contact your bank or try different payment method
- **"Invalid GST Number"**: Check GST number format and validity
- **"Session Expired"**: Please log in again

### Performance Tips

1. **Large Invoices**: Break down large invoices into smaller line items
2. **Slow Loading**: Clear browser cache and cookies
3. **Mobile Usage**: Use responsive design features for better mobile experience
4. **Offline Mode**: Some features work offline with cached data

### Getting Help

1. **Documentation**: Check this user guide and API documentation
2. **Error Logs**: Review browser console for technical errors
3. **Support**: Contact support team with specific error messages
4. **Community**: Join user community for tips and best practices

## Best Practices

### Invoice Management

- **Consistent Numbering**: Use sequential invoice numbers
- **Clear Descriptions**: Provide detailed line item descriptions
- **Proper GST**: Ensure correct GST numbers and rates
- **Timely Generation**: Generate invoices promptly after service delivery

### Security

- **Strong Passwords**: Use complex passwords for all accounts
- **Regular Updates**: Keep software updated
- **Secure Networks**: Use secure internet connections
- **Data Backup**: Regularly backup invoice data

### Multi-Currency

- **Rate Monitoring**: Monitor exchange rates for significant changes
- **Currency Consistency**: Use consistent currency for related invoices
- **Rate Documentation**: Keep records of exchange rates used
- **Client Communication**: Inform clients about currency and rates

### Recurring Invoices

- **Template Accuracy**: Ensure recurring templates are accurate
- **Schedule Review**: Regularly review recurring schedules
- **Client Notification**: Inform clients about recurring billing
- **Error Monitoring**: Monitor for generation errors

This user guide covers the essential features and functionality of BillForge. For technical details and API documentation, please refer to the API documentation.