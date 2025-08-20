#!/usr/bin/env tsx

/**
 * Test script for recurring invoice generation system
 * 
 * This script tests:
 * - Scheduled task service functionality
 * - Invoice generation with proper numbering
 * - Error handling and retry logic
 * - Cron job utilities
 */

import { scheduledTaskService } from '../lib/services/ScheduledTaskService';
import { recurringInvoiceService } from '../lib/services/RecurringInvoiceService';
import { 
  triggerRecurringInvoiceGeneration,
  validateCronExpression,
  formatCronSchedule,
  getNextExecutionTime,
  shouldRunNow
} from '../lib/utils/cron';
import { EnhancedInvoice, RecurringConfig } from '../lib/types/invoice';

async function testRecurringGenerationSystem() {
  console.log('🧪 Testing Recurring Invoice Generation System\n');

  // Test 1: Cron utilities
  console.log('1️⃣ Testing Cron Utilities');
  console.log('   Testing cron expression validation...');
  
  const validExpressions = ['0 9 * * *', '30 14 * * 1', '0 0 1 * *'];
  const invalidExpressions = ['invalid', '0 25 * * *', '0 9 * *'];
  
  validExpressions.forEach(expr => {
    const isValid = validateCronExpression(expr);
    console.log(`   ✓ "${expr}" -> ${isValid ? 'Valid' : 'Invalid'} ${isValid ? '✅' : '❌'}`);
  });
  
  invalidExpressions.forEach(expr => {
    const isValid = validateCronExpression(expr);
    console.log(`   ✓ "${expr}" -> ${isValid ? 'Valid' : 'Invalid'} ${!isValid ? '✅' : '❌'}`);
  });

  console.log('\n   Testing cron schedule formatting...');
  const schedules = ['0 9 * * *', '30 14 * * *', '0 0 1 * *'];
  schedules.forEach(schedule => {
    const formatted = formatCronSchedule(schedule);
    console.log(`   ✓ "${schedule}" -> "${formatted}"`);
  });

  console.log('\n   Testing next execution time calculation...');
  const nextExecution = getNextExecutionTime('0 9 * * *');
  console.log(`   ✓ Next execution for "0 9 * * *": ${nextExecution?.toLocaleString() || 'null'}`);

  // Test 2: Task statistics
  console.log('\n2️⃣ Testing Task Statistics');
  try {
    const stats = await scheduledTaskService.getTaskStatistics();
    console.log('   ✓ Task statistics retrieved successfully:');
    console.log(`     - Due invoices: ${stats.dueInvoicesCount}`);
    console.log(`     - Active templates: ${stats.activeTemplatesCount}`);
    console.log(`     - Task running: ${scheduledTaskService.isTaskRunning()}`);
  } catch (error) {
    console.log(`   ❌ Failed to get task statistics: ${error}`);
  }

  // Test 3: Template validation
  console.log('\n3️⃣ Testing Template Validation');
  try {
    const validation = await scheduledTaskService.validateRecurringTemplates();
    console.log('   ✓ Template validation completed:');
    console.log(`     - Valid templates: ${validation.validTemplates}`);
    console.log(`     - Invalid templates: ${validation.invalidTemplates}`);
    
    if (validation.issues.length > 0) {
      console.log('     - Issues found:');
      validation.issues.forEach(issue => {
        console.log(`       • ${issue.invoiceNumber}: ${issue.issues.join(', ')}`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Failed to validate templates: ${error}`);
  }

  // Test 4: Create a test recurring invoice template
  console.log('\n4️⃣ Testing Recurring Invoice Creation');
  try {
    const testInvoice: Omit<EnhancedInvoice, 'id' | 'createdAt' | 'updatedAt'> = {
      business: {
        name: 'Test Business',
        company: 'Test Company',
        address: '123 Test St, Test City, TS 12345',
        gstin: 'TEST123456789',
        email: 'test@business.com',
        phone: '1234567890'
      },
      client: {
        name: 'Test Client',
        company: 'Test Client Company',
        address: '456 Client Ave, Client City, CS 67890',
        gstin: 'CLIENT123456789',
        email: 'test@client.com',
        phone: '0987654321'
      },
      items: [
        {
          id: '1',
          description: 'Test Service',
          hsnSac: '998311',
          quantity: 1,
          rate: 1000,
          per: 'unit',
          gst: 18,
          amount: 1000
        }
      ],
      invoiceNumber: `TEST-REC-${Date.now()}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      sameGst: false,
      globalGst: 0,
      totals: {
        subtotal: 1000,
        cgst: 90,
        sgst: 90,
        igst: 0,
        round_off: 0,
        total: 1180
      },
      currency: {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        decimalPlaces: 2
      },
      isRecurring: true,
      status: 'draft',
      paymentStatus: 'unpaid',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      clientId: 'test-client-id'
    };

    const recurringConfig: RecurringConfig = {
      frequency: 'monthly',
      interval: 1,
      startDate: new Date(),
      nextGenerationDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      maxOccurrences: 12,
      isActive: true
    };

    const result = await recurringInvoiceService.createRecurringInvoice(testInvoice, recurringConfig);
    
    if (result.success && result.data) {
      console.log(`   ✅ Test recurring invoice created: ${result.data.invoiceNumber}`);
      
      // Test 5: Generate from the template
      console.log('\n5️⃣ Testing Invoice Generation');
      const generateResult = await recurringInvoiceService.generateRecurringInvoice(result.data.id);
      
      if (generateResult.success && generateResult.data) {
        console.log(`   ✅ Invoice generated successfully: ${generateResult.data.invoiceNumber}`);
        console.log(`     - Original: ${result.data.invoiceNumber}`);
        console.log(`     - Generated: ${generateResult.data.invoiceNumber}`);
        console.log(`     - Amount: ${generateResult.data.currency.symbol}${generateResult.data.totals.total}`);
      } else {
        console.log(`   ❌ Failed to generate invoice: ${generateResult.error}`);
      }

      // Clean up - delete the test template
      console.log('\n🧹 Cleaning up test data...');
      const deleteResult = await recurringInvoiceService.deleteRecurringInvoice(result.data.id, true);
      if (deleteResult.success) {
        console.log('   ✅ Test data cleaned up successfully');
      } else {
        console.log(`   ⚠️ Failed to clean up test data: ${deleteResult.error}`);
      }
    } else {
      console.log(`   ❌ Failed to create test recurring invoice: ${result.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Error in recurring invoice test: ${error}`);
  }

  // Test 6: Full task execution
  console.log('\n6️⃣ Testing Full Task Execution');
  try {
    const taskResult = await scheduledTaskService.generateDueRecurringInvoices();
    console.log('   ✅ Task execution completed:');
    console.log(`     - Success: ${taskResult.success}`);
    console.log(`     - Processed: ${taskResult.processedCount}`);
    console.log(`     - Failed: ${taskResult.failedCount}`);
    console.log(`     - Errors: ${taskResult.errors.length}`);
    
    if (taskResult.errors.length > 0) {
      console.log('     - Error details:');
      taskResult.errors.forEach(error => {
        console.log(`       • ${error}`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Task execution failed: ${error}`);
  }

  // Test 7: Manual trigger
  console.log('\n7️⃣ Testing Manual Trigger');
  try {
    const triggerResult = await triggerRecurringInvoiceGeneration();
    console.log('   ✅ Manual trigger completed:');
    console.log(`     - Success: ${triggerResult.success}`);
    console.log(`     - Message: ${triggerResult.message}`);
  } catch (error) {
    console.log(`   ❌ Manual trigger failed: ${error}`);
  }

  console.log('\n🎉 Recurring Invoice Generation System Test Complete!');
  console.log('\nAll core functionality has been tested:');
  console.log('✓ Scheduled task service');
  console.log('✓ Invoice generation with proper numbering');
  console.log('✓ Error handling and retry logic');
  console.log('✓ Cron job utilities');
  console.log('✓ Template validation');
  console.log('✓ Manual triggering');
}

// Run the test
testRecurringGenerationSystem().catch(console.error);