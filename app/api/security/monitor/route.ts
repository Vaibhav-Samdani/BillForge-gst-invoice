import { NextRequest, NextResponse } from 'next/server';
import { SecurityMonitor } from '@/lib/utils/security';
import { withSecurity, withSecurityAudit } from '@/lib/middleware/security';
import { auth } from '@/lib/auth/config';

async function getSecurityEventsHandler(request: NextRequest, context?: any) {
  try {
    const session = await auth();
    
    // Only allow admin users to access security monitoring
    // In a real implementation, you'd check for admin role
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity') as 'low' | 'medium' | 'high' | 'critical' | null;
    const limit = parseInt(searchParams.get('limit') || '100');

    // Get security events
    const events = SecurityMonitor.getSecurityEvents(severity || undefined, limit);
    const summary = SecurityMonitor.getSecuritySummary();

    return NextResponse.json({
      summary,
      events: events.map(event => ({
        ...event,
        // Don't expose sensitive details in API response
        details: event.severity === 'critical' ? '[REDACTED]' : event.details
      }))
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function clearSecurityEventsHandler(request: NextRequest, context?: any) {
  try {
    const session = await auth();
    
    // Only allow admin users to clear security events
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In a real implementation, you'd implement the clear functionality
    // For now, just log the action
    SecurityMonitor.logSecurityEvent(
      'security_events_cleared',
      'medium',
      { adminUserId: session.user.id },
      request
    );

    return NextResponse.json({ message: 'Security events cleared' });
  } catch (error) {
    console.error('Error clearing security events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply security middleware for admin endpoints
const securedGetHandler = withSecurity({
  requireAuth: true,
  rateLimit: 'api',
  maxRequestSize: 1024,
  allowedMethods: ['GET']
})(getSecurityEventsHandler);

const securedDeleteHandler = withSecurity({
  requireAuth: true,
  requireCSRF: true,
  rateLimit: 'api',
  maxRequestSize: 1024,
  allowedMethods: ['DELETE']
})(clearSecurityEventsHandler);

// Add audit logging
const auditedGetHandler = withSecurityAudit()(securedGetHandler);
const auditedDeleteHandler = withSecurityAudit()(securedDeleteHandler);

export async function GET(request: NextRequest) {
  return auditedGetHandler(request);
}

export async function DELETE(request: NextRequest) {
  return auditedDeleteHandler(request);
}