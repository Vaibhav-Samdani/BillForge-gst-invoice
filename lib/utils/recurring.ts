// Recurring invoice utility functions
import { RecurringConfig, EnhancedInvoice } from '../types/invoice';
import { addWeeks, addMonths, addYears, isAfter, isBefore } from 'date-fns';

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringSchedule {
  frequency: RecurringFrequency;
  interval: number;
  startDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
  occurrenceCount?: number;
  isActive: boolean;
}

/**
 * Calculate the next date based on frequency and interval
 */
export const calculateNextDate = (
  currentDate: Date,
  frequency: RecurringFrequency,
  interval: number
): Date => {
  if (interval === 0) return new Date(currentDate);

  switch (frequency) {
    case 'weekly':
      return addWeeks(currentDate, interval);
    case 'monthly':
      return addMonths(currentDate, interval);
    case 'quarterly':
      return addMonths(currentDate, interval * 3);
    case 'yearly':
      return addYears(currentDate, interval);
    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }
};

/**
 * Calculate the next generation date based on frequency and interval
 * @deprecated Use calculateNextDate instead
 */
export const calculateNextGenerationDate = (
  currentDate: Date,
  frequency: RecurringConfig['frequency'],
  interval: number
): Date => {
  return calculateNextDate(currentDate, frequency as RecurringFrequency, interval);
};



/**
 * Calculate how many invoices have been generated for a recurring config
 */
export const calculateGeneratedCount = (
  config: RecurringConfig,
  generatedInvoices: EnhancedInvoice[]
): number => {
  return generatedInvoices.length;
};

/**
 * Check if recurring invoice has reached max occurrences
 */
export const hasReachedMaxOccurrences = (
  config: RecurringConfig,
  generatedCount: number
): boolean => {
  if (!config.maxOccurrences) return false;
  return generatedCount >= config.maxOccurrences;
};

/**
 * Get all future generation dates for a recurring config
 */
export const getFutureGenerationDates = (
  config: RecurringConfig,
  maxDates: number = 12
): Date[] => {
  const dates: Date[] = [];
  let currentDate = new Date(config.nextGenerationDate);
  let count = 0;

  while (count < maxDates) {
    // Check end date constraint
    if (config.endDate && currentDate > config.endDate) break;

    // Check max occurrences constraint
    if (config.maxOccurrences && count >= config.maxOccurrences) break;

    dates.push(new Date(currentDate));
    currentDate = calculateNextGenerationDate(currentDate, config.frequency, config.interval);
    count++;
  }

  return dates;
};

/**
 * Update recurring config after generating an invoice
 */
export const updateConfigAfterGeneration = (config: RecurringConfig): RecurringConfig => {
  const nextDate = calculateNextGenerationDate(
    config.nextGenerationDate,
    config.frequency,
    config.interval
  );

  return {
    ...config,
    nextGenerationDate: nextDate,
  };
};

/**
 * Calculate the due date for a recurring invoice
 */
export const calculateRecurringInvoiceDueDate = (
  invoiceDate: Date,
  paymentTermsDays: number = 30
): Date => {
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + paymentTermsDays);
  return dueDate;
};

/**
 * Generate invoice number for recurring invoice
 */
export const generateRecurringInvoiceNumber = (
  baseNumber: string,
  sequenceNumber: number,
  format: 'suffix' | 'prefix' = 'suffix'
): string => {
  if (format === 'prefix') {
    return `${sequenceNumber.toString().padStart(3, '0')}-${baseNumber}`;
  }
  return `${baseNumber}-${sequenceNumber.toString().padStart(3, '0')}`;
};

/**
 * Check if a date falls within a recurring schedule
 */
