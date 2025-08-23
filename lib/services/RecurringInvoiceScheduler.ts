import { RecurringInvoiceService } from './RecurringInvoiceService';

export class RecurringInvoiceScheduler {
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Start the recurring invoice scheduler
   * This will check for due invoices every hour
   */
  static start(intervalMinutes: number = 60): void {
    if (this.isRunning) {
      console.log('Recurring invoice scheduler is already running');
      return;
    }

    console.log(`Starting recurring invoice scheduler (checking every ${intervalMinutes} minutes)`);
    
    // Run immediately on start
    this.checkAndGenerateInvoices();
    
    // Then run at intervals
    this.intervalId = setInterval(() => {
      this.checkAndGenerateInvoices();
    }, intervalMinutes * 60 * 1000);
    
    this.isRunning = true;
  }

  /**
   * Stop the recurring invoice scheduler
   */
  static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Recurring invoice scheduler stopped');
  }

  /**
   * Check for due invoices and generate them
   */
  static async checkAndGenerateInvoices(): Promise<void> {
    try {
      console.log('Checking for due recurring invoices...');
      
      // Generate all due invoices
      const generatedInvoices = await RecurringInvoiceService.generateAllDueInvoices();
      
      if (generatedInvoices.length > 0) {
        console.log(`Generated ${generatedInvoices.length} recurring invoices:`, 
          generatedInvoices.map(inv => inv.invoiceNumber));
      } else {
        console.log('No recurring invoices due for generation');
      }

      // Auto-pause completed templates
      const pausedTemplates = await RecurringInvoiceService.autoPauseCompletedTemplates();
      
      if (pausedTemplates.length > 0) {
        console.log(`Auto-paused ${pausedTemplates.length} completed recurring templates`);
      }

    } catch (error) {
      console.error('Error in recurring invoice scheduler:', error);
    }
  }

  /**
   * Get scheduler status
   */
  static getStatus(): { isRunning: boolean; intervalId: NodeJS.Timeout | null } {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId,
    };
  }

  /**
   * Force check and generate invoices (manual trigger)
   */
  static async forceCheck(): Promise<void> {
    console.log('Manually triggering recurring invoice check...');
    await this.checkAndGenerateInvoices();
  }
}

// Auto-start the scheduler in browser environment
if (typeof window !== 'undefined') {
  // Start checking every 30 minutes in development, every hour in production
  const intervalMinutes = process.env.NODE_ENV === 'development' ? 30 : 60;
  RecurringInvoiceScheduler.start(intervalMinutes);
}