"use client";

import React, { useState } from "react";
import { ExchangeRate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";

interface ExchangeRateDisplayProps {
  exchangeRate?: ExchangeRate;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export default function ExchangeRateDisplay({
  exchangeRate,
  onRefresh,
  isLoading = false,
  error,
  className,
}: ExchangeRateDisplayProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const isRateStale = exchangeRate && 
    (Date.now() - exchangeRate.timestamp.getTime()) > 60 * 60 * 1000; // 1 hour

  if (!exchangeRate && !error) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-md border bg-muted/30 ${className || ""}`}>
      <div className="flex-1">
        {error ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        ) : exchangeRate ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                1 {exchangeRate.baseCurrency} = {exchangeRate.rate.toFixed(4)} {exchangeRate.targetCurrency}
              </span>
              {isRateStale && (
                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                  Rate may be outdated
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Last updated: {exchangeRate.timestamp.toLocaleString()}
              {exchangeRate.source && ` • Source: ${exchangeRate.source}`}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {isLoading ? "Loading exchange rate..." : "No exchange rate available"}
          </div>
        )}
      </div>
      
      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="ml-3"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh exchange rate</span>
        </Button>
      )}
    </div>
  );
}