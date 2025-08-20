import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '../../../../lib/services/PaymentService';
import { PaymentError } from '../../../../lib/config/stripe';
import { paymentSecurityMiddleware, withSecurityAudit } from '@/lib/middleware/security';
import { SecurityMonitor } from '@/lib/utils/security';
import { SensitiveDataEncryption } from '@/lib/services/encryption';

async function createPaymentIntentHandler(request: NextRequest, context?: any) {
  try {
    // Get validated data from security middleware
    const { invoiceId, clientId, amount, description, metadata } = context?.validatedData || {};
    const user = context?.user;

    // Additional authorization check - ensure user can create payment for this invoice
    if (user?.id !== clientId) {
      SecurityMonitor.logSecurityEvent(
        'unauthorized_payment_attempt',
        'high',
        { userId: user?.id, requestedClientId: clientId, invoiceId },
        request
      );
      return NextResponse.json(
        { error: 'Unauthorized: Cannot create payment for another client' },
        { status: 403 }
      );
    }

    // Log payment intent creation attempt
    SecurityMonitor.logSecurityEvent(
      'payment_intent_creation_started',
      'medium',
      { 
        invoiceId, 
        clientId, 
        amount: amount.amount, 
        currency: amount.currency,
        userAgent: request.headers.get('user-agent')
      },
      request
    );

    // Create payment intent with encrypted metadata
    const encryptedMetadata = metadata ? {
      ...metadata,
      // Encrypt sensitive metadata if present
      clientInfo: metadata.clientInfo ? 
        SensitiveDataEncryption.encryptPersonalData(metadata.clientInfo) : 
        undefined
    } : undefined;

    const paymentIntent = await PaymentService.createPaymentIntent({
      invoiceId,
      clientId,
      amount,
      description,
      metadata: encryptedMetadata,
    });

    // Log successful payment intent creation
    SecurityMonitor.logSecurityEvent(
      'payment_intent_created',
      'low',
      { 
        paymentIntentId: paymentIntent.id,
        invoiceId, 
        clientId, 
        amount: amount.amount, 
        currency: amount.currency 
      },
      request
    );

    // Remove sensitive data from response
    const sanitizedResponse = {
      ...paymentIntent,
      // Don't expose full metadata in response
      metadata: undefined,
      // Only return client_secret and essential fields
      id: paymentIntent.id,
      client_secret: paymentIntent.clientSecret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };

    return NextResponse.json(sanitizedResponse);
  } catch (error) {
    SecurityMonitor.logSecurityEvent(
      'payment_intent_creation_failed',
      'high',
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId: context?.validatedData?.invoiceId,
        clientId: context?.validatedData?.clientId
      },
      request
    );

    console.error('Error creating payment intent:', error);

    if (error instanceof PaymentError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          retryable: error.retryable,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply payment security middleware with validation
const securedHandler = paymentSecurityMiddleware(createPaymentIntentHandler);

// Add security audit logging
const auditedHandler = withSecurityAudit()(securedHandler);

export async function POST(request: NextRequest) {
  return auditedHandler(request);
}