import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateNextDate,
  generateInvoiceNumber,
  validateRecurringSchedule,
  isScheduleDue,
  getRecurringFrequencies,
  formatRecurringSchedule,
  calculateOccurrenceCount,
  getNextNOccurrences,
  isRecurringActive,
  shouldStopRecurring
} from '../recurring';
import { addDays, addWeeks, addMonths, addYears, subDays } from 'date-fns';

describe('Recurring Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-01T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateNextDate', () => {
    const baseDate = new Date('2024-01-01');

    it('should calculate next date for weekly frequency', () => {
      const nextDate = calculateNextDate(baseDate, 'weekly', 1);
      expect(nextDate).toEqual(addWeeks(baseDate, 1));
    });

    it('should calculate next date for monthly frequency', () => {
      const nextDate = calculateNextDate(baseDate, 'monthly', 1);
      expect(nextDate).toEqual(addMonths(baseDate, 1));
    });

    it('should calculate next date for quarterly frequency', () => {
      const nextDate = calculateNextDate(baseDate, 'quarterly', 1);
      expect(nextDate).toEqual(addMonths(baseDate, 3));
    });

    it('should calculate next date for yearly frequency', () => {
      const nextDate = calculateNextDate(baseDate, 'yearly', 1);
      expect(nextDate).toEqual(addYears(baseDate, 1));
    });

    it('should handle custom intervals', () => {
      expect(calculateNextDate(baseDate, 'weekly', 2)).toEqual(addWeeks(baseDate, 2));
      expect(calculateNextDate(baseDate, 'monthly', 3)).toEqual(addMonths(baseDate, 3));
      expect(calculateNextDate(baseDate, 'yearly', 2)).toEqual(addYears(baseDate, 2));
    });

    it('should handle interval of 0', () => {
      expect(calculateNextDate(baseDate, 'monthly', 0)).toEqual(baseDate);
    });

    it('should throw error for invalid frequency', () => {
      expect(() => calculateNextDate(baseDate, 'invalid' as any, 1))
        .toThrow('Invalid frequency: invalid');
    });

    it('should handle edge cases with month boundaries', () => {
      const jan31 = new Date('2024-01-31');
      const nextMonth = calculateNextDate(jan31, 'monthly', 1);
      // Should handle February not having 31 days
      expect(nextMonth.getMonth()).toBe(1); // February
      expect(nextMonth.getDate()).toBeLessThanOrEqual(29); // Feb 28 or 29
    });
  });

  describe('generateInvoiceNumber', () => {
    it('should generate sequential invoice numbers', () => {
      const baseNumber = 'INV-001';
      expect(generateInvoiceNumber(baseNumber, 1)).toBe('INV-002');
      expect(generateInvoiceNumber(baseNumber, 2)).toBe('INV-003');
      expect(generateInvoiceNumber(baseNumber, 10)).toBe('INV-011');
    });

    it('should handle different number formats', () => {
      expect(generateInvoiceNumber('INVOICE-0001', 1)).toBe('INVOICE-0002');
      expect(generateInvoiceNumber('2024-001', 1)).toBe('2024-002');
      expect(generateInvoiceNumber('ABC123', 1)).toBe('ABC124');
    });

    it('should handle numbers without leading zeros', () => {
      expect(generateInvoiceNumber('INV-1', 1)).toBe('INV-2');
      expect(generateInvoiceNumber('INV-99', 1)).toBe('INV-100');
    });

    it('should handle invoice numbers without numbers', () => {
      expect(generateInvoiceNumber('INVOICE', 1)).toBe('INVOICE-1');
      expect(generateInvoiceNumber('ABC', 5)).toBe('ABC-5');
    });

    it('should handle large increments', () => {
      expect(generateInvoiceNumber('INV-001', 999)).toBe('INV-1000');
    });

    it('should preserve leading zeros', () => {
      expect(generateInvoiceNumber('INV-0001', 1)).toBe('INV-0002');
      expect(generateInvoiceNumber('INV-0099', 1)).toBe('INV-0100');
    });
  });

  describe('validateRecurringSchedule', () => {
    const validSchedule = {
      frequency: 'monthly' as const,
      interval: 1,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      maxOccurrences: 12,
      isActive: true,
    };

    it('should validate correct schedule', () => {
      const result = validateRecurringSchedule(validSchedule);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid frequency', () => {
      const invalidSchedule = {
        ...validSchedule,
        frequency: 'invalid' as any,
      };
      
      const result = validateRecurringSchedule(invalidSchedule);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid frequency');
    });

    it('should reject invalid interval', () => {
      const invalidSchedule = {
        ...validSchedule,
        interval: 0,
      };
      
      const result = validateRecurringSchedule(invalidSchedule);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Interval must be greater than 0');
    });

    it('should reject end date before start date', () => {
      const invalidSchedule = {
        ...validSchedule,
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01'),
      };
      
      const result = validateRecurringSchedule(invalidSchedule);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('End date must be after start date');
    });

    it('should reject invalid max occurrences', () => {
      const invalidSchedule = {
        ...validSchedule,
        maxOccurrences: 0,
      };
      
      const result = validateRecurringSchedule(invalidSchedule);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Max occurrences must be greater than 0');
    });

    it('should allow schedule without end date', () => {
      const scheduleWithoutEndDate = {
        ...validSchedule,
        endDate: undefined,
      };
      
      const result = validateRecurringSchedule(scheduleWithoutEndDate);
      expect(result.valid).toBe(true);
    });

    it('should allow schedule without max occurrences', () => {
      const scheduleWithoutMax = {
        ...validSchedule,
        maxOccurrences: undefined,
      };
      
      const result = validateRecurringSchedule(scheduleWithoutMax);
      expect(result.valid).toBe(true);
    });
  });

  describe('isScheduleDue', () => {
    it('should return true for due schedules', () => {
      const dueDate = new Date('2024-02-01T09:00:00Z'); // Before current time
      expect(isScheduleDue(dueDate)).toBe(true);
    });

    it('should return true for schedules due now', () => {
      const dueDate = new Date('2024-02-01T10:00:00Z'); // Current time
      expect(isScheduleDue(dueDate)).toBe(true);
    });

    it('should return false for future schedules', () => {
      const futureDate = new Date('2024-02-01T11:00:00Z'); // After current time
      expect(isScheduleDue(futureDate)).toBe(false);
    });

    it('should handle custom reference date', () => {
      const dueDate = new Date('2024-01-15');
      const referenceDate = new Date('2024-01-20');
      expect(isScheduleDue(dueDate, referenceDate)).toBe(true);
      
      const futureDate = new Date('2024-01-25');
      expect(isScheduleDue(futureDate, referenceDate)).toBe(false);
    });
  });

  describe('getRecurringFrequencies', () => {
    it('should return all supported frequencies', () => {
      const frequencies = getRecurringFrequencies();
      
      expect(frequencies).toContain('weekly');
      expect(frequencies).toContain('monthly');
      expect(frequencies).toContain('quarterly');
      expect(frequencies).toContain('yearly');
      expect(frequencies.length).toBe(4);
    });
  });

  describe('formatRecurringSchedule', () => {
    it('should format weekly schedules', () => {
      const schedule = {
        frequency: 'weekly' as const,
        interval: 1,
        startDate: new Date('2024-01-01'),
        isActive: true,
      };
      
      expect(formatRecurringSchedule(schedule)).toBe('Every week');
    });

    it('should format bi-weekly schedules', () => {
      const schedule = {
        frequency: 'weekly' as const,
        interval: 2,
        startDate: new Date('2024-01-01'),
        isActive: true,
      };
      
      expect(formatRecurringSchedule(schedule)).toBe('Every 2 weeks');
    });

    it('should format monthly schedules', () => {
      const schedule = {
        frequency: 'monthly' as const,
        interval: 1,
        startDate: new Date('2024-01-01'),
        isActive: true,
      };
      
      expect(formatRecurringSchedule(schedule)).toBe('Every month');
    });

    it('should format quarterly schedules', () => {
      const schedule = {
        frequency: 'quarterly' as const,
        interval: 1,
        startDate: new Date('2024-01-01'),
        isActive: true,
      };
      
      expect(formatRecurringSchedule(schedule)).toBe('Every quarter');
    });

    it('should format yearly schedules', () => {
      const schedule = {
        frequency: 'yearly' as const,
        interval: 1,
        startDate: new Date('2024-01-01'),
        isActive: true,
      };
      
      expect(formatRecurringSchedule(schedule)).toBe('Every year');
    });

    it('should include end date when present', () => {
      const schedule = {
        frequency: 'monthly' as const,
        interval: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        isActive: true,
      };
      
      const formatted = formatRecurringSchedule(schedule);
      expect(formatted).toContain('until');
      expect(formatted).toContain('2024');
    });

    it('should include max occurrences when present', () => {
      const schedule = {
        frequency: 'monthly' as const,
        interval: 1,
        startDate: new Date('2024-01-01'),
        maxOccurrences: 12,
        isActive: true,
      };
      
      const formatted = formatRecurringSchedule(schedule);
      expect(formatted).toContain('for 12 occurrences');
    });
  });

  describe('calculateOccurrenceCount', () => {
    it('should calculate occurrences between dates for monthly frequency', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-01');
      
      const count = calculateOccurrenceCount(startDate, endDate, 'monthly', 1);
      expect(count).toBe(12); // 12 months
    });

    it('should calculate occurrences for weekly frequency', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-29'); // 4 weeks later
      
      const count = calculateOccurrenceCount(startDate, endDate, 'weekly', 1);
      expect(count).toBe(5); // 5 weeks (including start week)
    });

    it('should handle custom intervals', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-07-01'); // 6 months later
      
      const count = calculateOccurrenceCount(startDate, endDate, 'monthly', 2);
      expect(count).toBe(4); // Every 2 months: Jan, Mar, May, Jul
    });

    it('should handle same start and end date', () => {
      const date = new Date('2024-01-01');
      
      const count = calculateOccurrenceCount(date, date, 'monthly', 1);
      expect(count).toBe(1);
    });

    it('should handle end date before start date', () => {
      const startDate = new Date('2024-12-01');
      const endDate = new Date('2024-01-01');
      
      const count = calculateOccurrenceCount(startDate, endDate, 'monthly', 1);
      expect(count).toBe(0);
    });
  });

  describe('getNextNOccurrences', () => {
    it('should return next N occurrence dates', () => {
      const startDate = new Date('2024-01-01');
      const occurrences = getNextNOccurrences(startDate, 'monthly', 1, 3);
      
      expect(occurrences).toHaveLength(3);
      expect(occurrences[0]).toEqual(new Date('2024-02-01'));
      expect(occurrences[1]).toEqual(new Date('2024-03-01'));
      expect(occurrences[2]).toEqual(new Date('2024-04-01'));
    });

    it('should handle weekly frequency', () => {
      const startDate = new Date('2024-01-01');
      const occurrences = getNextNOccurrences(startDate, 'weekly', 1, 2);
      
      expect(occurrences).toHaveLength(2);
      expect(occurrences[0]).toEqual(addWeeks(startDate, 1));
      expect(occurrences[1]).toEqual(addWeeks(startDate, 2));
    });

    it('should handle custom intervals', () => {
      const startDate = new Date('2024-01-01');
      const occurrences = getNextNOccurrences(startDate, 'monthly', 2, 2);
      
      expect(occurrences).toHaveLength(2);
      expect(occurrences[0]).toEqual(new Date('2024-03-01'));
      expect(occurrences[1]).toEqual(new Date('2024-05-01'));
    });

    it('should return empty array for zero count', () => {
      const startDate = new Date('2024-01-01');
      const occurrences = getNextNOccurrences(startDate, 'monthly', 1, 0);
      
      expect(occurrences).toHaveLength(0);
    });
  });

  describe('isRecurringActive', () => {
    it('should return true for active recurring schedules', () => {
      const schedule = {
        frequency: 'monthly' as const,
        interval: 1,
        startDate: new Date('2024-01-01'),
        isActive: true,
      };
      
      expect(isRecurringActive(schedule)).toBe(true);
    });

    it('should return false for inactive schedules', () => {
      const schedule = {
        frequency: 'monthly' as const,
        interval: 1,
        startDate: new Date('2024-01-01'),
        isActive: false,
      };
      
      expect(isRecurringActive(schedule)).toBe(false);
    });

    it('should return false for schedules past end date', () => {
      const schedule = {
        frequency: 'monthly' as const,
        interval: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'), // Past end date
        isActive: true,
      };
      
      expect(isRecurringActive(schedule)).toBe(false);
    });

    it('should return false for schedules that reached max occurrences', () => {
      const schedule = {
        frequency: 'monthly' as const,
        interval: 1,
        startDate: new Date('2024-01-01'),
        maxOccurrences: 1,
        occurrenceCount: 1, // Reached max
        isActive: true,
      };
      
      expect(isRecurringActive(schedule)).toBe(false);
    });
  });

  describe('shouldStopRecurring', () => {
    it('should return false for active schedules within limits', () => {
      const schedule = {
        frequency: 'monthly' as const,
        interval: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        maxOccurrences: 12,
        occurrenceCount: 5,
        isActive: true,
      };
      
      expect(shouldStopRecurring(schedule)).toBe(false);
    });

    it('should return true when max occurrences reached', () => {
      const schedule = {
        frequency: 'monthly' as const,
        interval: 1,
        startDate: new Date('2024-01-01'),
        maxOccurrences: 5,
        occurrenceCount: 5,
        isActive: true,
      };
      
      expect(shouldStopRecurring(schedule)).toBe(true);
    });

    it('should return true when past end date', () => {
      const schedule = {
        frequency: 'monthly' as const,
        interval: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        isActive: true,
      };
      
      expect(shouldStopRecurring(schedule)).toBe(true);
    });

    it('should return true when manually deactivated', () => {
      const schedule = {
        frequency: 'monthly' as const,
        interval: 1,
        startDate: new Date('2024-01-01'),
        isActive: false,
      };
      
      expect(shouldStopRecurring(schedule)).toBe(true);
    });

    it('should handle schedules without limits', () => {
      const schedule = {
        frequency: 'monthly' as const,
        interval: 1,
        startDate: new Date('2024-01-01'),
        isActive: true,
      };
      
      expect(shouldStopRecurring(schedule)).toBe(false);
    });
  });
});