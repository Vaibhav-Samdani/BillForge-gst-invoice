"use client";
import useInvoiceStore from "@/lib/store";
import { ToWords } from "to-words";

const toWords = new ToWords({
  localeCode: "en-IN",
  converterOptions: {
    currency: true,
    ignoreDecimal: false,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
    currencyOptions: {
      name: "Rupee",
      plural: "Rupees",
      symbol: "₹",
      fractionalUnit: {
        name: "Paisa",
        plural: "Paise",
        symbol: "",
      },
    },
  },
});

export default function InvoiceSummary() {
  const totals = useInvoiceStore((state) => state.totals);
  const totalInWords = toWords.convert(totals.total).replace(/rupees/gi, "Rupees").replace(/paisa/gi, "Paise");

  return (
    <div className="notion-style">
      <h2 className="notion-header">Invoice Summary</h2>
      <div className="space-y-2 sm:space-y-3">
        <div className="flex justify-between items-center text-gray-600 text-sm sm:text-base">
          <span>Subtotal:</span>
          <span className="font-medium text-gray-800">
            ₹{totals.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
        
        {totals.igst > 0 ? (
          <div className="flex justify-between items-center text-gray-600 text-sm sm:text-base">
            <span>IGST:</span>
            <span className="font-medium text-gray-800">
              ₹{totals.igst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center text-gray-600 text-sm sm:text-base">
              <span>CGST:</span>
              <span className="font-medium text-gray-800">
                ₹{totals.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-600 text-sm sm:text-base">
              <span>SGST:</span>
              <span className="font-medium text-gray-800">
                ₹{totals.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </>
        )}
        
        <div className="flex justify-between items-center text-gray-600 text-sm sm:text-base">
          <span>Round Off:</span>
          <span className="font-medium text-gray-800">
            ₹{totals.round_off.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
        
        <hr className="my-2" />
        
        <div className="flex justify-between items-center font-bold text-base sm:text-lg text-gray-900">
          <span>Net Total:</span>
          <span>₹{totals.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      
      <div className="mt-4 sm:mt-6">
        <label className="form-label text-xs sm:text-sm" htmlFor="totalInWords">Total (in words):</label>
        <input
          className="form-input text-xs sm:text-sm"
          id="totalInWords"
          type="text"
          value={totalInWords}
          readOnly
          style={{ backgroundColor: "#f9fafb" }}
        />
      </div>
    </div>
  );
}
