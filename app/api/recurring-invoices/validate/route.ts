// API route for validating recurring invoice templates
import { NextRequest, NextResponse } from 'next/server';
import { scheduledTaskService } from '../../../../lib/services/ScheduledTaskService';

export async function GET(request: NextRequest) {
  try {
    // Validate all recurring templates
    const validation = await scheduledTaskService.validateRecurringTemplates();

    return NextResponse.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating recurring templates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}