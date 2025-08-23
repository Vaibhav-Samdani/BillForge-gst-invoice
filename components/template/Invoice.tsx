"use client";

import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./style2";
import { BusinessInfo, ClientInfo, InvoiceTotals, LineItem } from "@/lib/store";
import { numberToWords } from "@/lib/utils";
import { Currency, DEFAULT_CURRENCY } from "@/lib/types/invoice";

// Helper function to format currency for PDF display
const formatCurrencyForPDF = (amount: number, currency: Currency): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  });
  return formatter.format(amount);
};

export const InvoiceDoc = ({
  business,
  client,
  items,
  invoiceNumber,
  invoiceDate,
  totals,
  currency = DEFAULT_CURRENCY,
}: {
  business: BusinessInfo;
  client: ClientInfo;
  items: LineItem[];
  invoiceNumber: string;
  invoiceDate: string;
  totals: InvoiceTotals;
  currency?: Currency;
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.companySection}>
          <Text style={styles.companyName}>{business.name || '[Company Name]'}</Text>
          <Text style={styles.companyTagline}>Your Company Slogan</Text>
          <View style={styles.companyDetails}>
            <Text>{business.address || '[Street Address]'}</Text>
            <Text>[City, ST ZIP Code]</Text>
            <Text>Phone: {business.phone || '[Phone]'} Fax: [Fax]</Text>
          </View>
        </View>
        
        <View style={styles.invoiceSection}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <View style={styles.invoiceDetails}>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceLabel}>INVOICE #:</Text>
              <Text style={styles.invoiceValue}>{invoiceNumber || '[100]'}</Text>
            </View>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceLabel}>DATE:</Text>
              <Text style={styles.invoiceValue}>{invoiceDate || '[DATE]'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Billing Information */}
      <View style={styles.billingSection}>
        <View style={styles.billingColumn}>
          <Text style={styles.billingHeader}>TO:</Text>
          <Text style={styles.billingName}>{client.name || '[Recipient Name]'}</Text>
          <View style={styles.billingDetails}>
            <Text>{client.company || '[Company Name]'}</Text>
            <Text>{client.address || '[Street Address]'}</Text>
            <Text>[City, ST ZIP Code]</Text>
            <Text>Phone: {client.phone || '[Phone]'}</Text>
          </View>
        </View>
        
        <View style={styles.billingColumn}>
          <Text style={styles.billingHeader}>SHIP TO:</Text>
          <Text style={styles.billingName}>{client.name || '[Recipient Name]'}</Text>
          <View style={styles.billingDetails}>
            <Text>{client.company || '[Company Name]'}</Text>
            <Text>{client.address || '[Street Address]'}</Text>
            <Text>[City, ST ZIP Code]</Text>
            <Text>Phone: {client.phone || '[Phone]'}</Text>
          </View>
        </View>
      </View>

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <Text style={styles.commentsHeader}>COMMENTS OR SPECIAL INSTRUCTIONS:</Text>
        <Text style={styles.commentsText}>
          (To get started right away, just click any placeholder text (such as this) and start typing to replace it with your own.)
        </Text>
      </View>

      {/* Order Details Table */}
      <View style={styles.orderDetailsSection}>
        <View style={styles.orderDetailsTable}>
          <View style={styles.orderDetailsHeader}>
            <View style={styles.orderDetailsCell}>
              <Text style={styles.orderDetailsHeaderText}>SALESPERSON</Text>
            </View>
            <View style={styles.orderDetailsCell}>
              <Text style={styles.orderDetailsHeaderText}>P.O. NUMBER</Text>
            </View>
            <View style={styles.orderDetailsCell}>
              <Text style={styles.orderDetailsHeaderText}>REQUISITIONER</Text>
            </View>
            <View style={styles.orderDetailsCell}>
              <Text style={styles.orderDetailsHeaderText}>SHIPPED VIA</Text>
            </View>
            <View style={styles.orderDetailsCell}>
              <Text style={styles.orderDetailsHeaderText}>F.O.B. POINT</Text>
            </View>
            <View style={styles.orderDetailsLastCell}>
              <Text style={styles.orderDetailsHeaderText}>TERMS</Text>
            </View>
          </View>
          <View style={styles.orderDetailsRow}>
            <View style={styles.orderDetailsCell}>
              <Text style={styles.orderDetailsValue}></Text>
            </View>
            <View style={styles.orderDetailsCell}>
              <Text style={styles.orderDetailsValue}></Text>
            </View>
            <View style={styles.orderDetailsCell}>
              <Text style={styles.orderDetailsValue}></Text>
            </View>
            <View style={styles.orderDetailsCell}>
              <Text style={styles.orderDetailsValue}></Text>
            </View>
            <View style={styles.orderDetailsCell}>
              <Text style={styles.orderDetailsValue}></Text>
            </View>
            <View style={styles.orderDetailsLastCell}>
              <Text style={styles.orderDetailsValue}>[Due on receipt]</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.itemsTable}>
        {/* Table Header */}
        <View style={styles.itemsHeader}>
          <View style={[styles.itemsHeaderCell, { width: 80 }]}>
            <Text style={styles.itemsHeaderText}>QUANTITY</Text>
          </View>
          <View style={[styles.itemsHeaderCell, { flex: 2 }]}>
            <Text style={styles.itemsHeaderText}>DESCRIPTION</Text>
          </View>
          <View style={[styles.itemsHeaderCell, { width: 100 }]}>
            <Text style={styles.itemsHeaderText}>UNIT PRICE</Text>
          </View>
          <View style={[styles.itemsHeaderCell, { width: 100 }]}>
            <Text style={styles.itemsHeaderText}>TOTAL</Text>
          </View>
        </View>

        {/* Table Body */}
        {items && items.length > 0 ? items.map((item, index) => (
          <View key={index} style={styles.itemsRow}>
            <View style={[styles.itemsCell, { width: 80 }]}>
              <Text style={styles.itemsCellTextCenter}>{item.quantity || 0}</Text>
            </View>
            <View style={[styles.itemsCell, { flex: 2 }]}>
              <Text style={styles.itemsCellText}>{item.description || ''}</Text>
            </View>
            <View style={[styles.itemsCell, { width: 100 }]}>
              <Text style={styles.itemsCellTextRight}>{formatCurrencyForPDF(item.rate || 0, currency)}</Text>
            </View>
            <View style={[styles.itemsCell, { width: 100 }]}>
              <Text style={styles.itemsCellTextRight}>{formatCurrencyForPDF(item.amount || 0, currency)}</Text>
            </View>
          </View>
        )) : (
          // Empty rows for better visual appearance
          <>
            {[...Array(6)].map((_, index) => (
              <View key={index} style={styles.itemsRow}>
                <View style={[styles.itemsCell, { width: 80 }]}>
                  <Text style={styles.itemsCellTextCenter}></Text>
                </View>
                <View style={[styles.itemsCell, { flex: 2 }]}>
                  <Text style={styles.itemsCellText}></Text>
                </View>
                <View style={[styles.itemsCell, { width: 100 }]}>
                  <Text style={styles.itemsCellTextRight}></Text>
                </View>
                <View style={[styles.itemsCell, { width: 100 }]}>
                  <Text style={styles.itemsCellTextRight}></Text>
                </View>
              </View>
            ))}
          </>
        )}
      </View>

      {/* Totals Section */}
      <View style={styles.totalsSection}>
        <View style={styles.totalsTable}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>SUBTOTAL</Text>
            <Text style={styles.totalsValue}>{formatCurrencyForPDF(totals.subtotal || 0, currency)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>SALES TAX</Text>
            <Text style={styles.totalsValue}>{formatCurrencyForPDF((totals.cgst || 0) + (totals.sgst || 0), currency)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>SHIPPING & HANDLING</Text>
            <Text style={styles.totalsValue}>{formatCurrencyForPDF(0, currency)}</Text>
          </View>
          <View style={styles.totalsLastRow}>
            <Text style={styles.totalsFinalLabel}>TOTAL DUE</Text>
            <Text style={styles.totalsFinalValue}>{formatCurrencyForPDF(totals.total || 0, currency)}</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.paymentInstructions}>
          <Text style={styles.paymentHeader}>Make all checks payable to {business.name || '[Company Name]'}</Text>
          <Text style={styles.paymentText}>
            If you have any questions concerning this invoice, contact {business.name || '[Name]'}, {business.phone || '[phone]'}, {business.email || '[email]'}
          </Text>
        </View>
        
        <View style={styles.thankYouSection}>
          <Text style={styles.thankYouText}>THANK YOU FOR YOUR BUSINESS!</Text>
        </View>
      </View>
    </Page>
  </Document>
);