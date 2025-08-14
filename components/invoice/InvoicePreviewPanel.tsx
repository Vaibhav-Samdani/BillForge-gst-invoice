"use client";
import useInvoiceStore from "@/lib/store";

export default function InvoicePreviewPanel() {
  const business = useInvoiceStore((state) => state.business);
  const client = useInvoiceStore((state) => state.client);
  const items = useInvoiceStore((state) => state.items);
  const invoiceNumber = useInvoiceStore((state) => state.invoiceNumber);
  const invoiceDate = useInvoiceStore((state) => state.invoiceDate);
  const totals = useInvoiceStore((state) => state.totals);

  return (
    <div className="sticky top-10 h-screen">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button className="btn btn-primary w-full">
            <span className="material-icons mr-2 text-sm">download</span>
            Download now!
          </button>
        </div>
        <div className="p-4 bg-gray-100 flex-grow overflow-y-auto">
          <div className="bg-gray-700 p-4 rounded-t-lg flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <button className="text-white">
                <span className="material-icons">chevron_left</span>
              </button>
              <span className="text-sm">1 / 1</span>
              <button className="text-white">
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-white">
                <span className="material-icons">remove</span>
              </button>
              <button className="text-white">
                <span className="material-icons">add</span>
              </button>
              <div className="w-px h-5 bg-gray-500"></div>
              <button className="text-white">
                <span className="material-icons">download</span>
              </button>
              <button className="text-white">
                <span className="material-icons">print</span>
              </button>
              <button className="text-white">
                <span className="material-icons">more_vert</span>
              </button>
            </div>
          </div>
          <div className="bg-white p-6 shadow-lg">
            {/* Invoice Preview Content */}
            <div className="mb-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{business.name || "Your Company"}</h1>
                  <p className="text-sm text-gray-600 mt-1">{business.address}</p>
                  <p className="text-sm text-gray-600">GSTIN: {business.gstin}</p>
                  <p className="text-sm text-gray-600">Email: {business.email}</p>
                  <p className="text-sm text-gray-600">Phone: {business.phone}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-gray-800">INVOICE</h2>
                  <p className="text-sm text-gray-600">Invoice #: {invoiceNumber || "---"}</p>
                  <p className="text-sm text-gray-600">Date: {invoiceDate || "---"}</p>
                </div>
              </div>

              <div className="border-t border-b border-gray-200 py-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Bill To:</h3>
                <p className="text-sm font-medium">{client.name || "Client Name"}</p>
                <p className="text-sm text-gray-600">{client.company}</p>
                <p className="text-sm text-gray-600">{client.address}</p>
                <p className="text-sm text-gray-600">GSTIN: {client.gstin}</p>
                <p className="text-sm text-gray-600">Phone: {client.phone}</p>
              </div>

              <div className="mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2">Description</th>
                      <th className="text-center py-2">HSN</th>
                      <th className="text-center py-2">Qty</th>
                      <th className="text-right py-2">Rate</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-2">{item.description || `Item ${index + 1}`}</td>
                        <td className="text-center py-2">{item.hsnSac}</td>
                        <td className="text-center py-2">{item.quantity} {item.per}</td>
                        <td className="text-right py-2">₹{item.rate.toFixed(2)}</td>
                        <td className="text-right py-2">₹{item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-1">
                    <span className="text-sm">Subtotal:</span>
                    <span className="text-sm">₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-sm">CGST:</span>
                    <span className="text-sm">₹{totals.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-sm">SGST:</span>
                    <span className="text-sm">₹{totals.sgst.toFixed(2)}</span>
                  </div>
                  {totals.igst > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-sm">IGST:</span>
                      <span className="text-sm">₹{totals.igst.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-sm">Round Off:</span>
                    <span className="text-sm">₹{totals.round_off.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-200 font-bold">
                    <span>Total:</span>
                    <span>₹{totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
