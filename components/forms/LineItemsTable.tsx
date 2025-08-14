"use client";
import useInvoiceStore from "@/lib/store";
import { useState } from "react";
import ItemModal from "./ItemModal";
import type { LineItem } from "@/lib/store";

export default function LineItemsTable() {
  const items = useInvoiceStore((state) => state.items);
  const removeItem = useInvoiceStore((state) => state.removeItem);
  const sameGst = useInvoiceStore((state) => state.sameGst);
  const setSameGst = useInvoiceStore((state) => state.setSameGst);
  const globalGst = useInvoiceStore((state) => state.globalGst);
  const setGlobalGst = useInvoiceStore((state) => state.setGlobalGst);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);

  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: LineItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="notion-style">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h2 className="notion-header mb-0">Items</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <label className="flex items-center text-xs sm:text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={sameGst}
              onChange={(e) => setSameGst(e.target.checked)}
              className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
            />
            Apply same GST to all items
          </label>
          {sameGst && (
            <select 
              value={globalGst} 
              onChange={(e) => setGlobalGst(Number(e.target.value))}
              className="form-input w-auto text-xs sm:text-sm"
            >
              <option value={0}>GST 0%</option>
              <option value={5}>GST 5%</option>
              <option value={12}>GST 12%</option>
              <option value={18}>GST 18%</option>
              <option value={28}>GST 28%</option>
            </select>
          )}
          <button onClick={handleAddItem} className="btn btn-primary btn-sm sm:btn-md w-full sm:w-auto">
            <span className="material-icons mr-1 sm:mr-2 text-xs sm:text-sm">add</span>
            <span className="hidden sm:inline">Add Item</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
      
      {/* Mobile View */}
      <div className="block sm:hidden">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No items added yet. Click &quot;Add&quot; to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-gray-50 p-3 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm" onClick={() => handleEditItem(item)}>
                      {item.description || "Click to edit"}
                    </div>
                    <div className="text-xs text-gray-500">HSN/SAC: {item.hsnSac}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Edit item"
                    >
                      <span className="material-icons text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete item"
                    >
                      <span className="material-icons text-sm">delete</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Qty: {item.quantity}</div>
                  <div>Rate: ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div>Per: {item.per}</div>
                  <div>GST: {item.gst}%</div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="font-medium text-sm">Amount: ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header text-left text-gray-600">
              <th className="table-cell font-medium rounded-l-md text-xs sm:text-sm">Description</th>
              <th className="table-cell font-medium text-xs sm:text-sm">HSN/SAC</th>
              <th className="table-cell font-medium text-xs sm:text-sm">Qty</th>
              <th className="table-cell font-medium text-xs sm:text-sm">Rate (₹)</th>
              <th className="table-cell font-medium text-xs sm:text-sm">Per</th>
              <th className="table-cell font-medium text-xs sm:text-sm">GST %</th>
              <th className="table-cell font-medium text-xs sm:text-sm">Amount (₹)</th>
              <th className="table-cell font-medium rounded-r-md text-xs sm:text-sm">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-cell text-center text-gray-500 py-8 text-xs sm:text-sm">
                  No items added yet. Click &quot;Add Item&quot; to get started.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="table-cell cursor-pointer hover:bg-gray-50 text-xs sm:text-sm" onClick={() => handleEditItem(item)}>
                    <div className="flex items-center">
                      <span className="material-icons text-xs sm:text-sm text-gray-400 mr-2">edit</span>
                      {item.description || "Click to edit"}
                    </div>
                  </td>
                  <td className="table-cell text-xs sm:text-sm">{item.hsnSac}</td>
                  <td className="table-cell text-xs sm:text-sm">{item.quantity}</td>
                  <td className="table-cell text-xs sm:text-sm">₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="table-cell text-xs sm:text-sm">{item.per}</td>
                  <td className="table-cell text-xs sm:text-sm">{item.gst}%</td>
                  <td className="table-cell text-xs sm:text-sm">₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit item"
                      >
                        <span className="material-icons text-xs sm:text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete item"
                      >
                        <span className="material-icons text-xs sm:text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ItemModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        item={editingItem}
        isEdit={!!editingItem}
      />
    </div>
  );
}
