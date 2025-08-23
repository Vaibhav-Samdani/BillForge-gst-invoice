import { NextRequest, NextResponse } from 'next/server';
import { ErrorLogEntry } from '@/lib/utils/errorLogger';

// In a real application, you would store these in a database
// For now, we'll just log them and optionally send to external services
export async function POST(request: NextRequest) {
  try {
    const errorEntry: ErrorLogEntry = await request.json();
    
    // Validate the error entry
    if (!errorEntry.id || !errorEntry.error || !errorEntry.timestamp) {
      return NextResponse.json(
        { error: 'Invalid error log entry' },
        { status: 400 }
      );
    }

    // Log to server console with structured format
    console.error('Client Error Logged:', {
      id: errorEntry.id,
      timestamp: errorEntry.timestamp,
      error: {
        name: errorEntry.error.name,
        message: errorEntry.error.message,
        code: errorEntry.error.code,
        statusCode: errorEntry.error.statusCode
      },
      severity: errorEntry.severity,
      user: errorEntry.user,
      request: errorEntry.request,
      context: errorEntry.context
    });

    // Send to external monitoring service if configured
    await sendToExternalMonitoring(errorEntry);

    // Store in database (implement based on your database choice)
    await storeErrorLog(errorEntry);

    // Send alerts for critical errors
    if (errorEntry.severity === 'critical') {
      await sendCriticalErrorAlert(errorEntry);
    }

    return NextResponse.json({ 
      success: true, 
      id: errorEntry.id 
    });

  } catch (error) {
    console.error('Failed to log error:', error);
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
}

async function sendToExternalMonitoring(errorEntry: ErrorLogEntry) {
  // Example: Send to Sentry, LogRocket, or other monitoring service
  // This would be configured based on your monitoring setup
  
  try {
    // Example Sentry integration (if using server-side Sentry)
    if (process.env.SENTRY_DSN) {
      // Sentry.captureException would go here
      console.log('Would send to Sentry:', errorEntry.id);
    }

    // Example: Send to custom logging service
    if (process.env.CUSTOM_LOGGING_ENDPOINT) {
      await fetch(process.env.CUSTOM_LOGGING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOGGING_API_KEY}`
        },
        body: JSON.stringify(errorEntry)
      });
    }
  } catch (error) {
    console.warn('Failed to send to external monitoring:', error);
    // Don't throw - logging failures shouldn't break the app
  }
}

async function storeErrorLog(errorEntry: ErrorLogEntry) {
  // In a real application, store in your database
  // Example with Prisma:
  /*
  try {
    await prisma.errorLog.create({
      data: {
        id: errorEntry.id,
        timestamp: errorEntry.timestamp,
        errorName: errorEntry.error.name,
        errorMessage: errorEntry.error.message,
        errorStack: errorEntry.error.stack,
        errorCode: errorEntry.error.code,
        statusCode: errorEntry.error.statusCode,
        severity: errorEntry.severity,
        context: errorEntry.context ? JSON.stringify(errorEntry.context) : null,
        userId: errorEntry.user?.id,
        userEmail: errorEntry.user?.email,
        requestUrl: errorEntry.request?.url,
        requestMethod: errorEntry.request?.method,
        userAgent: errorEntry.request?.userAgent,
        ipAddress: errorEntry.request?.ip
      }
    });
  } catch (error) {
    console.warn('Failed to store error log in database:', error);
  }
  */
  
  // For now, just log that we would store it
  console.log('Would store error log in database:', errorEntry.id);
}

async function sendCriticalErrorAlert(errorEntry: ErrorLogEntry) {
  try {
    // Send email alert, Slack notification, etc. for critical errors
    console.log('CRITICAL ERROR ALERT:', {
      id: errorEntry.id,
      error: errorEntry.error.message,
      user: errorEntry.user?.email,
      timestamp: errorEntry.timestamp
    });

    // Example: Send email notification
    if (process.env.ALERT_EMAIL_ENDPOINT) {
      await fetch(process.env.ALERT_EMAIL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: process.env.ADMIN_EMAIL,
          subject: `Critical Error: ${errorEntry.error.name}`,
          body: `
            Critical error occurred:
            
            Error ID: ${errorEntry.id}
            Time: ${errorEntry.timestamp}
            Error: ${errorEntry.error.message}
            User: ${errorEntry.user?.email || 'Anonymous'}
            URL: ${errorEntry.request?.url || 'Unknown'}
            
            Context: ${JSON.stringify(errorEntry.context, null, 2)}
          `
        })
      });
    }
  } catch (error) {
    console.warn('Failed to send critical error alert:', error);
  }
}

// GET endpoint to retrieve error logs (for admin/debugging)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // In a real application, query from database
    // For now, return a placeholder response
    const logs: any[] = []; // Would fetch from database based on filters

    return NextResponse.json({
      logs,
      total: logs.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('Failed to retrieve error logs:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve error logs' },
      { status: 500 }
    );
  }
}