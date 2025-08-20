/**
 * Calculate the next generation date based on frequency and interval
 */
export const calculateNextGenerationDate = (currentDate, frequency, interval) => {
    const nextDate = new Date(currentDate);
    switch (frequency) {
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + (7 * interval));
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + interval);
            break;
        case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + (3 * interval));
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + interval);
            break;
        default:
            throw new Error(`Unsupported frequency: ${frequency}`);
    }
    return nextDate;
};
/**
 * Check if a recurring invoice should be generated
 */
export const shouldGenerateRecurringInvoice = (config) => {
    if (!config.isActive)
        return false;
    const now = new Date();
    // Check if it's time to generate
    if (now < config.nextGenerationDate)
        return false;
    // Check if we've reached the end date
    if (config.endDate && now > config.endDate)
        return false;
    return true;
};
/**
 * Calculate how many invoices have been generated for a recurring config
 */
export const calculateGeneratedCount = (config, generatedInvoices) => {
    return generatedInvoices.length;
};
/**
 * Check if recurring invoice has reached max occurrences
 */
export const hasReachedMaxOccurrences = (config, generatedCount) => {
    if (!config.maxOccurrences)
        return false;
    return generatedCount >= config.maxOccurrences;
};
/**
 * Get all future generation dates for a recurring config
 */
export const getFutureGenerationDates = (config, maxDates = 12) => {
    const dates = [];
    let currentDate = new Date(config.nextGenerationDate);
    let count = 0;
    while (count < maxDates) {
        // Check end date constraint
        if (config.endDate && currentDate > config.endDate)
            break;
        // Check max occurrences constraint
        if (config.maxOccurrences && count >= config.maxOccurrences)
            break;
        dates.push(new Date(currentDate));
        currentDate = calculateNextGenerationDate(currentDate, config.frequency, config.interval);
        count++;
    }
    return dates;
};
/**
 * Update recurring config after generating an invoice
 */
export const updateConfigAfterGeneration = (config) => {
    const nextDate = calculateNextGenerationDate(config.nextGenerationDate, config.frequency, config.interval);
    return {
        ...config,
        nextGenerationDate: nextDate,
    };
};
/**
 * Calculate the due date for a recurring invoice
 */
export const calculateRecurringInvoiceDueDate = (invoiceDate, paymentTermsDays = 30) => {
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentTermsDays);
    return dueDate;
};
/**
 * Generate invoice number for recurring invoice
 */
export const generateRecurringInvoiceNumber = (baseNumber, sequenceNumber, format = 'suffix') => {
    if (format === 'prefix') {
        return `${sequenceNumber.toString().padStart(3, '0')}-${baseNumber}`;
    }
    return `${baseNumber}-${sequenceNumber.toString().padStart(3, '0')}`;
};
/**
 * Check if a date falls within a recurring schedule
 */
export const isDateInRecurringSchedule = (date, config) => {
    // Check if date is after start date
    if (date < config.startDate)
        return false;
    // Check if date is before end date (if set)
    if (config.endDate && date > config.endDate)
        return false;
    // Calculate if the date aligns with the recurring pattern
    const daysDiff = Math.floor((date.getTime() - config.startDate.getTime()) / (1000 * 60 * 60 * 24));
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
export const getRecurringFrequencyDescription = (config) => {
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
export const validateRecurringDates = (config) => {
    const errors = [];
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
 * Calculate estimated total value of recurring invoices
 */
export const calculateRecurringTotalValue = (invoiceAmount, config, maxOccurrences) => {
    let estimatedCount = 0;
    if (config.maxOccurrences) {
        estimatedCount = config.maxOccurrences;
    }
    else if (config.endDate) {
        // Calculate based on end date
        const futureDate = getFutureGenerationDates(config, 1000);
        estimatedCount = futureDate.length;
    }
    else if (maxOccurrences) {
        estimatedCount = maxOccurrences;
    }
    else {
        // Default to 12 occurrences for estimation
        estimatedCount = 12;
    }
    return {
        totalValue: invoiceAmount * estimatedCount,
        estimatedCount,
    };
};
