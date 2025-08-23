import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/NotificationService";
import { RecurringInvoiceService } from "@/lib/services/RecurringInvoiceService";

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to ensure this is called by the scheduler
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { task } = await request.json();
    
    switch (task) {
      case 'overdue-reminders':
        await NotificationService.scheduleOverdueReminders();
        break;
        
      case 'recurring-invoices':
        await RecurringInvoiceService.generateScheduledInvoices();
        break;
        
      case 'cleanup-notifications':
        await NotificationService.cleanupOldNotifications();
        break;
        
      default:
        return NextResponse.json(
          { error: "Invalid task specified" },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      task,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error executing notification cron job:', error);
    return NextResponse.json(
      { error: "Failed to execute notification task" },
      { status: 500 }
    );
  }
}
