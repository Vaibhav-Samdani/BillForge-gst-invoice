// RecurringInvoiceService - Handles recurring invoice operations and template management
import { prisma } from '../db';
import { executeDbOperation, executeTransaction } from '../db/utils';
import { shouldGenerateRecurringInvoice, updateConfigAfterGeneration, calculateRecurringInvoiceDueDate, generateRecurringInvoiceNumber, hasReachedMaxOccurrences, calculateGeneratedCount, getFutureGenerationDates } from '../utils/recurring';
// Custom error classes for recurring invoice operations
export class RecurringInvoiceError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'RecurringInvoiceError';
    }
}
export class RecurringInvoiceService {
    /**
     * Create a new recurring invoice template
     */
    async createRecurringInvoice(invoiceData, recurringConfig) {
        try {
            // Validate recurring config
            const validation = this.validateRecurringConfig(recurringConfig);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: `Invalid recurring configuration: ${validation.errors.join(', ')}`
                };
            }
            // Create the invoice with recurring configuration
            const invoice = await prisma.invoice.create({
                data: {
                    invoiceNumber: invoiceData.invoiceNumber,
                    clientId: invoiceData.clientId,
                    businessData: invoiceData.business,
                    clientData: invoiceData.client,
                    lineItems: invoiceData.items,
                    currencyCode: invoiceData.currency.code,
                    exchangeRate: invoiceData.exchangeRate?.rate,
                    subtotal: invoiceData.totals.subtotal,
                    taxAmount: invoiceData.totals.cgst + invoiceData.totals.sgst + invoiceData.totals.igst,
                    totalAmount: invoiceData.totals.total,
                    status: invoiceData.status,
                    paymentStatus: invoiceData.paymentStatus,
                    isRecurring: true,
                    recurringConfig: recurringConfig,
                    parentInvoiceId: invoiceData.parentInvoiceId,
                    invoiceDate: new Date(invoiceData.invoiceDate),
                    dueDate: invoiceData.dueDate,
                },
                include: {
                    client: true,
                    childInvoices: true,
                },
            });
            return {
                success: true,
                data: this.mapPrismaToEnhancedInvoice(invoice)
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred'
            };
        }
    }
    /**
     * Get all recurring invoice templates
     */
    async getRecurringInvoices(clientId) {
        return executeDbOperation(async () => {
            const invoices = await prisma.invoice.findMany({
                where: {
                    isRecurring: true,
                    parentInvoiceId: null, // Only get templates, not generated invoices
                    ...(clientId && { clientId }),
                },
                include: {
                    client: true,
                    childInvoices: {
                        orderBy: { createdAt: 'desc' },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            return invoices.map(invoice => this.mapPrismaToEnhancedInvoice(invoice));
        });
    }
    /**
     * Get a specific recurring invoice template by ID
     */
    async getRecurringInvoiceById(id) {
        return executeDbOperation(async () => {
            const invoice = await prisma.invoice.findFirst({
                where: {
                    id,
                    isRecurring: true,
                    parentInvoiceId: null,
                },
                include: {
                    client: true,
                    childInvoices: {
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
            return invoice ? this.mapPrismaToEnhancedInvoice(invoice) : null;
        });
    }
    /**
     * Update a recurring invoice template
     */
    async updateRecurringInvoice(id, updates, newRecurringConfig) {
        return executeDbOperation(async () => {
            // Validate recurring config if provided
            if (newRecurringConfig) {
                const validation = this.validateRecurringConfig(newRecurringConfig);
                if (!validation.isValid) {
                    throw new RecurringInvoiceError(`Invalid recurring configuration: ${validation.errors.join(', ')}`, 'INVALID_RECURRING_CONFIG');
                }
            }
            const updateData = {};
            // Map updates to Prisma format
            if (updates.business)
                updateData.businessData = updates.business;
            if (updates.client)
                updateData.clientData = updates.client;
            if (updates.items)
                updateData.lineItems = updates.items;
            if (updates.currency)
                updateData.currencyCode = updates.currency.code;
            if (updates.exchangeRate)
                updateData.exchangeRate = updates.exchangeRate.rate;
            if (updates.totals) {
                updateData.subtotal = updates.totals.subtotal;
                updateData.taxAmount = updates.totals.cgst + updates.totals.sgst + updates.totals.igst;
                updateData.totalAmount = updates.totals.total;
            }
            if (updates.status)
                updateData.status = updates.status;
            if (updates.paymentStatus)
                updateData.paymentStatus = updates.paymentStatus;
            if (updates.invoiceDate)
                updateData.invoiceDate = new Date(updates.invoiceDate);
            if (updates.dueDate)
                updateData.dueDate = updates.dueDate;
            if (newRecurringConfig)
                updateData.recurringConfig = newRecurringConfig;
            const invoice = await prisma.invoice.update({
                where: { id },
                data: updateData,
                include: {
                    client: true,
                    childInvoices: {
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
            return this.mapPrismaToEnhancedInvoice(invoice);
        });
    }
    /**
     * Delete a recurring invoice template (and optionally its generated invoices)
     */
    async deleteRecurringInvoice(id, deleteGeneratedInvoices = false) {
        return executeTransaction(async (tx) => {
            if (deleteGeneratedInvoices) {
                // Delete all generated invoices first
                await tx.invoice.deleteMany({
                    where: { parentInvoiceId: id },
                });
            }
            else {
                // Just unlink generated invoices
                await tx.invoice.updateMany({
                    where: { parentInvoiceId: id },
                    data: { parentInvoiceId: null },
                });
            }
            // Delete the template
            await tx.invoice.delete({
                where: { id },
            });
            return true;
        });
    }
    /**
     * Get all invoices generated from a recurring template
     */
    async getGeneratedInvoices(templateId) {
        return executeDbOperation(async () => {
            const invoices = await prisma.invoice.findMany({
                where: {
                    parentInvoiceId: templateId,
                },
                include: {
                    client: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            return invoices.map(invoice => this.mapPrismaToEnhancedInvoice(invoice));
        });
    }
    /**
     * Generate a new invoice from a recurring template
     */
    async generateRecurringInvoice(templateId) {
        try {
            const result = await prisma.$transaction(async (tx) => {
                // Get the template
                const template = await tx.invoice.findUnique({
                    where: { id: templateId },
                    include: {
                        client: true,
                        childInvoices: true,
                    },
                });
                if (!template || !template.isRecurring) {
                    throw new RecurringInvoiceError('Recurring invoice template not found', 'TEMPLATE_NOT_FOUND');
                }
                const recurringConfig = template.recurringConfig;
                // Check if we should generate
                if (!shouldGenerateRecurringInvoice(recurringConfig)) {
                    throw new RecurringInvoiceError('Recurring invoice is not due for generation', 'NOT_DUE_FOR_GENERATION');
                }
                // Check max occurrences
                const generatedCount = calculateGeneratedCount(recurringConfig, template.childInvoices.map(child => ({})));
                if (hasReachedMaxOccurrences(recurringConfig, generatedCount)) {
                    throw new RecurringInvoiceError('Maximum occurrences reached for recurring invoice', 'MAX_OCCURRENCES_REACHED');
                }
                // Generate new invoice number with proper sequencing
                const newInvoiceNumber = await this.generateUniqueInvoiceNumber(template.invoiceNumber, generatedCount + 1);
                // Calculate new dates
                const invoiceDate = new Date(recurringConfig.nextGenerationDate);
                const dueDate = calculateRecurringInvoiceDueDate(invoiceDate);
                // Create the new invoice
                const newInvoice = await tx.invoice.create({
                    data: {
                        invoiceNumber: newInvoiceNumber,
                        clientId: template.clientId,
                        businessData: template.businessData,
                        clientData: template.clientData,
                        lineItems: template.lineItems,
                        currencyCode: template.currencyCode,
                        exchangeRate: template.exchangeRate,
                        subtotal: template.subtotal,
                        taxAmount: template.taxAmount,
                        totalAmount: template.totalAmount,
                        status: 'draft',
                        paymentStatus: 'unpaid',
                        isRecurring: false,
                        parentInvoiceId: templateId,
                        invoiceDate,
                        dueDate,
                    },
                    include: {
                        client: true,
                    },
                });
                // Update the template's next generation date
                const updatedConfig = updateConfigAfterGeneration(recurringConfig);
                await tx.invoice.update({
                    where: { id: templateId },
                    data: {
                        recurringConfig: updatedConfig,
                    },
                });
                return this.mapPrismaToEnhancedInvoice(newInvoice);
            });
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            if (error instanceof RecurringInvoiceError) {
                return {
                    success: false,
                    error: error.message
                };
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred'
            };
        }
    }
    /**
     * Get all recurring invoices that are due for generation
     */
    async getDueRecurringInvoices() {
        return executeDbOperation(async () => {
            const templates = await prisma.invoice.findMany({
                where: {
                    isRecurring: true,
                    parentInvoiceId: null,
                },
                include: {
                    client: true,
                    childInvoices: true,
                },
            });
            const dueTemplates = templates.filter(template => {
                const config = template.recurringConfig;
                return shouldGenerateRecurringInvoice(config);
            });
            return dueTemplates.map(template => this.mapPrismaToEnhancedInvoice(template));
        });
    }
    /**
     * Pause/resume a recurring invoice
     */
    async toggleRecurringInvoice(id, isActive) {
        try {
            const template = await prisma.invoice.findUnique({
                where: { id },
            });
            if (!template || !template.isRecurring) {
                return {
                    success: false,
                    error: 'Recurring invoice template not found'
                };
            }
            const config = template.recurringConfig;
            const updatedConfig = { ...config, isActive };
            const updatedInvoice = await prisma.invoice.update({
                where: { id },
                data: {
                    recurringConfig: updatedConfig,
                },
                include: {
                    client: true,
                    childInvoices: {
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
            return {
                success: true,
                data: this.mapPrismaToEnhancedInvoice(updatedInvoice)
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred'
            };
        }
    }
    /**
     * Get recurring invoice statistics
     */
    async getRecurringInvoiceStats(clientId) {
        return executeDbOperation(async () => {
            const whereClause = {
                isRecurring: true,
                parentInvoiceId: null,
                ...(clientId && { clientId }),
            };
            const templates = await prisma.invoice.findMany({
                where: whereClause,
                include: {
                    childInvoices: true,
                },
            });
            const activeTemplates = templates.filter(template => {
                const config = template.recurringConfig;
                return config.isActive;
            });
            const totalGenerated = templates.reduce((sum, template) => sum + template.childInvoices.length, 0);
            const totalValue = templates.reduce((sum, template) => sum + template.totalAmount, 0);
            const upcomingGenerations = templates.filter(template => {
                const config = template.recurringConfig;
                return shouldGenerateRecurringInvoice(config);
            }).length;
            return {
                totalTemplates: templates.length,
                activeTemplates: activeTemplates.length,
                totalGenerated,
                totalValue,
                upcomingGenerations,
            };
        });
    }
    /**
     * Get future generation dates for a recurring invoice
     */
    async getFutureGenerations(templateId, maxDates = 12) {
        return executeDbOperation(async () => {
            const template = await prisma.invoice.findUnique({
                where: { id: templateId },
            });
            if (!template || !template.isRecurring) {
                throw new RecurringInvoiceError('Recurring invoice template not found', 'TEMPLATE_NOT_FOUND');
            }
            const config = template.recurringConfig;
            return getFutureGenerationDates(config, maxDates);
        });
    }
    /**
     * Validate recurring configuration
     */
    validateRecurringConfig(config) {
        const errors = [];
        // Validate frequency
        if (!['weekly', 'monthly', 'quarterly', 'yearly'].includes(config.frequency)) {
            errors.push('Invalid frequency. Must be weekly, monthly, quarterly, or yearly');
        }
        // Validate interval
        if (!config.interval || config.interval < 1 || config.interval > 100) {
            errors.push('Interval must be between 1 and 100');
        }
        // Validate dates
        if (!config.startDate || !(config.startDate instanceof Date)) {
            errors.push('Valid start date is required');
        }
        if (!config.nextGenerationDate || !(config.nextGenerationDate instanceof Date)) {
            errors.push('Valid next generation date is required');
        }
        if (config.endDate && !(config.endDate instanceof Date)) {
            errors.push('End date must be a valid date');
        }
        if (config.endDate && config.startDate && config.endDate <= config.startDate) {
            errors.push('End date must be after start date');
        }
        // Validate max occurrences
        if (config.maxOccurrences && (config.maxOccurrences < 1 || config.maxOccurrences > 1000)) {
            errors.push('Max occurrences must be between 1 and 1000');
        }
        // Validate that either endDate or maxOccurrences is set (or both)
        if (!config.endDate && !config.maxOccurrences) {
            errors.push('Either end date or max occurrences must be specified');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    /**
     * Generate a unique invoice number for recurring invoices
     */
    async generateUniqueInvoiceNumber(baseNumber, sequenceNumber, maxAttempts = 100) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const candidateNumber = generateRecurringInvoiceNumber(baseNumber, sequenceNumber + attempt);
            // Check if this invoice number already exists
            const existing = await prisma.invoice.findFirst({
                where: { invoiceNumber: candidateNumber },
            });
            if (!existing) {
                return candidateNumber;
            }
        }
        // If we couldn't find a unique number, use timestamp suffix
        const timestamp = Date.now().toString().slice(-6);
        return generateRecurringInvoiceNumber(baseNumber, sequenceNumber, 'suffix') + `-${timestamp}`;
    }
    /**
     * Map Prisma invoice to EnhancedInvoice
     */
    mapPrismaToEnhancedInvoice(invoice) {
        return {
            id: invoice.id,
            business: invoice.businessData,
            client: invoice.clientData,
            items: invoice.lineItems,
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
            sameGst: true, // This would need to be derived from the data
            globalGst: 0, // This would need to be derived from the data
            totals: {
                subtotal: invoice.subtotal,
                cgst: invoice.taxAmount / 2, // Assuming equal split between CGST and SGST
                sgst: invoice.taxAmount / 2,
                igst: 0,
                round_off: 0,
                total: invoice.totalAmount,
            },
            currency: {
                code: invoice.currencyCode,
                symbol: '$', // This would need to be looked up
                name: 'US Dollar', // This would need to be looked up
                decimalPlaces: 2,
            },
            exchangeRate: invoice.exchangeRate ? {
                baseCurrency: 'USD',
                targetCurrency: invoice.currencyCode,
                rate: invoice.exchangeRate,
                timestamp: new Date(),
                source: 'stored',
            } : undefined,
            isRecurring: invoice.isRecurring,
            recurringConfig: invoice.recurringConfig,
            parentInvoiceId: invoice.parentInvoiceId,
            status: invoice.status,
            paymentStatus: invoice.paymentStatus,
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt,
            dueDate: invoice.dueDate,
            paidAt: invoice.paidAt,
            clientId: invoice.clientId,
        };
    }
}
// Export a singleton instance
export const recurringInvoiceService = new RecurringInvoiceService();
