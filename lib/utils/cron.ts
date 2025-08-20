// Cron job utilities for recurring invoice generation
import { scheduledTaskService } from '../services/ScheduledTaskService';

// Cron job configuration
export interface CronJobConfig {
  enabled: boolean;
  schedule: string; // Cron expression (e.g., '0 9 * * *' for daily at 9 AM)
  timezone?: string;
}

// Default cron configuration - runs daily at 9 AM
export const DEFAULT_CRON_CONFIG: CronJobConfig = {
  enabled: true,
  schedule: '0 9 * * *', // Daily at 9:00 AM
  timezone: 'UTC',
};

// Simple cron expression parser for basic validation
export const validateCronExpression = (expression: string): boolean => {
  const parts = expression.trim().split(/\s+/);
  
  // Basic validation - should have 5 parts (minute, hour, day, month, weekday)
  if (parts.length !== 5) {
    return false;
  }

  // Each part should be either a number, *, or contain valid cron characters
  const cronPattern = /^(\*|[0-9]+(-[0-9]+)?(,[0-9]+(-[0-9]+)?)*|\*\/[0-9]+)$/;
  
  return parts.every(part => cronPattern.test(part));
};

// Parse cron expression to get next execution time
export const getNextExecutionTime = (cronExpression: string, fromDate: Date = new Date()): Date | null => {
  try {
    // This is a simplified implementation
    // In a production environment, you'd use a proper cron parser library like 'node-cron' or 'cron-parser'
    
    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length !== 5) {
      return null;
    }

    const [minute, hour, day, month, weekday] = parts;
    const nextDate = new Date(fromDate);
    
    // Simple case: daily execution at specific time
    if (day === '*' && month === '*' && weekday === '*') {
      const targetHour = parseInt(hour);
      const targetMinute = parseInt(minute);
      
      if (isNaN(targetHour) || isNaN(targetMinute)) {
        return null;
      }
      
      nextDate.setHours(targetHour, targetMinute, 0, 0);
      
      // If the time has already passed today, move to tomorrow
      if (nextDate <= fromDate) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      
      return nextDate;
    }
    
    // For more complex cron expressions, return null (would need proper parser)
    return null;
  } catch (error) {
    console.error('Error parsing cron expression:', error);
    return null;
  }
};

// Check if it's time to run based on cron schedule
export const shouldRunNow = (cronExpression: string, lastRunTime?: Date): boolean => {
  const now = new Date();
  const nextTime = getNextExecutionTime(cronExpression, lastRunTime || new Date(0));
  
  if (!nextTime) {
    return false;
  }
  
  // Allow a 5-minute window for execution
  const timeDiff = Math.abs(now.getTime() - nextTime.getTime());
  const fiveMinutes = 5 * 60 * 1000;
  
  return timeDiff <= fiveMinutes;
};

// Manual trigger for recurring invoice generation
export const triggerRecurringInvoiceGeneration = async (): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> => {
  try {
    console.log('🚀 Manually triggering recurring invoice generation...');
    
    const result = await scheduledTaskService.generateDueRecurringInvoices();
    
    if (result.success) {
      return {
        success: true,
        message: `Successfully generated ${result.processedCount} recurring invoices`,
        data: result,
      };
    } else {
      return {
        success: false,
        message: `Generation completed with errors: ${result.errors.join(', ')}`,
        data: result,
      };
    }
  } catch (error) {
    console.error('Error triggering recurring invoice generation:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Get cron job status and next execution time
export const getCronJobStatus = (config: CronJobConfig, lastRunTime?: Date): {
  enabled: boolean;
  nextExecution: Date | null;
  schedule: string;
  isValidSchedule: boolean;
} => {
  const isValidSchedule = validateCronExpression(config.schedule);
  const nextExecution = isValidSchedule ? getNextExecutionTime(config.schedule) : null;
  
  return {
    enabled: config.enabled,
    nextExecution,
    schedule: config.schedule,
    isValidSchedule,
  };
};

// Utility to format cron schedule in human-readable format
export const formatCronSchedule = (cronExpression: string): string => {
  const parts = cronExpression.trim().split(/\s+/);
  
  if (parts.length !== 5) {
    return 'Invalid schedule';
  }
  
  const [minute, hour, day, month, weekday] = parts;
  
  // Handle common patterns
  if (minute === '0' && hour !== '*' && day === '*' && month === '*' && weekday === '*') {
    const hourNum = parseInt(hour);
    if (!isNaN(hourNum)) {
      const time = new Date();
      time.setHours(hourNum, 0, 0, 0);
      return `Daily at ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  }
  
  if (minute !== '*' && hour !== '*' && day === '*' && month === '*' && weekday === '*') {
    const hourNum = parseInt(hour);
    const minuteNum = parseInt(minute);
    if (!isNaN(hourNum) && !isNaN(minuteNum)) {
      const time = new Date();
      time.setHours(hourNum, minuteNum, 0, 0);
      return `Daily at ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  }
  
  // For other patterns, return the raw expression
  return `Custom: ${cronExpression}`;
};

// Background task runner (for development/testing)
// In production, this would be handled by a proper cron daemon or task scheduler
export class SimpleTaskRunner {
  private intervalId: NodeJS.Timeout | null = null;
  private config: CronJobConfig;
  private lastRunTime?: Date;

  constructor(config: CronJobConfig = DEFAULT_CRON_CONFIG) {
    this.config = config;
  }

  start(): void {
    if (this.intervalId) {
      console.log('Task runner is already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('Task runner is disabled');
      return;
    }

    console.log(`🕐 Starting task runner with schedule: ${this.config.schedule}`);
    console.log(`   Next execution: ${getNextExecutionTime(this.config.schedule)}`);

    // Check every minute if it's time to run
    this.intervalId = setInterval(async () => {
      if (shouldRunNow(this.config.schedule, this.lastRunTime)) {
        console.log('⏰ Cron schedule triggered - running recurring invoice generation');
        
        try {
          const result = await scheduledTaskService.generateDueRecurringInvoices();
          this.lastRunTime = new Date();
          
          if (result.success) {
            console.log(`✅ Scheduled task completed successfully: ${result.processedCount} invoices generated`);
          } else {
            console.log(`⚠️ Scheduled task completed with errors: ${result.errors.length} errors`);
          }
        } catch (error) {
          console.error('❌ Scheduled task failed:', error);
        }
      }
    }, 60000); // Check every minute
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Task runner stopped');
    }
  }

  updateConfig(newConfig: CronJobConfig): void {
    this.config = newConfig;
    
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }

  getStatus(): {
    running: boolean;
    config: CronJobConfig;
    lastRunTime?: Date;
    nextExecution: Date | null;
  } {
    return {
      running: this.intervalId !== null,
      config: this.config,
      lastRunTime: this.lastRunTime,
      nextExecution: getNextExecutionTime(this.config.schedule),
    };
  }
}

// Export a singleton task runner instance
export const taskRunner = new SimpleTaskRunner();