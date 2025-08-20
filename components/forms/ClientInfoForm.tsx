"use client";

import useInvoiceStore from "@/lib/store";

export default function ClientInfoForm() {
  const client = useInvoiceStore((state) => state.client);
  const setClient = useInvoiceStore((state) => state.setClient);

  return (
    <div className="notion-style">
      <h2 className="notion-header">Client Information</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="form-label" htmlFor="clientName">Name:</label>
          <input
            className="form-input"
            id="clientName"
            type="text"
            value={client.name}
            onChange={(e) => setClient({ ...client, name: e.target.value })}
            placeholder="Enter client name"
            required
          />
        </div>

        <div>
          <label className="form-label" htmlFor="clientCompany">Company:</label>
          <input
            className="form-input"
            id="clientCompany"
            type="text"
            value={client.company}
            onChange={(e) => setClient({ ...client, company: e.target.value })}
            placeholder="Enter company name"
          />
        </div>

        <div>
          <label className="form-label" htmlFor="clientEmail">Email:</label>
          <input
            className="form-input"
            id="clientEmail"
            type="email"
            value={client.email}
            onChange={(e) => setClient({ ...client, email: e.target.value })}
            placeholder="Enter email address"
          />
        </div>

        <div>
          <label className="form-label" htmlFor="clientPhone">Phone:</label>
          <input
            className="form-input"
            id="clientPhone"
            type="tel"
            value={client.phone}
            onChange={(e) => setClient({ ...client, phone: e.target.value })}
            placeholder="Enter phone number"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="form-label" htmlFor="clientAddress">Address:</label>
          <textarea
            className="form-input"
            id="clientAddress"
            rows={3}
            value={client.address}
            onChange={(e) => setClient({ ...client, address: e.target.value })}
            placeholder="Enter client address"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="form-label" htmlFor="clientGstin">GSTIN:</label>
          <input
            className="form-input"
            id="clientGstin"
            type="text"
            value={client.gstin}
            onChange={(e) => setClient({ ...client, gstin: e.target.value })}
            placeholder="Enter GSTIN (if applicable)"
          />
        </div>
      </div>
    </div>
  );
}