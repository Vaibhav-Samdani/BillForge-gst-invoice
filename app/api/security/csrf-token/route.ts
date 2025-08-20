import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/utils/security';
import { withSecurity } from '@/lib/middleware/security';

async function getCsrfTokenHandler(request: NextRequest, context?: any) {
  try {
    // Get client IP or session ID for CSRF token generation
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown';
    
    const sessionId = request.headers.get('x-session-id') || clientIP;
    
    // Generate CSRF token
    const csrfToken = CSRFProtection.generateToken(sessionId);
    
    return NextResponse.json({
      csrfToken,
      sessionId,
      expiresIn: 3600 // 1 hour
    });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

// Apply minimal security for CSRF token endpoint
const securedHandler = withSecurity({
  rateLimit: 'api',
  maxRequestSize: 512, // Very small request size
  allowedMethods: ['GET']
})(getCsrfTokenHandler);

export async function GET(request: NextRequest) {
  return securedHandler(request);
}