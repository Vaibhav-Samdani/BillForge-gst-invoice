"use client";

import React from "react";
import { Currency, CurrencyAmount } from "@/lib/types";
import { formatCurrencyAmount } from "@/lib/utils/currency";

interface CurrencyDisplayProps {
  amount: number | CurrencyAmount;
  currency?: Currency;
  showOriginalAmount?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function CurrencyDisplay({
  amount,
  currency,
  showOriginalAmount = false,
  className,
  size = "md",
}: CurrencyDisplayProps) {
  // Handle both number and CurrencyAmount types
  const currencyAmount: CurrencyAmount = typeof amount === "number" 
    ? { amount, currency: currency?.code || "USD" }
    : amount;

  const displayCurrency = currency || { 
    code: currencyAmount.currency, 
    symbol: getCurrencySymbol(currencyAmount.currency),
    name: currencyAmount.currency,
    decimalPlaces: 2 
  };

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-semibold",
  };

  return (
    <div className={`${sizeClasses[size]} ${className || ""}`}>
      <span className="font-medium">
        {formatCurrencyAmount(currencyAmount.amount, displayCurrency)}
      </span>
      
      {showOriginalAmount && 
       currencyAmount.baseAmount && 
       currencyAmount.exchangeRate && 
       displayCurrency.code !== "USD" && (
        <div className="text-sm text-muted-foreground mt-1">
          Original: {formatCurrencyAmount(currencyAmount.baseAmount, {
            code: "USD",
            symbol: "$",
            name: "US Dollar",
            decimalPlaces: 2
          })}
          <span className="ml-2">
            (Rate: {currencyAmount.exchangeRate.toFixed(4)})
          </span>
        </div>
      )}
    </div>
  );
}

// Helper function to get currency symbol
function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
    CHF: "CHF",
    CNY: "¥",
    INR: "₹",
  };
  
  return symbols[currencyCode] || currencyCode;
}