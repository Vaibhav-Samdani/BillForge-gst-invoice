// API route for managing recurring invoice cron jobs
import { NextRequest, NextResponse } from 'next/server';
import { 
  taskRunner, 
  triggerRecurringInvoiceGeneration,
  getCronJobStatus,
  validateCronExpression,
  formatCronSchedule,
  CronJobConfig,
  DEFAULT_CRON_CONFIG
} from '../../../../lib/utils/cron';

// GET - Get cron job status
export async function GET(request: NextRequest) {
  try {
    const status = taskRunner.getStatus();
    const cronStatus = getCronJobStatus(status.config, status.lastRunTime);
    
    return NextResponse.json({
      success: true,
      data: {
        ...status,
        ...cronStatus,
        scheduleDescription: formatCronSchedule(status.config.schedule),
      }
    });
  } catch (error) {
    console.error('Error getting cron job status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// POST - Start/stop cron job or trigger manual execution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case 'start':
        taskRunner.start();
        return NextResponse.json({
          success: true,
          message: 'Cron job started successfully',
          data: taskRunner.getStatus()
        });

      case 'stop':
        taskRunner.stop();
        return NextResponse.json({
          success: true,
          message: 'Cron job stopped successfully',
          data: taskRunner.getStatus()
        });

      case 'trigger':
        const result = await triggerRecurringInvoiceGeneration();
        return NextResponse.json(result, { 
          status: result.success ? 200 : 500 
        });

      case 'update_config':
        if (!config) {
          return NextResponse.json(
            { success: false, error: 'Config is required for update_config action' },
            { status: 400 }
          );
        }

        // Validate the new config
        const newConfig: CronJobConfig = {
          enabled: config.enabled ?? DEFAULT_CRON_CONFIG.enabled,
          schedule: config.schedule ?? DEFAULT_CRON_CONFIG.schedule,
          timezone: config.timezone ?? DEFAULT_CRON_CONFIG.timezone,
        };

        if (!validateCronExpression(newConfig.schedule)) {
          return NextResponse.json(
            { success: false, error: 'Invalid cron expression' },
            { status: 400 }
          );
        }

        taskRunner.updateConfig(newConfig);
        return NextResponse.json({
          success: true,
          message: 'Cron job configuration updated successfully',
          data: taskRunner.getStatus()
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: start, stop, trigger, or update_config' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in cron job API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}