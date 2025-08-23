import { EnhancedInvoice, RecurringConfig } from '../types/invoice';
import {
  calculateNextDate,
  generateInvoiceNumber,
  shouldGenerateRecurringInvoice,
  calculateRecurringInvoiceDueDate
} from '../utils/recurring';
import { EmailService } from './EmailService';

export interface RecurringInvoiceTemplate {
  id: string;
  templateName: string;
  baseInvoice: EnhancedInvoice;
  recurringConfig: RecurringConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastGeneratedAt?: Date;
  nextGenerationDate: Date;
  generatedInvoices: string[]; // Array of generated invoice IDs
}

export class RecurringInvoiceService {
  private static templates: Map<string, RecurringInvoiceTemplate> = new Map();
  private static generatedInvoices: Map<string, EnhancedInvoice> = new Map();

  /**
   * Create a new recurring invoice template
   */
  static async createRecurringTemplate(
    baseInvoice: EnhancedInvoice,
    recurringConfig: RecurringConfig,
    templateName?: string
  ): Promise<RecurringInvoiceTemplate> {
    const id = this.generateId();
    const now = new Date();

    const template: RecurringInvoiceTemplate = {
      id,
      templateName: templateName || `Recurring ${baseInvoice.invoiceNumber}`,
      baseInvoice: { ...baseInvoice },
      recurringConfig: { ...recurringConfig },
      isActive: true,
      createdAt: now,
      updatedAt: now,
      nextGenerationDate: recurringConfig.nextGenerationDate,
      generatedInvoices: [],
    };

    this.templates.set(id, template);
    return template;
  }

  /**
   * Get all recurring invoice templates
   */
  static getAllTemplates(): RecurringInvoiceTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get active recurring invoice templates
   */
  static getActiveTemplates(): RecurringInvoiceTemplate[] {
    return Array.from(this.templates.values()).filter(template => template.isActive);
  }

  /**
   * Get a specific template by ID
   */
  static getTemplate(id: string): RecurringInvoiceTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Update a recurring template
   */
  static async updateTemplate(
    id: string,
    updates: Partial<RecurringInvoiceTemplate>
  ): Promise<RecurringInvoiceTemplate | null> {
    const template = this.templates.get(id);
    if (!template) return null;

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    };

    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  /**
   * Delete a recurring template
   */
  static async deleteTemplate(id: string): Promise<boolean> {
    return this.templates.delete(id);
  }

  /**
   * Toggle active status of a recurring template
   */
  static async toggleTemplate(id: string, isActive: boolean): Promise<RecurringInvoiceTemplate | null> {
    const template = this.templates.get(id);
    if (!template) return null;

    template.isActive = isActive;
    template.updatedAt = new Date();

    this.templates.set(id, template);
    return template;
  }

  /**
   * Generate invoice from recurring template
   */
  static async generateInvoiceFromTemplate(templateId: string): Promise<EnhancedInvoice | null> {
    const template = this.templates.get(templateId);
    if (!template || !template.isActive) return null;

    // Check if it's time to generate
    if (!shouldGenerateRecurringInvoice(template.recurringConfig)) {
      return null;
    }

    // Generate new invoice number
    const sequenceNumber = template.generatedInvoices.length + 1;
    const newInvoiceNumber = generateInvoiceNumber(template.baseInvoice.invoiceNumber, sequenceNumber);

    // Create new invoice based on template
    const currentDate = new Date();
    const newInvoice: EnhancedInvoice = {
      ...template.baseInvoice,
      id: this.generateId(),
      invoiceNumber: newInvoiceNumber,
      invoiceDate: currentDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD string format
      dueDate: calculateRecurringInvoiceDueDate(currentDate, 30),
      status: 'draft',
      createdAt: currentDate,
      updatedAt: currentDate,
      recurringConfig: undefined, // Generated invoices don't have recurring config
      parentInvoiceId: templateId,
    };

    // Store the generated invoice
    this.generatedInvoices.set(newInvoice.id, newInvoice);

    // Update template
    template.generatedInvoices.push(newInvoice.id);
    template.lastGeneratedAt = new Date();
    template.nextGenerationDate = calculateNextDate(
      template.nextGenerationDate,
      template.recurringConfig.frequency,
      template.recurringConfig.interval
    );
    template.updatedAt = new Date();

    this.templates.set(templateId, template);

    // Send notification email if configured
    try {
      if (template.baseInvoice.client.email) {
        await EmailService.sendRecurringInvoiceNotification(
          newInvoice,
          template.baseInvoice.client.email
        );
      }
    } catch (error) {
      console.error('Failed to send recurring invoice notification:', error);
    }

    return newInvoice;
  }

  /**
   * Generate all due recurring invoices
   */
  static async generateAllDueInvoices(): Promise<EnhancedInvoice[]> {
    const activeTemplates = this.getActiveTemplates();
    const generatedInvoices: EnhancedInvoice[] = [];

    for (const template of activeTemplates) {
      try {
        const invoice = await this.generateInvoiceFromTemplate(template.id);
        if (invoice) {
          generatedInvoices.push(invoice);
        }
      } catch (error) {
        console.error(`Failed to generate invoice from template ${template.id}:`, error);
      }
    }

    return generatedInvoices;
  }

