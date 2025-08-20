"use client";

import React from "react";
import { Currency } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CurrencySelectorProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  supportedCurrencies: Currency[];
  showExchangeRate?: boolean;
  exchangeRate?: number;
  className?: string;
  label?: string;
}

export default function CurrencySelector({
  selectedCurrency,
  onCurrencyChange,
  supportedCurrencies,
  showExchangeRate = false,
  exchangeRate,
  className,
  label = "Currency",
}: CurrencySelectorProps) {
  const handleCurrencyChange = (currencyCode: string) => {
    const currency = supportedCurrencies.find(c => c.code === currencyCode);
    if (currency) {
      onCurrencyChange(currency);
    }
  };

  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label htmlFor="currency-select">{label}</Label>
      <Select
        value={selectedCurrency.code}
        onValueChange={handleCurrencyChange}
      >
        <SelectTrigger id="currency-select">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="font-medium">{selectedCurrency.symbol}</span>
              <span>{selectedCurrency.code}</span>
              <span className="text-muted-foreground">
                - {selectedCurrency.name}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {supportedCurrencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{currency.symbol}</span>
                <span>{currency.code}</span>
                <span className="text-muted-foreground">
                  - {currency.name}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showExchangeRate && exchangeRate && selectedCurrency.code !== "USD" && (
        <div className="text-sm text-muted-foreground">
          Exchange rate: 1 USD = {exchangeRate.toFixed(4)} {selectedCurrency.code}
        </div>
      )}
    </div>
  );
}