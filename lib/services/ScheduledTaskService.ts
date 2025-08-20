// Scheduled Task Service for Recurring Invoice Generation
import { recurringInvoiceService } from './RecurringInvoiceService';
import { EnhancedInvoice } from '../types/invoice';
import { DatabaseResult } from '../types/database';

// Task execution result
export interface TaskExecutionResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: string[];
  generatedInvoices: EnhancedInvoice[];
}

// Task retry configuration
export interface RetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelayMs: 1000, // 1 second
  backoffMultiplier: 2, // Double delay each retry
};

export class ScheduledTaskService {
  private isRunning = false;
  private retryConfig: RetryConfig;

  constructor(retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.retryConfig = retryConfig;
  }

  /**
   * Generate all due recurring invoices
   */
  async generateDueRecurringInvoices(): Promise<TaskExecutionResult> {
    if (this.isRunning) {
      return {
        success: false,
        processedCount: 0,
        failedCount: 0,
        errors: ['Task is already running'],
        generatedInvoices: [],
      };
    }

    this.isRunning = true;
    const result: TaskExecutionResult = {
      success: true,
      processedCount: 0,
      failedCount: 0,
      errors: [],
      generatedInvoices: [],
    };

    try {
      console.log('🔄 Starting recurring invoice generation task...');
      
      // Get all due recurring invoices
      const dueInvoicesResult = await recurringInvoiceService.getDueRecurringInvoices();
      
      if (!dueInvoicesResult.success) {
        result.success = false;
        result.errors.push(`Failed to fetch due invoices: ${dueInvoicesResult.error}`);
        return result;
      }

      const dueInvoices = dueInvoicesResult.data || [];
      console.log(`📋 Found ${dueInvoices.length} recurring invoices due for generation`);

      if (dueInvoices.length === 0) {
        console.log('✅ No recurring invoices due for generation');
        return result;
      }

      // Process each due invoice
      for (const invoice of dueInvoices) {
        try {
          const generationResult = await this.generateInvoiceWithRetry(invoice.id);
          
          if (generationResult.success && generationResult.data) {
            result.processedCount++;
            result.generatedInvoices.push(generationResult.data);
            console.log(`✅ Generated invoice ${generationResult.data.invoiceNumber} from template ${invoice.invoiceNumber}`);
          } else {
            result.failedCount++;
            result.errors.push(`Failed to generate from template ${invoice.invoiceNumber}: ${generationResult.error}`);
            console.error(`❌ Failed to generate from template ${invoice.invoiceNumber}: ${generationResult.error}`);
          }
        } catch (error) {
          result.failedCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Unexpected error generating from template ${invoice.invoiceNumber}: ${errorMessage}`);
          console.error(`❌ Unexpected error generating from template ${invoice.invoiceNumber}:`, error);
        }
      }

      // Update overall success status
      result.success = result.failedCount === 0;

      console.log(`🎉 Recurring invoice generation completed:`);
      console.log(`   - Processed: ${result.processedCount}`);
      console.log(`   - Failed: ${result.failedCount}`);
      console.log(`   - Total errors: ${result.errors.length}`);

      return result;
    } catch (error) {
      result.success = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Task execution failed: ${errorMessage}`);
      console.error('❌ Recurring invoice generation task failed:', error);
      return result;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Generate a single recurring invoice with retry logic
   */
  private async generateInvoiceWithRetry(
    templateId: string,
    attempt: number = 1
  ): Promise<DatabaseResult<EnhancedInvoice>> {
    try {
      const result = await recurringInvoiceService.generateRecurringInvoice(templateId);
      
      if (result.success) {
        return result;
      }

      // If this was the last attempt, return the failure
      if (attempt >= this.retryConfig.maxRetries) {
        return result;
      }

      // Calculate delay for next retry
      const delay = this.retryConfig.retryDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
      
      console.log(`⏳ Retrying invoice generation for template ${templateId} in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`);
      
      // Wait before retry
      await this.sleep(delay);
      
      // Retry
      return this.generateInvoiceWithRetry(templateId, attempt + 1);
    } catch (error) {
      // If this was the last attempt, return the failure
      if (attempt >= this.retryConfig.maxRetries) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Calculate delay for next retry
      const delay = this.retryConfig.retryDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
      
      console.log(`⏳ Retrying invoice generation for template ${templateId} in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries}) after error: ${error}`);
      
      // Wait before retry
      await this.sleep(delay);
      
      // Retry
      return this.generateInvoiceWithRetry(templateId, attempt + 1);
    }
  }

  /**
   * Check if the task is currently running
   */
  isTaskRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get task execution statistics
   */
  async getTaskStatistics(): Promise<{
    dueInvoicesCount: number;
    activeTemplatesCount: number;
    lastExecutionTime?: Date;
  }> {
    try {
      const dueInvoicesResult = await recurringInvoiceService.getDueRecurringInvoices();
      const statsResult = await recurringInvoiceService.getRecurringInvoiceStats();

      return {
        dueInvoicesCount: dueInvoicesResult.success ? (dueInvoicesResult.data?.length || 0) : 0,
        activeTemplatesCount: statsResult.success ? (statsResult.data?.activeTemplates || 0) : 0,
        // Note: lastExecutionTime would need to be stored in database for persistence
      };
    } catch (error) {
      console.error('Failed to get task statistics:', error);
      return {
        dueInvoicesCount: 0,
        activeTemplatesCount: 0,
      };
    }
  }

  /**
   * Validate recurring invoice templates for potential issues
   */
  async validateRecurringTemplates(): Promise<{
    validTemplates: number;
    invalidTemplates: number;
    issues: Array<{ templateId: string; invoiceNumber: string; issues: string[] }>;
  }> {
    try {
      const templatesResult = await recurringInvoiceService.getRecurringInvoices();
      
      if (!templatesResult.success || !templatesResult.data) {
        return {
          validTemplates: 0,
          invalidTemplates: 0,
          issues: [],
        };
      }

      const templates = templatesResult.data;
      const issues: Array<{ templateId: string; invoiceNumber: string; issues: string[] }> = [];
      let validCount = 0;

      for (const template of templates) {
        const templateIssues: string[] = [];

        // Check if recurring config exists
        if (!template.recurringConfig) {
          templateIssues.push('Missing recurring configuration');
        } else {
          const config = template.recurringConfig;

          // Check if config is active but has issues
          if (config.isActive) {
            // Check if end date has passed
            if (config.endDate && new Date() > config.endDate) {
              templateIssues.push('End date has passed but template is still active');
            }

            // Check if max occurrences reached
            if (config.maxOccurrences) {
              const generatedResult = await recurringInvoiceService.getGeneratedInvoices(template.id);
              if (generatedResult.success && generatedResult.data) {
                const generatedCount = generatedResult.data.length;
                if (generatedCount >= config.maxOccurrences) {
                  templateIssues.push('Maximum occurrences reached but template is still active');
                }
              }
            }

            // Check if next generation date is in the past
            if (config.nextGenerationDate < new Date()) {
              const daysPast = Math.floor((new Date().getTime() - config.nextGenerationDate.getTime()) / (1000 * 60 * 60 * 24));
              if (daysPast > 7) { // More than a week overdue
                templateIssues.push(`Next generation date is ${daysPast} days overdue`);
              }
            }
          }

          // Check for invalid frequency/interval combinations
          if (config.interval <= 0 || config.interval > 100) {
            templateIssues.push('Invalid interval value');
          }
        }

        // Check invoice data integrity
        if (!template.business || !template.client || !template.items || template.items.length === 0) {
          templateIssues.push('Incomplete invoice data (missing business, client, or items)');
        }

        if (templateIssues.length > 0) {
          issues.push({
            templateId: template.id,
            invoiceNumber: template.invoiceNumber,
            issues: templateIssues,
          });
        } else {
          validCount++;
        }
      }

      return {
        validTemplates: validCount,
        invalidTemplates: issues.length,
        issues,
      };
    } catch (error) {
      console.error('Failed to validate recurring templates:', error);
      return {
        validTemplates: 0,
        invalidTemplates: 0,
        issues: [],
      };
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export a singleton instance
export const scheduledTaskService = new ScheduledTaskService();