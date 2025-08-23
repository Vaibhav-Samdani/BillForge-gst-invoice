#!/usr/bin/env tsx

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoiceDoc } from "../components/template/Invoice";
import { SUPPORTED_CURRENCIES } from "../lib/types/invoice";
import { writeFileSync } from "fs";
import { join } from "path";
import { Font } from "@react-pdf/renderer";

// Register fonts with absolute paths for testing
const projectRoot = join(__dirname, '..');
Font.register({
  family: "Inter",
  fonts: [
    {
      src: join(projectRoot, "public/fonts/Inter-Regular.ttf"),
      fontStyle: "normal",
      fontWeight: "normal",
    },
    {
      src: join(projectRoot, "public/fonts/Inter-Bold.ttf"),
      fontStyle: "normal",
      fontWeight: "bold",
    },
    {
      src: join(projectRoot, "public/fonts/Inter.ttf"),
      fontStyle: "normal",
      fontWeight: undefined,
    },
  ],
});

// Test data for different currencies
const testInvoices = [
  {
    currency: SUPPORTED_CURRENCIES.find(c => c.code === 'USD')!,
    business: {
      name: "Test Business Inc",
      company: "Test Business Inc",
      address: "123 Business St, New York, NY 10001",
      gstin: "US123456789",
      email: "contact@testbusiness.com",
      phone: "555-0123"
    },
    client: {
      name: "Test Client LLC",
      company: "Test Client LLC",
      address: "456 Client Ave, Los Angeles, CA 90210",
      gstin: "US987654321",
      email: "contact@testclient.com",
      phone: "555-0456"
    },
    items: [
      {
        id: "1",
        description: "Web Development Services",
        hsnSac: "998314",
        quantity: 1,
        rate: 1500.00,
        per: "hour",
        gst: 9,
        amount: 1500.00
      },
      {
        id: "2",
        description: "UI/UX Design",
        hsnSac: "998315",
        quantity: 2,
        rate: 750.00,
        per: "hour",
        gst: 9,
        amount: 1500.00
      }
    ],
    invoiceNumber: "INV-2024-001",
    invoiceDate: "2024-01-15",
    totals: {
      subtotal: 3000.00,
      cgst: 135.00,
      sgst: 135.00,
      igst: 0,
      round_off: 0,
      total: 3270.00
    }
  },
  {
    currency: SUPPORTED_CURRENCIES.find(c => c.code === 'EUR')!,
    business: {
      name: "Euro Business GmbH",
      company: "Euro Business GmbH",
      address: "789 Business Str, Berlin, Germany 10115",
      gstin: "DE123456789",
      email: "contact@eurobusiness.de",
      phone: "+49-30-123456"
    },
    client: {
      name: "Euro Client SARL",
      company: "Euro Client SARL",
      address: "321 Client Rue, Paris, France 75001",
      gstin: "FR987654321",
      email: "contact@euroclient.fr",
      phone: "+33-1-234567"
    },
    items: [
      {
        id: "1",
        description: "Consulting Services",
        hsnSac: "998314",
        quantity: 1,
        rate: 2000.00,
        per: "hour",
        gst: 9,
        amount: 2000.00
      }
    ],
    invoiceNumber: "INV-2024-002",
    invoiceDate: "2024-01-16",
    totals: {
      subtotal: 2000.00,
      cgst: 90.00,
      sgst: 90.00,
      igst: 0,
      round_off: 0,
      total: 2180.00
    }
  },
  {
    currency: SUPPORTED_CURRENCIES.find(c => c.code === 'JPY')!,
    business: {
      name: "Japanese Business Co., Ltd.",
      company: "Japanese Business Co., Ltd.",
      address: "1-2-3 Business, Tokyo, Japan 100-0001",
      gstin: "JP123456789",
      email: "contact@japanbusiness.jp",
      phone: "+81-3-1234-5678"
    },
    client: {
      name: "Japanese Client Corp.",
      company: "Japanese Client Corp.",
      address: "4-5-6 Client, Osaka, Japan 530-0001",
      gstin: "JP987654321",
      email: "contact@japanclient.jp",
      phone: "+81-6-1234-5678"
    },
    items: [
      {
        id: "1",
        description: "Software Development",
        hsnSac: "998314",
        quantity: 1,
        rate: 150000,
        per: "hour",
        gst: 9,
        amount: 150000
      }
    ],
    invoiceNumber: "INV-2024-003",
    invoiceDate: "2024-01-17",
    totals: {
      subtotal: 150000,
      cgst: 6750,
      sgst: 6750,
      igst: 0,
      round_off: 0,
      total: 163500
    }
  }
];

async function testPDFGeneration() {
  console.log("🧪 Testing PDF generation with multiple currencies...\n");

  for (const testInvoice of testInvoices) {
    try {
      console.log(`📄 Generating PDF for ${testInvoice.currency.code} (${testInvoice.currency.symbol})...`);
      
      const pdfBuffer = await renderToBuffer(
        <InvoiceDoc
          business={testInvoice.business}
          client={testInvoice.client}
          items={testInvoice.items}
          invoiceNumber={testInvoice.invoiceNumber}
          invoiceDate={testInvoice.invoiceDate}
          totals={testInvoice.totals}
          currency={testInvoice.currency}
        />
      );

      const filename = `test-invoice-${testInvoice.currency.code.toLowerCase()}.pdf`;
      const filepath = join(__dirname, '..', 'temp', filename);
      
      writeFileSync(filepath, pdfBuffer);
      
      console.log(`✅ Successfully generated: ${filename}`);
      console.log(`   - Currency: ${testInvoice.currency.code} (${testInvoice.currency.symbol})`);
      console.log(`   - Total: ${testInvoice.currency.symbol}${testInvoice.totals.total.toLocaleString()}`);
      console.log(`   - File size: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);
      
    } catch (error) {
      console.error(`❌ Failed to generate PDF for ${testInvoice.currency.code}:`, error);
    }
  }

  console.log("🎉 PDF generation test completed!");
  console.log("📁 Check the 'temp' directory for generated PDF files.");
}

// Run the test
testPDFGeneration().catch(console.error);
