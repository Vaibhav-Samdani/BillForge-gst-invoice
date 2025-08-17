"use client"
import  useInvoiceStore  from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ClientInfoForm() {
  const client = useInvoiceStore((state) => state.client);
  const setClient = useInvoiceStore((state) => state.setClient);

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Client Information</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="clientName">Client Name</Label>
          <Input
            id="clientName"
            value={client.name}
            onChange={(e) => setClient({ name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientCompany">Company (Optional)</Label>
          <Input
            id="clientCompany"
            value={client.company}
            onChange={(e) => setClient({ company: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientEmail">Email</Label>
          <Input
            id="clientEmail"
            value={client.email}
            onChange={(e) => setClient({ email: e.target.value })}
            type="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientPhone">Phone</Label>
          <Input
            id="clientPhone"
            value={client.phone}
            onChange={(e) => setClient({ phone: e.target.value })}
            type="tel"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="clientAddress">Address</Label>
          <Input
            id="clientAddress"
            value={client.address}
            onChange={(e) => setClient({ address: e.target.value })}
          />
        </div>

        

        <div className="space-y-2">
          <Label htmlFor="clientGstin">GSTIN/UIN</Label>
          <Input
            id="clientGstin"
            value={client.gstin}
            onChange={(e) => setClient({ gstin: e.target.value })}
            maxLength={15}
          />
        </div>
      </CardContent>
    </Card>
  );
}
