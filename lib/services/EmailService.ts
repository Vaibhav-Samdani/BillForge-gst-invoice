import { EnhancedInvoice, Payment } from '../types';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailOptions {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export class EmailService {
  private static fromEmail = process.env.SMTP_FROM || 'noreply@invoiceapp.com';
  private static companyName = process.env.COMPANY_NAME || 'Invoice Generator';

  /**
   * Send payment confirmation email to client
   */
  static async sendPaymentConfirmation(
    invoice: EnhancedInvoice,
    payment: Payment,
    clientEmail: string
  ): Promise<boolean> {
    try {
      const template = this.generatePaymentConfirmationTemplate(invoice, payment);
      
      const emailOptions: EmailOptions = {
        to: clientEmail,
        from: this.fromEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      await this.sendEmail(emailOptions);
      return true;
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
      return false;
    }
  }

  /**
   * Send payment receipt email to client
   */
  static async sendPaymentReceipt(
    invoice: EnhancedInvoice,
    payment: Payment,
    clientEmail: string,
    receiptPdf?: Buffer
  ): Promise<boolean> {
    try {
      const template = this.generatePaymentReceiptTemplate(invoice, payment);
      
      const emailOptions: EmailOptions = {
        to: clientEmail,
        from: this.fromEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      // Add PDF attachment if provided
      if (receiptPdf) {
        emailOptions.attachments = [
          {
            filename: `receipt-${invoice.invoiceNumber}-${payment.transactionId}.pdf`,
            content: receiptPdf,
            contentType: 'application/pdf',
          },
        ];
      }

      await this.sendEmail(emailOptions);
      return true;
    } catch (error) {
      console.error('Error sending payment receipt:', error);
      return false;
    }
  }

  /**
   * Send payment notification to business owner
   */
  static async sendPaymentNotification(
    invoice: EnhancedInvoice,
    payment: Payment,
    businessEmail: string
  ): Promise<boolean> {
    try {
      const template = this.generatePaymentNotificationTemplate(invoice, payment);
      
      const emailOptions: EmailOptions = {
        to: businessEmail,
        from: this.fromEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      await this.sendEmail(emailOptions);
      return true;
    } catch (error) {
      console.error('Error sending payment notification:', error);
      return false;
    }
  }

  /**
   * Generate payment confirmation email template
   */
  private static generatePaymentConfirmationTemplate(
    invoice: EnhancedInvoice,
    payment: Payment
  ): EmailTemplate {
    const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    };

    const subject = `Payment Confirmation - Invoice ${invoice.invoiceNumber}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .success-badge { background: #10b981; color: white; padding: 10px; border-radius: 5px; text-align: center; margin: 20px 0; }
            .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Successful!</h1>
              <p>Thank you for your payment</p>
            </div>
            
            <div class="content">
              <div class="success-badge">
                <strong>✓ PAYMENT CONFIRMED</strong>
              </div>
              
              <p>Dear ${invoice.client.name},</p>
              
              <p>We have successfully received your payment for Invoice ${invoice.invoiceNumber}. Here are the details:</p>
              
              <div class="details">
                <h3>Payment Details</h3>
                <div class="detail-row">
                  <span class="label">Invoice Number:</span>
                  <span class="value">${invoice.invoiceNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Payment Amount:</span>
                  <span class="value">${formatCurrency(payment.amount.amount, payment.amount.currency)}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Transaction ID:</span>
                  <span class="value">${payment.transactionId}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Payment Date:</span>
                  <span class="value">${formatDate(payment.processedAt)}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Payment Method:</span>
                  <span class="value">${payment.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                </div>
              </div>
              
              <div class="details">
                <h3>Invoice Summary</h3>
                <div class="detail-row">
                  <span class="label">Subtotal:</span>
                  <span class="value">${formatCurrency(invoice.totals.subtotal, invoice.currency.code)}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Tax:</span>
                  <span class="value">${formatCurrency(invoice.totals.cgst + invoice.totals.sgst + invoice.totals.igst, invoice.currency.code)}</span>
                </div>
                <div class="detail-row">
                  <span class="label"><strong>Total Paid:</strong></span>
                  <span class="value"><strong>${formatCurrency(invoice.totals.total, invoice.currency.code)}</strong></span>
                </div>
              </div>
              
              <p>Your invoice has been marked as paid and a receipt has been generated. You can download your receipt from your account dashboard.</p>
              
              <p>If you have any questions about this payment, please don't hesitate to contact us.</p>
              
              <p>Thank you for your business!</p>
              
              <p>Best regards,<br>
              ${this.companyName} Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>© ${new Date().getFullYear()} ${this.companyName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Payment Confirmation - Invoice ${invoice.invoiceNumber}

Dear ${invoice.client.name},

We have successfully received your payment for Invoice ${invoice.invoiceNumber}.

Payment Details:
- Invoice Number: ${invoice.invoiceNumber}
- Payment Amount: ${formatCurrency(payment.amount.amount, payment.amount.currency)}
- Transaction ID: ${payment.transactionId}
- Payment Date: ${formatDate(payment.processedAt)}
- Payment Method: ${payment.paymentMethod.replace('_', ' ').toUpperCase()}

Invoice Summary:
- Subtotal: ${formatCurrency(invoice.totals.subtotal, invoice.currency.code)}
- Tax: ${formatCurrency(invoice.totals.cgst + invoice.totals.sgst + invoice.totals.igst, invoice.currency.code)}
- Total Paid: ${formatCurrency(invoice.totals.total, invoice.currency.code)}

Your invoice has been marked as paid and a receipt has been generated.

Thank you for your business!

Best regards,
${this.companyName} Team
    `;

    return { subject, html, text };
  }

  /**
   * Generate payment receipt email template
   */
  private static generatePaymentReceiptTemplate(
    invoice: EnhancedInvoice,
    payment: Payment
  ): EmailTemplate {
    const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    };

    const subject = `Payment Receipt - Invoice ${invoice.invoiceNumber}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Receipt</h1>
              <p>Receipt for Invoice ${invoice.invoiceNumber}</p>
            </div>
            
            <div class="content">
              <p>Dear ${invoice.client.name},</p>
              
              <p>Please find attached your payment receipt for Invoice ${invoice.invoiceNumber}.</p>
              
              <p>Payment Amount: ${formatCurrency(payment.amount.amount, payment.amount.currency)}</p>
              <p>Transaction ID: ${payment.transactionId}</p>
              
              <p>Thank you for your business!</p>
              
              <p>Best regards,<br>
              ${this.companyName} Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Payment Receipt - Invoice ${invoice.invoiceNumber}

Dear ${invoice.client.name},

Please find attached your payment receipt for Invoice ${invoice.invoiceNumber}.

Payment Amount: ${formatCurrency(payment.amount.amount, payment.amount.currency)}
Transaction ID: ${payment.transactionId}

Thank you for your business!

Best regards,
${this.companyName} Team
    `;

    return { subject, html, text };
  }

  /**
   * Generate payment notification template for business owner
   */
  private static generatePaymentNotificationTemplate(
    invoice: EnhancedInvoice,
    payment: Payment
  ): EmailTemplate {
    const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    };

    const subject = `Payment Received - Invoice ${invoice.invoiceNumber}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .label { font-weight: bold; color: #666; }
            .value { color: #333; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Payment Received!</h1>
              <p>Invoice ${invoice.invoiceNumber} has been paid</p>
            </div>
            
            <div class="content">
              <p>Great news! You've received a payment for Invoice ${invoice.invoiceNumber}.</p>
              
              <div class="details">
                <h3>Payment Details</h3>
                <div class="detail-row">
                  <span class="label">Client:</span>
                  <span class="value">${invoice.client.name}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Invoice Number:</span>
                  <span class="value">${invoice.invoiceNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Amount Received:</span>
                  <span class="value">${formatCurrency(payment.amount.amount, payment.amount.currency)}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Transaction ID:</span>
                  <span class="value">${payment.transactionId}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Payment Date:</span>
                  <span class="value">${formatDate(payment.processedAt)}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Payment Method:</span>
                  <span class="value">${payment.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                </div>
              </div>
              
              <p>The invoice status has been automatically updated to "Paid" and a confirmation email has been sent to the client.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Payment Received - Invoice ${invoice.invoiceNumber}

Great news! You've received a payment for Invoice ${invoice.invoiceNumber}.

Payment Details:
- Client: ${invoice.client.name}
- Invoice Number: ${invoice.invoiceNumber}
- Amount Received: ${formatCurrency(payment.amount.amount, payment.amount.currency)}
- Transaction ID: ${payment.transactionId}
- Payment Date: ${formatDate(payment.processedAt)}
- Payment Method: ${payment.paymentMethod.replace('_', ' ').toUpperCase()}

The invoice status has been automatically updated to "Paid" and a confirmation email has been sent to the client.
    `;

    return { subject, html, text };
  }

  /**
   * Send email using configured email service
   */
  private static async sendEmail(options: EmailOptions): Promise<void> {
    // In a real implementation, this would use a service like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    // - Postmark
    // - Mailgun

    // For now, we'll simulate email sending
    console.log('📧 Sending email:', {
      to: options.to,
      subject: options.subject,
      hasAttachments: !!options.attachments?.length,
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production, you would implement actual email sending here
    // Example with Nodemailer:
    /*
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail(options);
    */
  }
}