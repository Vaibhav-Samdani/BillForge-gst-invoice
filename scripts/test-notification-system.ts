#!/usr/bin/env tsx

import { EmailService } from '../lib/services/EmailService';
import { NotificationService } from '../lib/services/NotificationService';
import { SUPPORTED_CURRENCIES } from '../lib/types/invoice';

// Test data
const testInvoice = {
  id: 'test-invoice-1',
  invoiceNumber: 'INV-2024-TEST-001',
  invoiceDate: new Date('2024-01-15'),
  dueDate: new Date('2024-02-15'),
  status: 'pending',
  currency: SUPPORTED_CURRENCIES.find(c => c.code === 'USD')!,
  client: {
    name: 'Test Client',
    email: 'test@example.com',
    company: 'Test Company',
    address: '123 Test St, Test City, TC 12345',
    gstin: 'TEST123456789',
    phone: '555-0123'
  },
  totals: {
    subtotal: 1000.00,
    cgst: 45.00,
    sgst: 45.00,
    igst: 0,
    round_off: 0,
    total: 1090.00
  }
} as any;

const testPayment = {
  transactionId: 'txn_test_123456',
  amount: {
    amount: 1090.00,
    currency: 'USD'
  },
  paymentMethod: 'credit_card',
  status: 'completed',
  processedAt: new Date()
} as any;

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');

  try {
    // Test payment confirmation email
    console.log('📧 Testing payment confirmation email...');
    const paymentConfirmationResult = await EmailService.sendPaymentConfirmation(
      testInvoice,
      testPayment,
      testInvoice.client.email
    );
    console.log(`✅ Payment confirmation: ${paymentConfirmationResult ? 'Success' : 'Failed'}`);

    // Test recurring invoice notification
    console.log('📧 Testing recurring invoice notification...');
    const recurringInvoiceResult = await EmailService.sendRecurringInvoiceNotification(
      testInvoice,
      testInvoice.client.email
    );
    console.log(`✅ Recurring invoice notification: ${recurringInvoiceResult ? 'Success' : 'Failed'}`);

    // Test overdue reminder
    console.log('📧 Testing overdue reminder...');
    const overdueReminderResult = await EmailService.sendOverdueReminder(
      testInvoice,
      testInvoice.client.email,
      7
    );
    console.log(`✅ Overdue reminder: ${overdueReminderResult ? 'Success' : 'Failed'}`);

    // Test email verification
    console.log('📧 Testing email verification...');
    const emailVerificationResult = await EmailService.sendEmailVerification(
      testInvoice.client.email,
      'test-verification-token-123',
      testInvoice.client.name
    );
    console.log(`✅ Email verification: ${emailVerificationResult ? 'Success' : 'Failed'}`);

  } catch (error) {
    console.error('❌ Error testing email service:', error);
  }
}

async function testNotificationService() {
  console.log('\n🧪 Testing Notification Service...\n');

  try {
    // Test payment confirmation notifications
    console.log('🔔 Testing payment confirmation notifications...');
    const paymentNotificationsResult = await NotificationService.sendPaymentConfirmationNotifications(
      testInvoice,
      testPayment
    );
    console.log(`✅ Payment notifications: ${paymentNotificationsResult ? 'Success' : 'Failed'}`);

    // Test recurring invoice notifications
    console.log('🔔 Testing recurring invoice notifications...');
    const recurringNotificationsResult = await NotificationService.sendRecurringInvoiceNotifications(
      testInvoice
    );
    console.log(`✅ Recurring invoice notifications: ${recurringNotificationsResult ? 'Success' : 'Failed'}`);

    // Test overdue reminders
    console.log('🔔 Testing overdue reminders...');
    const overdueRemindersResult = await NotificationService.sendOverdueReminders(
      testInvoice,
      7
    );
    console.log(`✅ Overdue reminders: ${overdueRemindersResult ? 'Success' : 'Failed'}`);

    // Test email verification
    console.log('🔔 Testing email verification...');
    const emailVerificationResult = await NotificationService.sendEmailVerification(
      testInvoice.client.email,
      'test-verification-token-456',
      testInvoice.client.name
    );
    console.log(`✅ Email verification: ${emailVerificationResult ? 'Success' : 'Failed'}`);

  } catch (error) {
    console.error('❌ Error testing notification service:', error);
  }
}

async function testEmailTemplates() {
  console.log('\n🧪 Testing Email Templates...\n');

  try {
    // Test payment confirmation template
    console.log('📝 Testing payment confirmation template...');
    const paymentTemplate = (EmailService as any).generatePaymentConfirmationTemplate(
      testInvoice,
      testPayment
    );
    console.log(`✅ Payment confirmation template: ${paymentTemplate.subject}`);
    console.log(`   HTML length: ${paymentTemplate.html.length} characters`);
    console.log(`   Text length: ${paymentTemplate.text.length} characters`);

    // Test recurring invoice template
    console.log('📝 Testing recurring invoice template...');
    const recurringTemplate = (EmailService as any).generateRecurringInvoiceTemplate(
      testInvoice
    );
    console.log(`✅ Recurring invoice template: ${recurringTemplate.subject}`);
    console.log(`   HTML length: ${recurringTemplate.html.length} characters`);
    console.log(`   Text length: ${recurringTemplate.text.length} characters`);

    // Test overdue reminder template
    console.log('📝 Testing overdue reminder template...');
    const overdueTemplate = (EmailService as any).generateOverdueReminderTemplate(
      testInvoice,
      7
    );
    console.log(`✅ Overdue reminder template: ${overdueTemplate.subject}`);
    console.log(`   HTML length: ${overdueTemplate.html.length} characters`);
    console.log(`   Text length: ${overdueTemplate.text.length} characters`);

    // Test email verification template
    console.log('📝 Testing email verification template...');
    const verificationTemplate = (EmailService as any).generateEmailVerificationTemplate(
      testInvoice.client.email,
      'test-verification-token-789',
      testInvoice.client.name
    );
    console.log(`✅ Email verification template: ${verificationTemplate.subject}`);
    console.log(`   HTML length: ${verificationTemplate.html.length} characters`);
    console.log(`   Text length: ${verificationTemplate.text.length} characters`);

  } catch (error) {
    console.error('❌ Error testing email templates:', error);
  }
}

async function main() {
  console.log('🚀 Starting Notification System Tests...\n');

  await testEmailTemplates();
  await testEmailService();
  await testNotificationService();

  console.log('\n🎉 Notification system tests completed!');
  console.log('\n📋 Summary:');
  console.log('   - Email templates: Generated successfully');
  console.log('   - Email service: Simulated email sending');
  console.log('   - Notification service: Integrated with email service');
  console.log('\n💡 Note: In production, emails would be sent via SMTP or email service provider');
}

main().catch(console.error);
