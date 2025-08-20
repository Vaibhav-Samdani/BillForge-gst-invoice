"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RecurringConfig } from "@/lib/types/invoice";
import { Clock, Settings, Calendar } from "lucide-react";
import RecurringInvoiceForm from "./RecurringInvoiceForm";

interface RecurringInvoiceToggleProps {
  config: RecurringConfig | null;
  onConfigChange: (config: RecurringConfig | null) => void;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export default function RecurringInvoiceToggle({
  config,
  onConfigChange,
  isEnabled,
  onToggle,
  className,
}: RecurringInvoiceToggleProps) {
  const [showSettings, setShowSettings] = useState(false);

  const handleSave = () => {
    setShowSettings(false);
  };

  const handleCancel = () => {
    setShowSettings(false);
  };

  const getFrequencyText = (config: RecurringConfig) => {
    const { frequency, interval } = config;
    const frequencyMap = {
      weekly: interval === 1 ? 'weekly' : `every ${interval} weeks`,
      monthly: interval === 1 ? 'monthly' : `every ${interval} months`,
      quarterly: interval === 1 ? 'quarterly' : `every ${interval} quarters`,
      yearly: interval === 1 ? 'yearly' : `every ${interval} years`,
    };
    
    return frequencyMap[frequency] || frequency;
  };

  if (showSettings) {
    return (
      <RecurringInvoiceForm
        config={config}
        onConfigChange={onConfigChange}
        onSave={handleSave}
        onCancel={handleCancel}
        isEnabled={isEnabled}
        onToggle={onToggle}
      />
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Recurring Invoice
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              id="recurring-toggle"
              checked={isEnabled}
              onCheckedChange={onToggle}
            />
            <Label htmlFor="recurring-toggle" className="text-sm">
              Make this invoice recurring
            </Label>
          </div>
          
          {isEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Configure
            </Button>
          )}
        </div>
        
        {isEnabled && config && (
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Schedule:</span>
              <span className="capitalize">{getFrequencyText(config)}</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <span>Next generation: </span>
              <span className="font-medium">
                {config.nextGenerationDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            
            {config.endDate && (
              <div className="text-sm text-muted-foreground">
                <span>Ends: </span>
                <span>{config.endDate.toLocaleDateString()}</span>
              </div>
            )}
            
            {config.maxOccurrences && (
              <div className="text-sm text-muted-foreground">
                <span>Max occurrences: </span>
                <span>{config.maxOccurrences}</span>
              </div>
            )}
          </div>
        )}
        
        {isEnabled && !config && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              Click "Configure" to set up the recurring schedule.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}