import { EmailService } from './EmailService';
import { EnhancedInvoice, Payment } from '../types';
import { prisma } from '../db/client';

export interface NotificationConfig {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  overdueReminders: boolean;
  recurringInvoiceNotifications: boolean;
  paymentConfirmations: boolean;
}

export interface NotificationTemplate {
  id: string;
  type: 'email' | 'in-app' | 'sms';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'payment' | 'invoice' | 'system' | 'reminder';
}

export class NotificationService {
  private static defaultConfig: NotificationConfig = {
    emailNotifications: true,
    inAppNotifications: true,
    overdueReminders: true,
    recurringInvoiceNotifications: true,
    paymentConfirmations: true,
  };

  /**
   * Send payment confirmation notifications
   */
  static async sendPaymentConfirmationNotifications(
    invoice: EnhancedInvoice,
    payment: Payment
  ): Promise<boolean> {
    try {
      const config = await this.getNotificationConfig();
      
      if (config.paymentConfirmations) {
        // Send email to client
        if (config.emailNotifications && invoice.client.email) {
          await EmailService.sendPaymentConfirmation(invoice, payment, invoice.client.email);
        }

        // Send notification to business owner
        const businessEmail = await this.getBusinessEmail();
        if (businessEmail) {
          await EmailService.sendPaymentNotification(invoice, payment, businessEmail);
        }

        // Create in-app notification
        if (config.inAppNotifications) {
          await this.createInAppNotification({
            id: `payment-${payment.transactionId}`,
            type: 'in-app',
            title: 'Payment Received',
            message: `Payment of ${payment.amount.amount} ${payment.amount.currency} received for Invoice ${invoice.invoiceNumber}`,
            priority: 'medium',
            category: 'payment'
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error sending payment confirmation notifications:', error);
      return false;
    }
  }

  /**
   * Send recurring invoice notifications
   */
  static async sendRecurringInvoiceNotifications(
    invoice: EnhancedInvoice
  ): Promise<boolean> {
    try {
      const config = await this.getNotificationConfig();
      
      if (config.recurringInvoiceNotifications && invoice.client.email) {
        await EmailService.sendRecurringInvoiceNotification(invoice, invoice.client.email);
      }

      return true;
    } catch (error) {
      console.error('Error sending recurring invoice notifications:', error);
      return false;
    }
  }

  /**
   * Send overdue reminders
   */
  static async sendOverdueReminders(
    invoice: EnhancedInvoice,
    daysOverdue: number
  ): Promise<boolean> {
    try {
      const config = await this.getNotificationConfig();
      
      if (config.overdueReminders && invoice.client.email) {
        await EmailService.sendOverdueReminder(invoice, invoice.client.email, daysOverdue);
      }

      // Create in-app notification for business owner
      if (config.inAppNotifications) {
        await this.createInAppNotification({
          id: `overdue-${invoice.id}`,
          type: 'in-app',
          title: 'Invoice Overdue',
          message: `Invoice ${invoice.invoiceNumber} is ${daysOverdue} days overdue`,
          priority: 'high',
          category: 'reminder'
        });
      }

      return true;
    } catch (error) {
      console.error('Error sending overdue reminders:', error);
      return false;
    }
  }

  /**
   * Send email verification for client registration
   */
  static async sendEmailVerification(
    clientEmail: string,
    verificationToken: string,
    clientName: string
  ): Promise<boolean> {
    try {
      return await EmailService.sendEmailVerification(clientEmail, verificationToken, clientName);
    } catch (error) {
      console.error('Error sending email verification:', error);
      return false;
    }
  }

  /**
   * Schedule overdue reminder notifications
   */
  static async scheduleOverdueReminders(): Promise<void> {
    try {
      const config = await this.getNotificationConfig();
      
      if (!config.overdueReminders) return;

      const today = new Date();
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          dueDate: {
            lt: today
          },
          status: 'pending'
        },
        include: {
          client: true
        }
      });

      for (const invoice of overdueInvoices) {
        const daysOverdue = Math.floor((today.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Send reminders at different intervals
        if (daysOverdue === 1 || daysOverdue === 7 || daysOverdue === 15 || daysOverdue === 30) {
          await this.sendOverdueReminders(invoice as any, daysOverdue);
        }
      }
    } catch (error) {
      console.error('Error scheduling overdue reminders:', error);
    }
  }

  /**
   * Create in-app notification
   */
  private static async createInAppNotification(notification: NotificationTemplate): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          category: notification.category,
          createdAt: new Date(),
          read: false
        }
      });
    } catch (error) {
      console.error('Error creating in-app notification:', error);
    }
  }

  /**
   * Get notification configuration
   */
  private static async getNotificationConfig(): Promise<NotificationConfig> {
    try {
      // In a real implementation, this would fetch from database
      // For now, return default config
      return this.defaultConfig;
    } catch (error) {
      console.error('Error getting notification config:', error);
      return this.defaultConfig;
    }
  }

  /**
   * Get business email from configuration
   */
  private static async getBusinessEmail(): Promise<string | null> {
    try {
      // In a real implementation, this would fetch from database
      return process.env.BUSINESS_EMAIL || null;
    } catch (error) {
      console.error('Error getting business email:', error);
      return null;
    }
  }

  /**
   * Get unread notifications for a user
   */
  static async getUnreadNotifications(userId: string): Promise<any[]> {
    try {
      return await prisma.notification.findMany({
        where: {
          userId,
          read: false
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Delete old notifications
   */
  static async cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          read: true
        }
      });
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }
}
