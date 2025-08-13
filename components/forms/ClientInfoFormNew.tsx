"use client";
import useInvoiceStore from "@/lib/store";

export default function ClientInfoForm() {
  const client = useInvoiceStore((state) => state.client);
  const setClient = useInvoiceStore((state) => state.setClient);

  return (
    <div className="notion-style">
      <h2 className="notion-header">Client Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="form-label" htmlFor="clientName">Client Name</label>
          <input
            className="form-input"
            id="clientName"
            type="text"
            value={client.name}
            onChange={(e) => setClient({ name: e.target.value })}
            placeholder="Vaibhavdani"
          />
        </div>
        <div>
          <label className="form-label" htmlFor="clientCompany">Company (Optional)</label>
          <input
            className="form-input"
            id="clientCompany"
            type="text"
            value={client.company}
            onChange={(e) => setClient({ company: e.target.value })}
            placeholder="Sanitary Sanitary"
          />
        </div>
        <div>
          <label className="form-label" htmlFor="clientEmail">Email</label>
          <input
            className="form-input"
            id="clientEmail"
            type="email"
            value={client.email}
            onChange={(e) => setClient({ email: e.target.value })}
            placeholder="client@example.com"
          />
        </div>
        <div>
          <label className="form-label" htmlFor="clientPhone">Phone</label>
          <input
            className="form-input"
            id="clientPhone"
            type="text"
            value={client.phone}
            onChange={(e) => setClient({ phone: e.target.value })}
            placeholder="9876543595"
          />
        </div>
        <div className="md:col-span-2">
          <label className="form-label" htmlFor="clientAddress">Address</label>
          <input
            className="form-input"
            id="clientAddress"
            type="text"
            value={client.address}
            onChange={(e) => setClient({ address: e.target.value })}
            placeholder="SHOP NO-D1, Mohan Market, Bigod, Bhvs, Rajasthan, 311601"
          />
        </div>
        <div className="md:col-span-2">
          <label className="form-label" htmlFor="clientGstin">GSTIN/UIN</label>
          <input
            className="form-input"
            id="clientGstin"
            type="text"
            value={client.gstin}
            onChange={(e) => setClient({ gstin: e.target.value })}
            placeholder="08CGPPB7908K1Z5"
          />
        </div>
      </div>
    </div>
  );
}
