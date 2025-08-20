"use client";
import { useState, useEffect } from "react";
import useInvoiceStore from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import CurrencySelector from "@/components/CurrencySelector";
import ExchangeRateDisplay from "@/components/ExchangeRateDisplay";
import { currencyService } from "@/lib/services/CurrencyService";
import { ExchangeRate } from "@/lib/types";

export default function BusinessInfoForm() {
  const business = useInvoiceStore((state) => state.business);
  const setBusiness = useInvoiceStore((state) => state.setBusiness);
  const invoiceNumber = useInvoiceStore((state) => state.invoiceNumber);
  const setInvoiceNumber = useInvoiceStore((state) => state.setInvoiceNumber);
  const invoiceDate = useInvoiceStore((state) => state.invoiceDate);
  const setInvoiceDate = useInvoiceStore((state) => state.setInvoiceDate);
  
  // Currency-related state
  const selectedCurrency = useInvoiceStore((state) => state.selectedCurrency);
  const setCurrency = useInvoiceStore((state) => state.setCurrency);
  const supportedCurrencies = useInvoiceStore((state) => state.supportedCurrencies);
  const exchangeRates = useInvoiceStore((state) => state.exchangeRates);
  const updateExchangeRates = useInvoiceStore((state) => state.updateExchangeRates);
  
  const [currentExchangeRate, setCurrentExchangeRate] = useState<ExchangeRate | undefined>();
  const [exchangeRateError, setExchangeRateError] = useState<string>("");
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Load exchange rates when currency changes
  useEffect(() => {
    if (selectedCurrency.code !== "USD") {
      loadExchangeRates();
    } else {
      setCurrentExchangeRate(undefined);
    }
  }, [selectedCurrency.code]);

  const loadExchangeRates = async () => {
    if (selectedCurrency.code === "USD") return;
    
    setIsLoadingRates(true);
    setExchangeRateError("");
    
    try {
      const rate = await currencyService.getExchangeRate("USD", selectedCurrency.code);
      if (rate) {
        setCurrentExchangeRate(rate);
        // Update the store with all rates for this base currency
        const allRates = await currencyService.getExchangeRates("USD");
        updateExchangeRates(allRates);
      } else {
        setExchangeRateError("Exchange rate not available for this currency");
      }
    } catch (error) {
      setExchangeRateError(
        error instanceof Error ? error.message : "Failed to load exchange rates"
      );
    } finally {
      setIsLoadingRates(false);
    }
  };

  const handleRefreshRates = async () => {
    if (selectedCurrency.code === "USD") return;
    
    try {
      const rate = await currencyService.getExchangeRate("USD", selectedCurrency.code);
      if (rate) {
        setCurrentExchangeRate(rate);
        const allRates = await currencyService.getExchangeRates("USD", true); // Force refresh
        updateExchangeRates(allRates);
        setExchangeRateError("");
      }
    } catch (error) {
      setExchangeRateError(
        error instanceof Error ? error.message : "Failed to refresh exchange rates"
      );
    }
  };

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="businessName">Company Name</Label>
          <Input
            id="businessName"
            value={business.name}
            onChange={(e) => {
              console.log(business);
              setBusiness({ name: e.target.value });
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gstin">GSTIN/UIN</Label>
          <Input
            id="gstin"
            value={business.gstin}
            onChange={(e) => setBusiness({ gstin: e.target.value })}
            maxLength={15}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="businessAddress">Address</Label>
          <Input
            id="businessAddress"
            value={business.address}
            onChange={(e) => setBusiness({ address: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={business.email}
            onChange={(e) => setBusiness({ email: e.target.value })}
            type="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={business.phone}
            onChange={(e) => setBusiness({ phone: e.target.value })}
            maxLength={10}
            type="tel"
            placeholder="9811289293"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">Invoice Number</Label>
          <Input
            id="invoiceNumber"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoiceDate">Invoice Date</Label>
          <Input
            type="date"
            id="invoiceDate"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <CurrencySelector
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setCurrency}
            supportedCurrencies={supportedCurrencies}
            showExchangeRate={true}
            exchangeRate={currentExchangeRate?.rate}
          />
        </div>

        {selectedCurrency.code !== "USD" && (
          <div className="md:col-span-2">
            <ExchangeRateDisplay
              exchangeRate={currentExchangeRate}
              onRefresh={handleRefreshRates}
              isLoading={isLoadingRates}
              error={exchangeRateError}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