  /**
   * Get all generated invoices for a template
   */
  static getGeneratedInvoices(templateId: string): EnhancedInvoice[] {
    const template = this.templates.get(templateId);
    if (!template) return [];

    return template.generatedInvoices
      .map(id => this.generatedInvoices.get(id))
      .filter((invoice): invoice is EnhancedInvoice => invoice !== undefined);
  }

  /**
   * Get upcoming generation dates for a template
   */
  static getUpcomingDates(templateId: string, count: number = 5): Date[] {
    const template = this.templates.get(templateId);
    if (!template) return [];

    const dates: Date[] = [];
    let currentDate = new Date(template.nextGenerationDate);

    for (let i = 0; i < count; i++) {
      // Check end date constraint
      if (template.recurringConfig.endDate && currentDate > template.recurringConfig.endDate) {
        break;
      }

      // Check max occurrences constraint
      if (template.recurringConfig.maxOccurrences &&
        template.generatedInvoices.length + i >= template.recurringConfig.maxOccurrences) {
        break;
      }

      dates.push(new Date(currentDate));
      currentDate = calculateNextDate(
        currentDate,
        template.recurringConfig.frequency,
        template.recurringConfig.interval
      );
    }

    return dates;
  }

  /**
   * Check if template should be automatically paused
   */
  static shouldPauseTemplate(template: RecurringInvoiceTemplate): boolean {
    const config = template.recurringConfig;
    const now = new Date();

    // Check end date
    if (config.endDate && now > config.endDate) {
      return true;
    }

    // Check max occurrences
    if (config.maxOccurrences && template.generatedInvoices.length >= config.maxOccurrences) {
      return true;
    }

    return false;
  }

  /**
   * Auto-pause templates that have reached their limits
   */
  static async autoPauseCompletedTemplates(): Promise<string[]> {
    const pausedTemplateIds: string[] = [];

    for (const template of this.templates.values()) {
      if (template.isActive && this.shouldPauseTemplate(template)) {
        await this.toggleTemplate(template.id, false);
        pausedTemplateIds.push(template.id);
      }
    }

    return pausedTemplateIds;
  }

  /**
   * Get statistics for recurring invoices
   */
  static getStatistics(): {
    totalTemplates: number;
    activeTemplates: number;
    pausedTemplates: number;
    totalGenerated: number;
    upcomingThisMonth: number;
  } {
    const templates = Array.from(this.templates.values());
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const upcomingThisMonth = templates.filter(template => {
      if (!template.isActive) return false;
      return template.nextGenerationDate >= now && template.nextGenerationDate < nextMonth;
    }).length;

    return {
      totalTemplates: templates.length,
      activeTemplates: templates.filter(t => t.isActive).length,
      pausedTemplates: templates.filter(t => !t.isActive).length,
      totalGenerated: Array.from(this.generatedInvoices.values()).length,
      upcomingThisMonth,
    };
  }

  /**
   * Generate a unique ID
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Initialize with sample data (for development)
   */
  static initializeSampleData(): void {
    // This would typically load from a database
    // For now, we'll keep the in-memory storage
    console.log('RecurringInvoiceService initialized');
  }

  /**
   * Export templates for backup
   */
  static exportTemplates(): RecurringInvoiceTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Import templates from backup
   */
  static importTemplates(templates: RecurringInvoiceTemplate[]): void {
    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Generate scheduled invoices (for cron jobs)
   */
  static async generateScheduledInvoices(): Promise<{
    success: boolean;
    generatedCount: number;
    errors: string[];
  }> {
    try {
      const generatedInvoices = await this.generateAllDueInvoices();
      return {
        success: true,
        generatedCount: generatedInvoices.length,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        generatedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Clear all data (for testing)
   */
  static clearAll(): void {
    this.templates.clear();
    this.generatedInvoices.clear();
  }
}

// Initialize the service
RecurringInvoiceService.initializeSampleData();

// Export a singleton instance for compatibility
export const recurringInvoiceService = {
  getDueRecurringInvoices: async () => {
    const templates = RecurringInvoiceService.getActiveTemplates();
    const dueTemplates = templates.filter(template => 
      template.nextGenerationDate <= new Date()
    );
    return {
      success: true,
      data: dueTemplates.map(template => template.baseInvoice),
    };
  },
  
  generateRecurringInvoice: async (templateId: string) => {
    const invoice = await RecurringInvoiceService.generateInvoiceFromTemplate(templateId);
    return {
      success: invoice !== null,
      data: invoice,
      error: invoice === null ? 'Failed to generate invoice' : undefined,
    };
  },
  
  getRecurringInvoiceStats: async () => {
    const stats = RecurringInvoiceService.getStatistics();
    return {
      success: true,
      data: stats,
    };
  },
  
  getRecurringInvoices: async () => {
    const templates = RecurringInvoiceService.getAllTemplates();
    return {
      success: true,
      data: templates.map(template => template.baseInvoice),
    };
  },
  
  getGeneratedInvoices: async (templateId: string) => {
    const invoices = RecurringInvoiceService.getGeneratedInvoices(templateId);
    return {
      success: true,
      data: invoices,
    };
  },
};