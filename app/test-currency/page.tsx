"use client";

import { useState } from "react";
import CurrencySelector from "@/components/CurrencySelector";
import { Currency } from "@/lib/types";

const supportedCurrencies: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", decimalPlaces: 2 },
  { code: "EUR", name: "Euro", symbol: "€", decimalPlaces: 2 },
  { code: "GBP", name: "British Pound", symbol: "£", decimalPlaces: 2 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", decimalPlaces: 0 },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", decimalPlaces: 2 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", decimalPlaces: 2 },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", decimalPlaces: 2 },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", decimalPlaces: 2 },
  { code: "INR", name: "Indian Rupee", symbol: "₹", decimalPlaces: 2 },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", decimalPlaces: 2 },
];

export default function TestCurrencyPage() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(supportedCurrencies[0]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Currency Selector Test</h1>
        
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Test Currency Dropdown Visibility</h2>
          
          <div className="space-y-4">
            <CurrencySelector
              selectedCurrency={selectedCurrency}
              onCurrencyChange={setSelectedCurrency}
              supportedCurrencies={supportedCurrencies}
              label="Select Currency"
            />
            
            <div className="p-4 bg-muted rounded-md">
              <h3 className="font-medium mb-2">Selected Currency:</h3>
              <p>Code: {selectedCurrency.code}</p>
              <p>Name: {selectedCurrency.name}</p>
              <p>Symbol: {selectedCurrency.symbol}</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">With Exchange Rate Display</h2>
          
          <CurrencySelector
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
            supportedCurrencies={supportedCurrencies}
            showExchangeRate={true}
            exchangeRate={1.2345}
            label="Currency with Exchange Rate"
          />
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Click on the dropdown to test visibility. The dropdown should have a solid white background (light mode) or dark background (dark mode) and be clearly visible.</p>
        </div>
      </div>
    </div>
  );
}