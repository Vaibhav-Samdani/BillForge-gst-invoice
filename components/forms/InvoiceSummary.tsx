"use client";

import { useSafeInvoiceTotals } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useMemo } from "react";
import { formatCurrency, numberToWords } from "@/lib/utils";

export default function InvoiceSummary() {
  const totals = useSafeInvoiceTotals();

  // Memoize formatted values
  const formattedValues = useMemo(
    () => ({
      subtotal: formatCurrency(totals.subtotal),
      cgst: formatCurrency(totals.cgst),
      sgst: formatCurrency(totals.sgst),
      igst: formatCurrency(totals.igst),
      total: formatCurrency(totals.total),
    }),
    [totals]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Subtotal:</span>
            <span>{formattedValues.subtotal}</span>
          </div>

          {totals.igst > 0 ? (
            <div className="flex justify-between">
              <span className="font-medium">IGST:</span>
              <span>{formattedValues.igst}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="font-medium">CGST:</span>
                <span>{formattedValues.cgst}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">SGST:</span>
                <span>{formattedValues.sgst}</span>
              </div>
            </>
          )}

          <div className="flex justify-between">
            <span className="font-medium">Round Off:</span>
            <span>{formatCurrency(totals.round_off)}</span>
          </div>

          <div className="flex justify-between pt-2 border-t">
            <span className="font-bold">Net Total:</span>
            <span className="font-bold">{formattedValues.total}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-bold">Total (in words):</span>
            <span className="font-bold">INR {numberToWords(totals.total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
