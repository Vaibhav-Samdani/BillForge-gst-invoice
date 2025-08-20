'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings
} from 'lucide-react';

interface TaskStats {
  dueInvoicesCount: number;
  activeTemplatesCount: number;
  isRunning: boolean;
  nextExecution?: string;
  scheduleDescription?: string;
}

interface TaskResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: string[];
  generatedInvoices: any[];
}

interface ValidationResult {
  validTemplates: number;
  invalidTemplates: number;
  issues: Array<{
    templateId: string;
    invoiceNumber: string;
    issues: string[];
  }>;
}

export default function RecurringInvoiceScheduler() {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [lastResult, setLastResult] = useState<TaskResult | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current status
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/recurring-invoices/generate');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch task statistics');
    }
  };

  // Fetch validation results
  const fetchValidation = async () => {
    try {
      const response = await fetch('/api/recurring-invoices/validate');
      const data = await response.json();
      
      if (data.success) {
        setValidation(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch validation results:', err);
    }
  };

  // Trigger manual generation
  const triggerGeneration = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/recurring-invoices/generate', {
        method: 'POST',
      });
      const result = await response.json();
      
      setLastResult(result);
      
      if (!result.success && result.errors?.length > 0) {
        setError(result.errors.join(', '));
      }
      
      // Refresh stats after generation
      await fetchStats();
    } catch (err) {
      setError('Failed to trigger invoice generation');
    } finally {
      setLoading(false);
    }
  };

  // Start/stop cron job
  const toggleCronJob = async (action: 'start' | 'stop') => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/recurring-invoices/cron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchStats();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(`Failed to ${action} cron job`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchValidation();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recurring Invoice Scheduler</h2>
          <p className="text-muted-foreground">
            Manage automated recurring invoice generation
          </p>
        </div>
        <Button
          onClick={() => fetchStats()}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.dueInvoicesCount ?? '—'}
              </div>
              <div className="text-sm text-muted-foreground">Due Invoices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats?.activeTemplatesCount ?? '—'}
              </div>
              <div className="text-sm text-muted-foreground">Active Templates</div>
            </div>
            <div className="text-center">
              <Badge variant={stats?.isRunning ? 'default' : 'secondary'}>
                {stats?.isRunning ? 'Running' : 'Idle'}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Task Status</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">
                {stats?.nextExecution ? new Date(stats.nextExecution).toLocaleString() : '—'}
              </div>
              <div className="text-sm text-muted-foreground">Next Execution</div>
            </div>
          </div>
          
          {stats?.scheduleDescription && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">Schedule: {stats.scheduleDescription}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manually trigger generation or manage the scheduled task
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={triggerGeneration}
              disabled={loading || stats?.isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Generate Now
            </Button>
            
            <Button
              onClick={() => toggleCronJob('start')}
              disabled={loading || stats?.isRunning}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Scheduler
            </Button>
            
            <Button
              onClick={() => toggleCronJob('stop')}
              disabled={loading || !stats?.isRunning}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop Scheduler
            </Button>
            
            <Button
              onClick={fetchValidation}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Validate Templates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Execution Result */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Last Execution Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {lastResult.processedCount}
                </div>
                <div className="text-sm text-muted-foreground">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {lastResult.failedCount}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {lastResult.generatedInvoices.length}
                </div>
                <div className="text-sm text-muted-foreground">Generated</div>
              </div>
            </div>

            {lastResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Errors:</h4>
                {lastResult.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {error}
                  </div>
                ))}
              </div>
            )}

            {lastResult.generatedInvoices.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-green-600 mb-2">Generated Invoices:</h4>
                <div className="space-y-1">
                  {lastResult.generatedInvoices.map((invoice, index) => (
                    <div key={index} className="text-sm bg-green-50 p-2 rounded">
                      {invoice.invoiceNumber} - {invoice.currency?.symbol}{invoice.totals?.total}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Template Validation */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validation.invalidTemplates > 0 ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              Template Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {validation.validTemplates}
                </div>
                <div className="text-sm text-muted-foreground">Valid Templates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {validation.invalidTemplates}
                </div>
                <div className="text-sm text-muted-foreground">Invalid Templates</div>
              </div>
            </div>

            {validation.issues.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-yellow-600">Issues Found:</h4>
                {validation.issues.map((issue, index) => (
                  <div key={index} className="bg-yellow-50 p-3 rounded-lg">
                    <div className="font-medium text-yellow-800">
                      {issue.invoiceNumber}
                    </div>
                    <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                      {issue.issues.map((problem, problemIndex) => (
                        <li key={problemIndex}>{problem}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}