import { AppError } from '@/lib/errors';

export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  error: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
    statusCode?: number;
  };
  context?: Record<string, any>;
  user?: {
    id?: string;
    email?: string;
  };
  request?: {
    url?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 1000;
  private isClient = typeof window !== 'undefined';

  log(error: Error, context?: Record<string, any>): string {
    const errorId = this.generateErrorId();
    const severity = this.determineSeverity(error);
    
    const logEntry: ErrorLogEntry = {
      id: errorId,
      timestamp: new Date(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error instanceof AppError ? error.code : undefined,
        statusCode: error instanceof AppError ? error.statusCode : undefined
      },
      context,
      user: this.getCurrentUser(),
      request: this.getRequestInfo(),
      severity
    };

    // Store in memory (with rotation)
    this.addToMemoryLog(logEntry);

    // Log to console with appropriate level
    this.logToConsole(logEntry);

    // Send to external monitoring service
    this.sendToMonitoring(logEntry);

    // Store in local storage for client-side errors
    if (this.isClient) {
      this.storeInLocalStorage(logEntry);
    }

    return errorId;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof AppError) {
      // Critical: Authentication failures, payment processing errors
      if (error.statusCode >= 500) return 'critical';
      if (error.statusCode === 401 || error.statusCode === 403) return 'high';
      if (error.statusCode >= 400) return 'medium';
      return 'low';
    }

    // Generic errors are considered high severity
    return 'high';
  }

  private getCurrentUser() {
    if (!this.isClient) return undefined;
    
    try {
      // Try to get user info from session storage or context
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          id: user.id,
          email: user.email
        };
      }
    } catch {
      // Ignore errors getting user info
    }
    
    return undefined;
  }

  private getRequestInfo() {
    if (!this.isClient) return undefined;
    
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      // IP would be set server-side
    };
  }

  private addToMemoryLog(entry: ErrorLogEntry) {
    this.logs.push(entry);
    
    // Rotate logs if we exceed max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private logToConsole(entry: ErrorLogEntry) {
    const logData = {
      id: entry.id,
      error: entry.error.message,
      code: entry.error.code,
      severity: entry.severity,
      context: entry.context,
      timestamp: entry.timestamp.toISOString()
    };

    switch (entry.severity) {
      case 'critical':
        console.error('🚨 CRITICAL ERROR:', logData);
        break;
      case 'high':
        console.error('❌ ERROR:', logData);
        break;
      case 'medium':
        console.warn('⚠️ WARNING:', logData);
        break;
      case 'low':
        console.info('ℹ️ INFO:', logData);
        break;
    }
  }

  private sendToMonitoring(entry: ErrorLogEntry) {
    // Send to external monitoring service (Sentry, LogRocket, etc.)
    if (this.isClient && (window as any).Sentry) {
      (window as any).Sentry.captureException(new Error(entry.error.message), {
        tags: {
          errorId: entry.id,
          severity: entry.severity,
          code: entry.error.code
        },
        contexts: {
          error: entry.error,
          custom: entry.context
        },
        user: entry.user
      });
    }

    // Send to custom logging endpoint
    if (entry.severity === 'critical' || entry.severity === 'high') {
      this.sendToLoggingEndpoint(entry);
    }
  }

  private async sendToLoggingEndpoint(entry: ErrorLogEntry) {
    try {
      // Skip in test environment or if no base URL available
      if (process.env.NODE_ENV === 'test' || !this.isClient) {
        return;
      }

      await fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      // Don't throw errors from error logging
      console.warn('Failed to send error to logging endpoint:', error);
    }
  }

  private storeInLocalStorage(entry: ErrorLogEntry) {
    try {
      const key = 'error_logs';
      const existingLogs = JSON.parse(localStorage.getItem(key) || '[]');
      existingLogs.push(entry);
      
      // Keep only last 50 errors in localStorage
      const recentLogs = existingLogs.slice(-50);
      localStorage.setItem(key, JSON.stringify(recentLogs));
    } catch {
      // Ignore localStorage errors
    }
  }

  // Get recent logs for debugging
  getRecentLogs(limit = 10): ErrorLogEntry[] {
    return this.logs.slice(-limit);
  }

  // Get logs by severity
  getLogsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): ErrorLogEntry[] {
    return this.logs.filter(log => log.severity === severity);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    if (this.isClient) {
      localStorage.removeItem('error_logs');
    }
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
const errorLogger = new ErrorLogger();

// Main logging function
export function logError(error: Error, context?: Record<string, any>): string {
  return errorLogger.log(error, context);
}

// Convenience functions
export function logCriticalError(error: Error, context?: Record<string, any>): string {
  return errorLogger.log(error, { ...context, forceSeverity: 'critical' });
}

export function getRecentErrors(limit?: number): ErrorLogEntry[] {
  return errorLogger.getRecentLogs(limit);
}

export function clearErrorLogs(): void {
  errorLogger.clearLogs();
}

export function exportErrorLogs(): string {
  return errorLogger.exportLogs();
}

// Error reporting hook for React components
export function useErrorReporting() {
  return {
    reportError: (error: Error, context?: Record<string, any>) => logError(error, context),
    reportCriticalError: (error: Error, context?: Record<string, any>) => logCriticalError(error, context),
    getRecentErrors: (limit?: number) => getRecentErrors(limit),
    clearLogs: () => clearErrorLogs()
  };
}