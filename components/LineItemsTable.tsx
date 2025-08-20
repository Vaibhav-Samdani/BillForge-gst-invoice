"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import useInvoiceStore from "@/lib/store";
import { Label } from "@/components/ui/label";
import CurrencyDisplay from "@/components/CurrencyDisplay";

export default function LineItemsTable() {
  const items = useInvoiceStore((state) => state.items);
  const addItem = useInvoiceStore((state) => state.addItem);
  const updateItem = useInvoiceStore((state) => state.updateItem);
  const removeItem = useInvoiceStore((state) => state.removeItem);
  const sameGst = useInvoiceStore((state) => state.sameGst);
  // const setSameGst = useInvoiceStore((state) => state.setSameGst);
  const globalGst = useInvoiceStore((state) => state.globalGst);
  const setGlobalGst = useInvoiceStore((state) => state.setGlobalGst);
  const selectedCurrency = useInvoiceStore((state) => state.selectedCurrency);

  return (
    <div className="overflow-hidden border rounded-lg">
      <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-white border-b">
        <h2 className="text-lg font-semibold">Items</h2>
        <div className="flex flex-col lg:flex-row items-center space-x-4">
          <div className="flex items-center space-x-2">
            {/* <Switch
              id="same-gst"
              checked={sameGst}
              onCheckedChange={setSameGst}
            /> */}
            <Label htmlFor="same-gst">Apply same GST to all items</Label>
          </div>
          {sameGst && (
            <div className="flex items-center space-x-2">
              <Label>GST %</Label>
              <Input
                type="number"
                value={globalGst}
                onChange={(e) => setGlobalGst(Number(e.target.value))}
                className="w-20"
                min={0}
                max={100}
              />
            </div>
          )}
          <Button onClick={addItem}>Add Item</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Description</TableHead>
            <TableHead className="w-[100px]">HSN/SAC</TableHead>
            <TableHead className="w-[80px]">Qty</TableHead>
            <TableHead className="w-[100px]">Rate ({selectedCurrency.symbol})</TableHead>
            <TableHead className="w-[80px]">Per</TableHead>
            {!sameGst && <TableHead className="w-[100px]">GST (%)</TableHead>}
            <TableHead className="w-[120px]">Amount ({selectedCurrency.symbol})</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Input
                  placeholder="Description/Product Name"
                  value={item.description}
                  className="min-w-30"
                  onChange={(e) =>
                    updateItem(item.id, { description: e.target.value })
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  placeholder="HSN/SAC"
                  value={item.hsnSac}
                  className="min-w-20"
                  onChange={(e) =>
                    updateItem(item.id, { hsnSac: e.target.value })
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  placeholder="Quantity"
                  type="number"
                  className="min-w-20"
                  value={item.quantity}
                  onChange={(e) => {
                    updateItem(item.id, {
                      quantity: Number(e.target.value),
                    });
                  }}
                />
              </TableCell>
              <TableCell>
                <Input
                  placeholder="Rate"
                  type="number"
                  className="min-w-20"
                  value={item.rate}
                  onChange={(e) =>
                    updateItem(item.id, {
                      rate: Number(e.target.value),
                    })
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  placeholder="PER"
                  value={item.per}
                  className="min-w-20"
                  onChange={(e) => updateItem(item.id, { per: e.target.value })}
                />
              </TableCell>
              {!sameGst && (
                <TableCell>
                  <Input
                    type="number"
                    placeholder="GST"
                    value={sameGst ? globalGst : item.gst}
                    onChange={(e) =>
                      updateItem(item.id, { gst: Number(e.target.value) })
                    }
                    disabled={sameGst}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">
                <CurrencyDisplay 
                  amount={item.amount} 
                  currency={selectedCurrency}
                  size="sm"
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
