"use client";

import useInvoiceStore, { useSafeInvoiceTotals } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { numberToWords } from "@/lib/utils";
import CurrencyDisplay from "@/components/CurrencyDisplay";

export default function InvoiceSummary() {
  const totals = useSafeInvoiceTotals();
  const selectedCurrency = useInvoiceStore((state) => state.selectedCurrency);



  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Subtotal:</span>
            <CurrencyDisplay 
              amount={totals.subtotal} 
              currency={selectedCurrency}
              size="sm"
            />
          </div>

          {totals.igst > 0 ? (
            <div className="flex justify-between">
              <span className="font-medium">IGST:</span>
              <CurrencyDisplay 
                amount={totals.igst} 
                currency={selectedCurrency}
                size="sm"
              />
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="font-medium">CGST:</span>
                <CurrencyDisplay 
                  amount={totals.cgst} 
                  currency={selectedCurrency}
                  size="sm"
                />
              </div>
              <div className="flex justify-between">
                <span className="font-medium">SGST:</span>
                <CurrencyDisplay 
                  amount={totals.sgst} 
                  currency={selectedCurrency}
                  size="sm"
                />
              </div>
            </>
          )}

          <div className="flex justify-between">
            <span className="font-medium">Round Off:</span>
            <CurrencyDisplay 
              amount={totals.round_off} 
              currency={selectedCurrency}
              size="sm"
            />
          </div>

          <div className="flex justify-between pt-2 border-t">
            <span className="font-bold">Net Total:</span>
            <CurrencyDisplay 
              amount={totals.total} 
              currency={selectedCurrency}
              size="md"
              className="font-bold"
            />
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-bold">Total (in words):</span>
            <span className="font-bold">{numberToWords(totals.total, selectedCurrency.code)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