export const isDateInRecurringSchedule = (
  date: Date,
  config: RecurringConfig
): boolean => {
  // Check if date is after start date
  if (date < config.startDate) return false;

  // Check if date is before end date (if set)
  if (config.endDate && date > config.endDate) return false;

  // Calculate if the date aligns with the recurring pattern
  const daysDiff = Math.floor(
    (date.getTime() - config.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  switch (config.frequency) {
    case 'weekly':
      return daysDiff % (7 * config.interval) === 0;
    case 'monthly':
      // For monthly, check if it's the same day of month
      return date.getDate() === config.startDate.getDate();
    case 'quarterly':
      // For quarterly, check if it's the same day and month aligns
      const monthsDiff = (date.getFullYear() - config.startDate.getFullYear()) * 12 + 
                        (date.getMonth() - config.startDate.getMonth());
      return date.getDate() === config.startDate.getDate() && 
             monthsDiff % (3 * config.interval) === 0;
    case 'yearly':
      // For yearly, check if it's the same day and month
      const yearsDiff = date.getFullYear() - config.startDate.getFullYear();
      return date.getDate() === config.startDate.getDate() &&
             date.getMonth() === config.startDate.getMonth() &&
             yearsDiff % config.interval === 0;
    default:
      return false;
  }
};

/**
 * Get human-readable description of recurring frequency
 */
export const getRecurringFrequencyDescription = (config: RecurringConfig): string => {
  const { frequency, interval } = config;

  if (interval === 1) {
    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
    }
  }

  switch (frequency) {
    case 'weekly': return `Every ${interval} weeks`;
    case 'monthly': return `Every ${interval} months`;
    case 'quarterly': return `Every ${interval} quarters`;
    case 'yearly': return `Every ${interval} years`;
    default: return 'Unknown frequency';
  }
};

/**
 * Validate recurring config dates
 */
export const validateRecurringDates = (config: RecurringConfig): string[] => {
  const errors: string[] = [];

  // Start date should not be in the past (with some tolerance)
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  if (config.startDate < yesterday) {
    errors.push('Start date cannot be in the past');
  }

  // End date should be after start date
  if (config.endDate && config.endDate <= config.startDate) {
    errors.push('End date must be after start date');
  }

  // Next generation date should be >= start date
  if (config.nextGenerationDate < config.startDate) {
    errors.push('Next generation date cannot be before start date');
  }

  return errors;
};

/**
 * Generate sequential invoice numbers
 */
export const generateInvoiceNumber = (baseNumber: string, increment: number): string => {
  const match = baseNumber.match(/(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const number = parseInt(match[2], 10);
    const newNumber = number + increment;
    const paddedNumber = String(newNumber).padStart(match[2].length, '0');
    return prefix + paddedNumber;
  }
  return baseNumber + '-' + increment;
};

/**
 * Validate recurring schedule configuration
 */
export const validateRecurringSchedule = (schedule: RecurringSchedule): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const validFrequencies: RecurringFrequency[] = ['weekly', 'monthly', 'quarterly', 'yearly'];
  if (!validFrequencies.includes(schedule.frequency)) {
    errors.push('Invalid frequency');
  }
  
  if (!schedule.interval || schedule.interval <= 0) {
    errors.push('Interval must be greater than 0');
  }
  
  if (schedule.endDate && schedule.startDate && isAfter(schedule.startDate, schedule.endDate)) {
    errors.push('End date must be after start date');
  }
  
  if (schedule.maxOccurrences !== undefined && schedule.maxOccurrences <= 0) {
    errors.push('Max occurrences must be greater than 0');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Check if a schedule is due for generation
 */
export const isScheduleDue = (dueDate: Date, referenceDate: Date = new Date()): boolean => {
  return dueDate <= referenceDate;
};

/**
 * Get all supported recurring frequencies
 */
export const getRecurringFrequencies = (): RecurringFrequency[] => {
  return ['weekly', 'monthly', 'quarterly', 'yearly'];
};

/**
 * Format recurring schedule for display
 */
export const formatRecurringSchedule = (schedule: RecurringSchedule): string => {
  let result = '';
  
  if (schedule.interval === 1) {
    switch (schedule.frequency) {
      case 'weekly':
        result = 'Every week';
        break;
      case 'monthly':
        result = 'Every month';
        break;
      case 'quarterly':
        result = 'Every quarter';
        break;
      case 'yearly':
        result = 'Every year';
        break;
    }
  } else {
    switch (schedule.frequency) {
      case 'weekly':
        result = `Every ${schedule.interval} weeks`;
        break;
      case 'monthly':
        result = `Every ${schedule.interval} months`;
        break;
      case 'quarterly':
        result = `Every ${schedule.interval} quarters`;
        break;
      case 'yearly':
        result = `Every ${schedule.interval} years`;
        break;
    }
  }
  
  if (schedule.endDate) {
    result += ` until ${schedule.endDate.getFullYear()}`;
  }
  
  if (schedule.maxOccurrences) {
    result += ` for ${schedule.maxOccurrences} occurrences`;
  }
  
  return result;
};

/**
 * Calculate occurrence count between dates
 */
export const calculateOccurrenceCount = (
  startDate: Date,
  endDate: Date,
  frequency: RecurringFrequency,
  interval: number
): number => {
  if (endDate < startDate) return 0;
  if (startDate.getTime() === endDate.getTime()) return 1;
  
  let count = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    count++;
    currentDate = calculateNextDate(currentDate, frequency, interval);
  }
  
  return count;
};

/**
 * Get next N occurrence dates
 */
export const getNextNOccurrences = (
  startDate: Date,
  frequency: RecurringFrequency,
  interval: number,
  count: number
): Date[] => {
  if (count <= 0) return [];
  
  const occurrences: Date[] = [];
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    currentDate = calculateNextDate(currentDate, frequency, interval);
    occurrences.push(new Date(currentDate));
  }
  
  return occurrences;
};

/**
 * Check if recurring schedule is active
 */
export const isRecurringActive = (schedule: RecurringSchedule, referenceDate: Date = new Date()): boolean => {
  if (!schedule.isActive) return false;
  
  if (schedule.endDate && referenceDate > schedule.endDate) return false;
  
  if (schedule.maxOccurrences && schedule.occurrenceCount && schedule.occurrenceCount >= schedule.maxOccurrences) {
    return false;
  }
  
  return true;
};

/**
 * Check if recurring should stop
 */
export const shouldStopRecurring = (schedule: RecurringSchedule, referenceDate: Date = new Date()): boolean => {
  if (!schedule.isActive) return true;
  
  if (schedule.endDate && referenceDate > schedule.endDate) return true;
  
  if (schedule.maxOccurrences && schedule.occurrenceCount && schedule.occurrenceCount >= schedule.maxOccurrences) {
    return true;
  }
  
  return false;
};

/**
 * Check if a recurring invoice should be generated
 */
export const shouldGenerateRecurringInvoice = (config: RecurringSchedule): boolean => {
  if (!config.isActive) return false;

  const now = new Date();
  
  // Check if it's time to generate (using nextGenerationDate if available, otherwise startDate)
  const nextDate = (config as any).nextGenerationDate || config.startDate;
  if (now < nextDate) return false;

  // Check if we've reached the end date
  if (config.endDate && now > config.endDate) return false;

  // Check if we've reached max occurrences
  if (config.maxOccurrences && config.occurrenceCount && config.occurrenceCount >= config.maxOccurrences) {
    return false;
  }

  return true;
};



/**
 * Calculate estimated total value of recurring invoices
 */
export const calculateRecurringTotalValue = (
  invoiceAmount: number,
  config: RecurringConfig,
  maxOccurrences?: number
): { totalValue: number; estimatedCount: number } => {
  let estimatedCount = 0;

  if (config.maxOccurrences) {
    estimatedCount = config.maxOccurrences;
  } else if (config.endDate) {
    // Calculate based on end date
    const futureDate = getFutureGenerationDates(config, 1000);
    estimatedCount = futureDate.length;
  } else if (maxOccurrences) {
    estimatedCount = maxOccurrences;
  } else {
    // Default to 12 occurrences for estimation
    estimatedCount = 12;
  }

  return {
    totalValue: invoiceAmount * estimatedCount,
    estimatedCount,
  };
};