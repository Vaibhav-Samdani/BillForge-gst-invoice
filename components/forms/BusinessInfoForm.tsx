"use client";
import useInvoiceStore from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function BusinessInfoForm() {
  const business = useInvoiceStore((state) => state.business);
  const setBusiness = useInvoiceStore((state) => state.setBusiness);
  const invoiceNumber = useInvoiceStore((state) => state.invoiceNumber);
  const setInvoiceNumber = useInvoiceStore((state) => state.setInvoiceNumber);
  const invoiceDate = useInvoiceStore((state) => state.invoiceDate);
  const setInvoiceDate = useInvoiceStore((state) => state.setInvoiceDate);

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="businessName">Company Name</Label>
          <Input
            id="businessName"
            value={business.name}
            onChange={(e) => {
              console.log(business);
              setBusiness({ name: e.target.value });
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gstin">GSTIN/UIN</Label>
          <Input
            id="gstin"
            value={business.gstin}
            onChange={(e) => setBusiness({ gstin: e.target.value })}
            maxLength={15}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="businessAddress">Address</Label>
          <Input
            id="businessAddress"
            value={business.address}
            onChange={(e) => setBusiness({ address: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={business.email}
            onChange={(e) => setBusiness({ email: e.target.value })}
            type="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={business.phone}
            onChange={(e) => setBusiness({ phone: e.target.value })}
            maxLength={10}
            type="tel"
            placeholder="9811289293"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">Invoice Number</Label>
          <Input
            id="invoiceNumber"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoiceDate">Invoice Date</Label>
          <Input
            type="date"
            id="invoiceDate"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
