// RecurringInvoiceService - Handles recurring invoice operations and template management
import { prisma } from '../db';
import { executeDbOperation, executeTransaction } from '../db/utils';
import {
  EnhancedInvoice,
  RecurringConfig,
  Currency,
  ExchangeRate
} from '../types/invoice';
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
  shouldStopRecurring,
  shouldGenerateRecurringInvoice,
  calculateGeneratedCount,
  hasReachedMaxOccurrences,
  updateConfigAfterGeneration,
  calculateRecurringInvoiceDueDate,
  generateRecurringInvoiceNumber,
  getFutureGenerationDates,
  RecurringSchedule,
  RecurringFrequency
} from '../utils/recurring';
import { DatabaseResult } from '../types/database';

// Custom error classes for recurring invoice operations
export class RecurringInvoiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RecurringInvoiceError';
  }
}

export class RecurringInvoiceService {
  /**
   * Create a new recurring invoice template
   */
  async createRecurringInvoice(
    invoiceData: Omit<EnhancedInvoice, 'id' | 'createdAt' | 'updatedAt'>,
    recurringConfig: RecurringConfig
  ): Promise<DatabaseResult<EnhancedInvoice>> {
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
          businessData: invoiceData.business as any,
          clientData: invoiceData.client as any,
          lineItems: invoiceData.items as any,
          currencyCode: invoiceData.currency.code,
          exchangeRate: invoiceData.exchangeRate?.rate,
          subtotal: invoiceData.totals.subtotal,
          taxAmount: invoiceData.totals.cgst + invoiceData.totals.sgst + invoiceData.totals.igst,
          totalAmount: invoiceData.totals.total,
          status: invoiceData.status,
          paymentStatus: invoiceData.paymentStatus,
          isRecurring: true,
          recurringConfig: recurringConfig as any,
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  }

