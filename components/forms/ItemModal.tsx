"use client";
import React, { useState, useEffect } from "react";
import useInvoiceStore, { LineItem } from "@/lib/store";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: LineItem | null;
  isEdit?: boolean;
}

export default function ItemModal({ isOpen, onClose, item, isEdit = false }: ItemModalProps) {
  const addItemWithData = useInvoiceStore((state) => state.addItemWithData);
  const updateItem = useInvoiceStore((state) => state.updateItem);
  const sameGst = useInvoiceStore((state) => state.sameGst);
  const globalGst = useInvoiceStore((state) => state.globalGst);

  const [formData, setFormData] = useState({
    description: "",
    hsnSac: "",
    quantity: 1,
    rate: 0,
    per: "NOS",
    gst: 18,
  });

  useEffect(() => {
    if (isEdit && item) {
      setFormData({
        description: item.description,
        hsnSac: item.hsnSac,
        quantity: item.quantity,
        rate: item.rate,
        per: item.per,
        gst: item.gst,
      });
    } else {
      setFormData({
        description: "",
        hsnSac: "",
        quantity: 1,
        rate: 0,
        per: "NOS",
        gst: sameGst ? globalGst : 18,
      });
    }
  }, [isEdit, item, isOpen, sameGst, globalGst]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = formData.quantity * formData.rate;
    const gstToUse = sameGst ? globalGst : formData.gst;
    
    if (isEdit && item) {
      updateItem(item.id, {
        ...formData,
        gst: gstToUse,
        amount,
      });
    } else {
      // For new items, use addItemWithData function
      const newItem = {
        ...formData,
        gst: gstToUse,
        amount,
      };
      addItemWithData(newItem);
    }
    
    onClose();
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Item" : "Add New Item"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label" htmlFor="description">
              Product Description *
            </label>
            <input
              type="text"
              id="description"
              className="form-input"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="e.g., PVC PIPE"
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="hsnSac">
              HSN/SAC Code
            </label>
            <input
              type="text"
              id="hsnSac"
              className="form-input"
              value={formData.hsnSac}
              onChange={(e) => handleInputChange("hsnSac", e.target.value)}
              placeholder="e.g., 3917"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="quantity">
                Quantity *
              </label>
              <input
                type="number"
                id="quantity"
                className="form-input"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", Number(e.target.value))}
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="form-label" htmlFor="per">
                Unit
              </label>
              <select
                id="per"
                className="form-input"
                value={formData.per}
                onChange={(e) => handleInputChange("per", e.target.value)}
              >
                <option value="NOS">NOS</option>
                <option value="KG">KG</option>
                <option value="LTR">LTR</option>
                <option value="MTR">MTR</option>
                <option value="SQM">SQM</option>
                <option value="SQFT">SQFT</option>
                <option value="BOX">BOX</option>
                <option value="SET">SET</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="rate">
                Rate (₹) *
              </label>
              <input
                type="number"
                id="rate"
                className="form-input"
                value={formData.rate}
                onChange={(e) => handleInputChange("rate", Number(e.target.value))}
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="form-label" htmlFor="gst">
                GST (%)
              </label>
              {sameGst ? (
                <input
                  type="text"
                  className="form-input bg-gray-100"
                  value={`${globalGst}%`}
                  disabled
                />
              ) : (
                <select
                  id="gst"
                  className="form-input"
                  value={formData.gst}
                  onChange={(e) => handleInputChange("gst", Number(e.target.value))}
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between text-sm">
              <span>Amount:</span>
              <span className="font-medium">
                ₹{(formData.quantity * formData.rate).toLocaleString('en-IN', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!formData.description || formData.rate <= 0}
            >
              {isEdit ? "Update Item" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
