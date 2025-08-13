"use client";
import useInvoiceStore from "@/lib/store";

export default function BusinessInfoForm() {
  const business = useInvoiceStore((state) => state.business);
  const setBusiness = useInvoiceStore((state) => state.setBusiness);
  const invoiceNumber = useInvoiceStore((state) => state.invoiceNumber);
  const setInvoiceNumber = useInvoiceStore((state) => state.setInvoiceNumber);
  const invoiceDate = useInvoiceStore((state) => state.invoiceDate);
  const setInvoiceDate = useInvoiceStore((state) => state.setInvoiceDate);

  return (
    <div className="notion-style">
      <h2 className="notion-header">Business Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="form-label" htmlFor="companyName">Company Name</label>
          <input
            className="form-input"
            id="companyName"
            type="text"
            value={business.name}
            onChange={(e) => setBusiness({ name: e.target.value })}
            placeholder="SHREE GANPATI SANITARY"
          />
        </div>
        <div>
          <label className="form-label" htmlFor="gstin">GSTIN/UIN</label>
          <input
            className="form-input"
            id="gstin"
            type="text"
            value={business.gstin}
            onChange={(e) => setBusiness({ gstin: e.target.value })}
            maxLength={15}
            placeholder="08CGPPB7908K1Z5"
          />
        </div>
        <div className="md:col-span-2">
          <label className="form-label" htmlFor="address">Address</label>
          <input
            className="form-input"
            id="address"
            type="text"
            value={business.address}
            onChange={(e) => setBusiness({ address: e.target.value })}
            placeholder="Nayi Aabadi Nagri, Raipur Road, Nimbi, Teh. Raipur, Bhilwara, Rajasthan, 311803"
          />
        </div>
        <div>
          <label className="form-label" htmlFor="email">Email</label>
          <input
            className="form-input"
            id="email"
            type="email"
            value={business.email}
            onChange={(e) => setBusiness({ email: e.target.value })}
            placeholder="sanitary@gmail.com"
          />
        </div>
        <div>
          <label className="form-label" htmlFor="phone">Phone</label>
          <input
            className="form-input"
            id="phone"
            type="text"
            value={business.phone}
            onChange={(e) => setBusiness({ phone: e.target.value })}
            placeholder="98********"
          />
        </div>
        <div>
          <label className="form-label" htmlFor="invoiceNumber">Invoice Number</label>
          <input
            className="form-input"
            id="invoiceNumber"
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="183"
          />
        </div>
        <div>
          <label className="form-label" htmlFor="invoiceDate">Invoice Date</label>
          <div className="relative">
            <input
              className="form-input"
              id="invoiceDate"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
            <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">calendar_today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