  /**
   * Get all recurring invoice templates
   */
  async getRecurringInvoices(clientId?: string): Promise<DatabaseResult<EnhancedInvoice[]>> {
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
  async getRecurringInvoiceById(id: string): Promise<DatabaseResult<EnhancedInvoice | null>> {
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
  async updateRecurringInvoice(
    id: string,
    updates: Partial<EnhancedInvoice>,
    newRecurringConfig?: RecurringConfig
  ): Promise<DatabaseResult<EnhancedInvoice>> {
    return executeDbOperation(async () => {
      // Validate recurring config if provided
      if (newRecurringConfig) {
        const validation = this.validateRecurringConfig(newRecurringConfig);
        if (!validation.isValid) {
          throw new RecurringInvoiceError(
            `Invalid recurring configuration: ${validation.errors.join(', ')}`,
            'INVALID_RECURRING_CONFIG'
          );
        }
      }

      const updateData: any = {};

      // Map updates to Prisma format
      if (updates.business) updateData.businessData = updates.business;
      if (updates.client) updateData.clientData = updates.client;
      if (updates.items) updateData.lineItems = updates.items;
      if (updates.currency) updateData.currencyCode = updates.currency.code;
      if (updates.exchangeRate) updateData.exchangeRate = updates.exchangeRate.rate;
      if (updates.totals) {
        updateData.subtotal = updates.totals.subtotal;
        updateData.taxAmount = updates.totals.cgst + updates.totals.sgst + updates.totals.igst;
        updateData.totalAmount = updates.totals.total;
      }
      if (updates.status) updateData.status = updates.status;
      if (updates.paymentStatus) updateData.paymentStatus = updates.paymentStatus;
      if (updates.invoiceDate) updateData.invoiceDate = new Date(updates.invoiceDate);
      if (updates.dueDate) updateData.dueDate = updates.dueDate;
      if (newRecurringConfig) updateData.recurringConfig = newRecurringConfig as any;

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
  async deleteRecurringInvoice(
    id: string,
    deleteGeneratedInvoices: boolean = false
  ): Promise<DatabaseResult<boolean>> {
    return executeTransaction(async (tx) => {
      if (deleteGeneratedInvoices) {
        // Delete all generated invoices first
        await tx.invoice.deleteMany({
          where: { parentInvoiceId: id },
        });
      } else {
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
  async getGeneratedInvoices(templateId: string): Promise<DatabaseResult<EnhancedInvoice[]>> {
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
  async generateRecurringInvoice(templateId: string): Promise<DatabaseResult<EnhancedInvoice>> {
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
          throw new RecurringInvoiceError(
            'Recurring invoice template not found',
            'TEMPLATE_NOT_FOUND'
          );
        }

        const recurringConfig = template.recurringConfig as unknown as RecurringConfig;

        // Convert to RecurringSchedule for validation functions
        const scheduleConfig: RecurringSchedule = {
          frequency: recurringConfig.frequency as RecurringFrequency,
          interval: recurringConfig.interval,
          startDate: recurringConfig.startDate,
          endDate: recurringConfig.endDate,
          maxOccurrences: recurringConfig.maxOccurrences,
          isActive: recurringConfig.isActive,
        };

        // Check if we should generate
        if (!shouldGenerateRecurringInvoice(scheduleConfig)) {
          throw new RecurringInvoiceError(
            'Recurring invoice is not due for generation',
            'NOT_DUE_FOR_GENERATION'
          );
        }

        // Check max occurrences - use the original recurringConfig for functions that expect RecurringConfig
        const generatedCount = template.childInvoices.length;
        if (recurringConfig.maxOccurrences && generatedCount >= recurringConfig.maxOccurrences) {
          throw new RecurringInvoiceError(
            'Maximum occurrences reached for recurring invoice',
            'MAX_OCCURRENCES_REACHED'
          );
        }

        // Generate new invoice number with proper sequencing
        const newInvoiceNumber = await this.generateUniqueInvoiceNumber(
          template.invoiceNumber,
          generatedCount + 1
        );

        // Calculate new dates
        const nextDate = (recurringConfig as any).nextGenerationDate || recurringConfig.startDate;
        const invoiceDate = new Date(nextDate);
        const dueDate = calculateRecurringInvoiceDueDate(invoiceDate);

        // Create the new invoice
        const newInvoice = await tx.invoice.create({
          data: {
            invoiceNumber: newInvoiceNumber,
            clientId: template.clientId,
            businessData: template.businessData as any,
            clientData: template.clientData as any,
            lineItems: template.lineItems as any,
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
            recurringConfig: updatedConfig as any,
          },
        });

        return this.mapPrismaToEnhancedInvoice(newInvoice);
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
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
  async getDueRecurringInvoices(): Promise<DatabaseResult<EnhancedInvoice[]>> {
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
        const config = template.recurringConfig as unknown as RecurringConfig;
        const scheduleConfig: RecurringSchedule = {
          frequency: config.frequency as RecurringFrequency,
          interval: config.interval,
          startDate: config.startDate,
          endDate: config.endDate,
          maxOccurrences: config.maxOccurrences,
          isActive: config.isActive,
        };
        return shouldGenerateRecurringInvoice(scheduleConfig);
      });

      return dueTemplates.map(template => this.mapPrismaToEnhancedInvoice(template));
    });
  }

  /**
   * Pause/resume a recurring invoice
   */
  async toggleRecurringInvoice(id: string, isActive: boolean): Promise<DatabaseResult<EnhancedInvoice>> {
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

      const config = template.recurringConfig as unknown as RecurringConfig;
      const updatedConfig = { ...config, isActive };

      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: {
          recurringConfig: updatedConfig as any,
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  }

  /**
   * Get recurring invoice statistics
   */
  async getRecurringInvoiceStats(clientId?: string): Promise<DatabaseResult<{
    totalTemplates: number;
    activeTemplates: number;
    totalGenerated: number;
    totalValue: number;
    upcomingGenerations: number;
  }>> {
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
        const config = template.recurringConfig as unknown as RecurringConfig;
        return config.isActive;
      });

      const totalGenerated = templates.reduce((sum, template) => sum + template.childInvoices.length, 0);
      const totalValue = templates.reduce((sum, template) => sum + template.totalAmount, 0);

      const upcomingGenerations = templates.filter(template => {
        const config = template.recurringConfig as unknown as RecurringConfig;
        const scheduleConfig: RecurringSchedule = {
          frequency: config.frequency as RecurringFrequency,
          interval: config.interval,
          startDate: config.startDate,
          endDate: config.endDate,
          maxOccurrences: config.maxOccurrences,
          isActive: config.isActive,
        };
        return shouldGenerateRecurringInvoice(scheduleConfig);
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
  async getFutureGenerations(templateId: string, maxDates: number = 12): Promise<DatabaseResult<Date[]>> {
    return executeDbOperation(async () => {
      const template = await prisma.invoice.findUnique({
        where: { id: templateId },
      });

      if (!template || !template.isRecurring) {
        throw new RecurringInvoiceError(
          'Recurring invoice template not found',
          'TEMPLATE_NOT_FOUND'
        );
      }

      const config = template.recurringConfig as unknown as RecurringConfig;

      // Ensure we have a nextGenerationDate for the function
      const configWithNextDate: RecurringConfig = {
        ...config,
        nextGenerationDate: config.nextGenerationDate || config.startDate
      };

      return getFutureGenerationDates(configWithNextDate, maxDates);
    });
  }

  /**
   * Validate recurring configuration
   */
  private validateRecurringConfig(config: RecurringConfig | RecurringSchedule): { isValid: boolean; errors: string[] } {
    // Convert RecurringConfig to RecurringSchedule format for validation
    const schedule: RecurringSchedule = {
      frequency: config.frequency as RecurringFrequency,
      interval: config.interval,
      startDate: config.startDate,
      endDate: config.endDate,
      maxOccurrences: config.maxOccurrences,
      occurrenceCount: (config as any).occurrenceCount,
      isActive: config.isActive,
    };

    const result = validateRecurringSchedule(schedule);

    // Additional validation specific to RecurringConfig
    const errors = [...result.errors];

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
  private async generateUniqueInvoiceNumber(
    baseNumber: string,
    sequenceNumber: number,
    maxAttempts: number = 100
  ): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidateNumber = generateRecurringInvoiceNumber(
        baseNumber,
        sequenceNumber + attempt
      );

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
   * Get currency symbol for a currency code
   */
  private getCurrencySymbol(currencyCode: string): string {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
    };
    return symbols[currencyCode] || currencyCode;
  }

  /**
   * Get currency name for a currency code
   */
  private getCurrencyName(currencyCode: string): string {
    const names: Record<string, string> = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound',
      'JPY': 'Japanese Yen',
      'CAD': 'Canadian Dollar',
      'AUD': 'Australian Dollar',
    };
    return names[currencyCode] || currencyCode;
  }

  /**
   * Get decimal places for a currency
   */
  private getCurrencyDecimalPlaces(currencyCode: string): number {
    const decimalPlaces: Record<string, number> = {
      'JPY': 0,
      'KRW': 0,
      'VND': 0,
    };
    return decimalPlaces[currencyCode] || 2;
  }

  /**
   * Map Prisma invoice to EnhancedInvoice
   */
  private mapPrismaToEnhancedInvoice(invoice: any): EnhancedInvoice {
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
        code: invoice.currencyCode || 'USD',
        symbol: this.getCurrencySymbol(invoice.currencyCode || 'USD'),
        name: this.getCurrencyName(invoice.currencyCode || 'USD'),
        decimalPlaces: this.getCurrencyDecimalPlaces(invoice.currencyCode || 'USD'),
      },
      exchangeRate: invoice.exchangeRate ? {
        baseCurrency: 'USD',
        targetCurrency: invoice.currencyCode || 'USD',
        rate: invoice.exchangeRate,
        timestamp: new Date(),
        source: 'stored' as const,
      } : undefined,
      isRecurring: invoice.isRecurring || false,
      recurringConfig: invoice.recurringConfig as unknown as RecurringConfig,
      parentInvoiceId: invoice.parentInvoiceId,
      status: invoice.status as any,
      paymentStatus: invoice.paymentStatus as any,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      clientId: invoice.clientId,
    };
  }

  /**
   * Update recurring configuration for an existing template
   */
  async updateRecurringConfig(
    templateId: string,
    newConfig: Partial<RecurringConfig>
  ): Promise<DatabaseResult<EnhancedInvoice>> {
    return executeDbOperation(async () => {
      const template = await prisma.invoice.findUnique({
        where: { id: templateId },
      });

      if (!template || !template.isRecurring) {
        throw new RecurringInvoiceError(
          'Recurring invoice template not found',
          'TEMPLATE_NOT_FOUND'
        );
      }

      const currentConfig = template.recurringConfig as unknown as RecurringConfig;
      const updatedConfig = { ...currentConfig, ...newConfig };

      // Validate the updated config
      const validation = this.validateRecurringConfig(updatedConfig);
      if (!validation.isValid) {
        throw new RecurringInvoiceError(
          `Invalid recurring configuration: ${validation.errors.join(', ')}`,
          'INVALID_RECURRING_CONFIG'
        );
      }

      const updatedInvoice = await prisma.invoice.update({
        where: { id: templateId },
        data: {
          recurringConfig: updatedConfig as any,
        },
        include: {
          client: true,
          childInvoices: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return this.mapPrismaToEnhancedInvoice(updatedInvoice);
    });
  }

  /**
   * Cancel a recurring invoice (set to inactive)
   */
  async cancelRecurring(templateId: string): Promise<DatabaseResult<boolean>> {
    return executeDbOperation(async () => {
      const template = await prisma.invoice.findUnique({
        where: { id: templateId },
      });

      if (!template || !template.isRecurring) {
        throw new RecurringInvoiceError(
          'Recurring invoice template not found',
          'TEMPLATE_NOT_FOUND'
        );
      }

      const config = template.recurringConfig as unknown as RecurringConfig;
      const updatedConfig = { ...config, isActive: false };

      await prisma.invoice.update({
        where: { id: templateId },
        data: {
          recurringConfig: updatedConfig as any,
        },
      });

      return true;
    });
  }

  /**
   * Generate scheduled invoices for all due recurring templates
   */
  async generateScheduledInvoices(): Promise<DatabaseResult<EnhancedInvoice[]>> {
    try {
      const dueTemplatesResult = await this.getDueRecurringInvoices();
      if (!dueTemplatesResult.success || !dueTemplatesResult.data) {
        return {
          success: false,
          error: dueTemplatesResult.error || 'Failed to get due recurring invoices'
        };
      }

      const generatedInvoices: EnhancedInvoice[] = [];

      for (const template of dueTemplatesResult.data) {
        try {
          const result = await this.generateRecurringInvoice(template.id);
          if (result.success && result.data) {
            generatedInvoices.push(result.data);
          }
        } catch (error) {
          // Log error but continue with other templates
          console.error(`Failed to generate recurring invoice for template ${template.id}:`, error);
        }
      }

      return {
        success: true,
        data: generatedInvoices
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  }

  /**
   * Calculate next generation date for a recurring config
   */
  calculateNextGenerationDate(
    currentDate: Date,
    frequency: RecurringFrequency,
    interval: number
  ): Date {
    return calculateNextDate(currentDate, frequency, interval);
  }
}

// Export a singleton instance
export const recurringInvoiceService = new RecurringInvoiceService();