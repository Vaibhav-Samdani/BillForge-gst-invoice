// API route for generating recurring invoices
import { NextRequest, NextResponse } from 'next/server';
import { scheduledTaskService } from '../../../../lib/services/ScheduledTaskService';

export async function POST(request: NextRequest) {
  try {
    // Check if task is already running
    if (scheduledTaskService.isTaskRunning()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Recurring invoice generation task is already running' 
        },
        { status: 409 }
      );
    }

    // Execute the task
    const result = await scheduledTaskService.generateDueRecurringInvoices();

    // Return appropriate status code based on result
    const statusCode = result.success ? 200 : (result.failedCount > 0 && result.processedCount > 0 ? 207 : 500);

    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error('Error in recurring invoice generation API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        processedCount: 0,
        failedCount: 0,
        errors: [error instanceof Error ? error.message : 'Internal server error'],
        generatedInvoices: []
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get task statistics
    const stats = await scheduledTaskService.getTaskStatistics();
    const isRunning = scheduledTaskService.isTaskRunning();

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        isRunning,
      }
    });
  } catch (error) {
    console.error('Error getting task statistics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}