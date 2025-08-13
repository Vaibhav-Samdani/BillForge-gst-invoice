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
      <div className="flex justify-between items-center mb-4">
        <h2 className="notion-header mb-0">Items</h2>
        <div className="flex items-center space-x-4">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={sameGst}
              onChange={(e) => setSameGst(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
            />
            Apply same GST to all items
          </label>
          {sameGst && (
            <select 
              value={globalGst} 
              onChange={(e) => setGlobalGst(Number(e.target.value))}
              className="form-input w-auto"
            >
              <option value={0}>GST 0%</option>
              <option value={5}>GST 5%</option>
              <option value={12}>GST 12%</option>
              <option value={18}>GST 18%</option>
              <option value={28}>GST 28%</option>
            </select>
          )}
          <button onClick={handleAddItem} className="btn btn-primary">
            <span className="material-icons mr-2 text-sm">add</span>
            Add Item
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header text-left text-gray-600">
              <th className="table-cell font-medium rounded-l-md">Description</th>
              <th className="table-cell font-medium">HSN/SAC</th>
              <th className="table-cell font-medium">Qty</th>
              <th className="table-cell font-medium">Rate (₹)</th>
              <th className="table-cell font-medium">Per</th>
              <th className="table-cell font-medium">GST %</th>
              <th className="table-cell font-medium">Amount (₹)</th>
              <th className="table-cell font-medium rounded-r-md">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-cell text-center text-gray-500 py-8">
                  No items added yet. Click &quot;Add Item&quot; to get started.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="table-cell cursor-pointer hover:bg-gray-50" onClick={() => handleEditItem(item)}>
                    <div className="flex items-center">
                      <span className="material-icons text-sm text-gray-400 mr-2">edit</span>
                      {item.description || "Click to edit"}
                    </div>
                  </td>
                  <td className="table-cell">{item.hsnSac}</td>
                  <td className="table-cell">{item.quantity}</td>
                  <td className="table-cell">₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="table-cell">{item.per}</td>
                  <td className="table-cell">{item.gst}%</td>
                  <td className="table-cell">₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="table-cell">
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
