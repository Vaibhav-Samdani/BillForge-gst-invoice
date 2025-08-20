"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RecurringConfig } from "@/lib/types/invoice";
import { Calendar, Clock, AlertCircle } from "lucide-react";

interface RecurringInvoiceFormProps {
  config: RecurringConfig | null;
  onConfigChange: (config: RecurringConfig | null) => void;
  onSave: () => void;
  onCancel: () => void;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function RecurringInvoiceForm({
  config,
  onConfigChange,
  onSave,
  onCancel,
  isEnabled,
  onToggle,
}: RecurringInvoiceFormProps) {
  const [formData, setFormData] = useState<RecurringConfig>(() => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    return config || {
      frequency: 'monthly',
      interval: 1,
      startDate: today,
      endDate: undefined,
      maxOccurrences: undefined,
      nextGenerationDate: nextMonth,
      isActive: true,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  // Calculate next generation date based on frequency and interval
  const calculateNextDate = (startDate: Date, frequency: string, interval: number): Date => {
    const nextDate = new Date(startDate);
    
    switch (frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (7 * interval));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + (3 * interval));
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        break;
    }
    
    return nextDate;
  };

  const handleFieldChange = (field: keyof RecurringConfig, value: any) => {
    const newFormData = { ...formData, [field]: value };
    
    // Recalculate next generation date when start date, frequency, or interval changes
    if (field === 'startDate' || field === 'frequency' || field === 'interval') {
      newFormData.nextGenerationDate = calculateNextDate(
        field === 'startDate' ? value : newFormData.startDate,
        field === 'frequency' ? value : newFormData.frequency,
        field === 'interval' ? value : newFormData.interval
      );
    }
    
    setFormData(newFormData);
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (formData.interval < 1) {
      newErrors.interval = 'Interval must be at least 1';
    }
    
    if (formData.startDate < new Date()) {
      newErrors.startDate = 'Start date cannot be in the past';
    }
    
    if (formData.endDate && formData.endDate <= formData.startDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    if (formData.maxOccurrences && formData.maxOccurrences < 1) {
      newErrors.maxOccurrences = 'Maximum occurrences must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!isEnabled) {
      onConfigChange(null);
      onSave();
      return;
    }
    
    if (validateForm()) {
      onConfigChange(formData);
      onSave();
    }
  };

  const handleToggle = (enabled: boolean) => {
    onToggle(enabled);
    if (!enabled) {
      onConfigChange(null);
    } else {
      onConfigChange(formData);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString: string): Date => {
    return new Date(dateString + 'T00:00:00');
  };

  const getFrequencyLabel = (frequency: string, interval: number): string => {
    const labels = {
      weekly: interval === 1 ? 'week' : 'weeks',
      monthly: interval === 1 ? 'month' : 'months',
      quarterly: interval === 1 ? 'quarter' : 'quarters',
      yearly: interval === 1 ? 'year' : 'years',
    };
    
    return `Every ${interval} ${labels[frequency as keyof typeof labels]}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recurring Invoice Settings
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="recurring-toggle">Enable Recurring</Label>
            <Switch
              id="recurring-toggle"
              checked={isEnabled}
              onCheckedChange={handleToggle}
            />
          </div>
        </div>
      </CardHeader>
      
      {isEnabled && (
        <CardContent className="space-y-6">
          {/* Frequency and Interval */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => handleFieldChange('frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="interval">Interval</Label>
              <Input
                id="interval"
                type="number"
                min="1"
                value={formData.interval}
                onChange={(e) => handleFieldChange('interval', parseInt(e.target.value) || 1)}
                className={errors.interval ? 'border-destructive' : ''}
              />
              {errors.interval && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.interval}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {getFrequencyLabel(formData.frequency, formData.interval)}
              </p>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={formatDate(formData.startDate)}
              onChange={(e) => handleFieldChange('startDate', parseDate(e.target.value))}
              className={errors.startDate ? 'border-destructive' : ''}
            />
            {errors.startDate && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.startDate}
              </p>
            )}
          </div>

          {/* End Conditions */}
          <div className="space-y-4">
            <Label className="text-base font-medium">End Conditions (Optional)</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate ? formatDate(formData.endDate) : ''}
                  onChange={(e) => 
                    handleFieldChange('endDate', e.target.value ? parseDate(e.target.value) : undefined)
                  }
                  className={errors.endDate ? 'border-destructive' : ''}
                />
                {errors.endDate && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.endDate}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxOccurrences">Maximum Occurrences</Label>
                <Input
                  id="maxOccurrences"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={formData.maxOccurrences || ''}
                  onChange={(e) => 
                    handleFieldChange('maxOccurrences', e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  className={errors.maxOccurrences ? 'border-destructive' : ''}
                />
                {errors.maxOccurrences && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.maxOccurrences}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Next Generation Preview */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <Label className="text-sm font-medium">Next Invoice Generation</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {formData.nextGenerationDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Recurring Settings
            </Button>
          </div>
        </CardContent>
      )}
      
      {!isEnabled && (
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Enable recurring invoices to automatically generate invoices on a schedule.
          </p>
        </CardContent>
      )}
    </Card>
  );
}