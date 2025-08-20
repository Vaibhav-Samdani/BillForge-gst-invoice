"use client";

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { StyleSheet } from "@react-pdf/renderer";
import { Table, TD, TH, TR } from "@ag-media/react-pdf-table";
import { BusinessInfo, ClientInfo, InvoiceTotals, LineItem } from "@/lib/store";
import { formatCurrency, numberToWords } from "@/lib/utils";

// Modern Template Styles
const modernStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 35,
    paddingLeft: 35,
    paddingRight: 35,
    paddingBottom: 65,
    backgroundColor: "#FFFFFF",
  },
  header: {
    backgroundColor: "#2563EB",
    color: "white",
    padding: 20,
    marginBottom: 20,
    borderRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.9,
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 8,
  },
  infoBox: {
    flex: 1,
    marginRight: 10,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2563EB",
    marginBottom: 8,
    borderBottom: "1 solid #E5E7EB",
    paddingBottom: 4,
  },
  infoText: {
    fontSize: 10,
    marginBottom: 3,
    color: "#374151",
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    backgroundColor: "#2563EB",
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
    padding: 8,
  },
  tableCell: {
    fontSize: 9,
    padding: 6,
    borderBottom: "1 solid #E5E7EB",
  },
  tableCellCenter: {
    fontSize: 9,
    padding: 6,
    textAlign: "center",
    borderBottom: "1 solid #E5E7EB",
  },
  tableCellRight: {
    fontSize: 9,
    padding: 6,
    textAlign: "right",
    borderBottom: "1 solid #E5E7EB",
  },
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  totalsBox: {
    width: 250,
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 8,
    border: "1 solid #E5E7EB",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 10,
    color: "#6B7280",
  },
  totalValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1F2937",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTop: "2 solid #2563EB",
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2563EB",
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2563EB",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 35,
    right: 35,
    textAlign: "center",
    fontSize: 9,
    color: "#6B7280",
    borderTop: "1 solid #E5E7EB",
    paddingTop: 10,
  },
  amountInWords: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    border: "1 solid #F59E0B",
  },
  amountInWordsLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#92400E",
    marginBottom: 4,
  },
  amountInWordsText: {
    fontSize: 10,
    color: "#92400E",
  },
});

export const ModernInvoiceTemplate = ({
  business,
  client,
  items,
  invoiceNumber,
  invoiceDate,
  totals,
}: {
  business: BusinessInfo;
  client: ClientInfo;
  items: LineItem[];
  invoiceNumber: string;
  invoiceDate: string;
  totals: InvoiceTotals;
}) => (
  <Document>
    <Page size="A4" style={modernStyles.page}>
      {/* Header */}
      <View style={modernStyles.header}>
        <Text style={modernStyles.title}>INVOICE</Text>
        <Text style={modernStyles.subtitle}>Professional Invoice Template</Text>
      </View>

      {/* Info Section */}
      <View style={modernStyles.infoSection}>
        <View style={modernStyles.infoBox}>
          <Text style={modernStyles.infoTitle}>FROM</Text>
          <Text style={modernStyles.companyName}>{business.name}</Text>
          <Text style={modernStyles.infoText}>{business.address}</Text>
          <Text style={modernStyles.infoText}>GSTIN: {business.gstin}</Text>
          <Text style={modernStyles.infoText}>Email: {business.email}</Text>
          <Text style={modernStyles.infoText}>Phone: +91 {business.phone}</Text>
        </View>
        
        <View style={modernStyles.infoBox}>
          <Text style={modernStyles.infoTitle}>BILL TO</Text>
          <Text style={modernStyles.companyName}>{client.name}</Text>
          <Text style={modernStyles.infoText}>{client.company}</Text>
          <Text style={modernStyles.infoText}>{client.address}</Text>
          <Text style={modernStyles.infoText}>GSTIN: {client.gstin}</Text>
          <Text style={modernStyles.infoText}>Email: {client.email}</Text>
          <Text style={modernStyles.infoText}>Phone: {client.phone}</Text>
        </View>
        
        <View style={modernStyles.infoBox}>
          <Text style={modernStyles.infoTitle}>INVOICE DETAILS</Text>
          <Text style={modernStyles.infoText}>Invoice #: {invoiceNumber}</Text>
          <Text style={modernStyles.infoText}>Date: {invoiceDate}</Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={modernStyles.table}>
        <Table>
          <TR>
            <TH style={modernStyles.tableHeader}>S.No</TH>
            <TH style={modernStyles.tableHeader}>Description</TH>
            <TH style={modernStyles.tableHeader}>HSN/SAC</TH>
            <TH style={modernStyles.tableHeader}>Qty</TH>
            <TH style={modernStyles.tableHeader}>Rate</TH>
            <TH style={modernStyles.tableHeader}>GST%</TH>
            <TH style={modernStyles.tableHeader}>Amount</TH>
          </TR>
          {items.map((item, index) => (
            <TR key={item.id}>
              <TD style={modernStyles.tableCellCenter}>{index + 1}</TD>
              <TD style={modernStyles.tableCell}>{item.description}</TD>
              <TD style={modernStyles.tableCellCenter}>{item.hsnSac}</TD>
              <TD style={modernStyles.tableCellCenter}>{item.quantity} {item.per}</TD>
              <TD style={modernStyles.tableCellRight}>₹{formatCurrency(item.rate)}</TD>
              <TD style={modernStyles.tableCellCenter}>{item.gst}%</TD>
              <TD style={modernStyles.tableCellRight}>₹{formatCurrency(item.amount)}</TD>
            </TR>
          ))}
        </Table>
      </View>

      {/* Totals */}
      <View style={modernStyles.totalsSection}>
        <View style={modernStyles.totalsBox}>
          <View style={modernStyles.totalRow}>
            <Text style={modernStyles.totalLabel}>Subtotal:</Text>
            <Text style={modernStyles.totalValue}>₹{formatCurrency(totals.subtotal)}</Text>
          </View>
          
          {totals.igst > 0 ? (
            <View style={modernStyles.totalRow}>
              <Text style={modernStyles.totalLabel}>IGST:</Text>
              <Text style={modernStyles.totalValue}>₹{formatCurrency(totals.igst)}</Text>
            </View>
          ) : (
            <>
              <View style={modernStyles.totalRow}>
                <Text style={modernStyles.totalLabel}>CGST:</Text>
                <Text style={modernStyles.totalValue}>₹{formatCurrency(totals.cgst)}</Text>
              </View>
              <View style={modernStyles.totalRow}>
                <Text style={modernStyles.totalLabel}>SGST:</Text>
                <Text style={modernStyles.totalValue}>₹{formatCurrency(totals.sgst)}</Text>
              </View>
            </>
          )}
          
          <View style={modernStyles.totalRow}>
            <Text style={modernStyles.totalLabel}>Round Off:</Text>
            <Text style={modernStyles.totalValue}>₹{formatCurrency(totals.round_off)}</Text>
          </View>
          
          <View style={modernStyles.grandTotal}>
            <Text style={modernStyles.grandTotalLabel}>Total:</Text>
            <Text style={modernStyles.grandTotalValue}>₹{formatCurrency(totals.total)}</Text>
          </View>
        </View>
      </View>

      {/* Amount in Words */}
      <View style={modernStyles.amountInWords}>
        <Text style={modernStyles.amountInWordsLabel}>Amount in Words:</Text>
        <Text style={modernStyles.amountInWordsText}>
          {numberToWords(totals.total)} Rupees Only
        </Text>
      </View>

      {/* Footer */}
      <Text style={modernStyles.footer}>
        Thank you for your business! • Generated by BillForge
      </Text>
    </Page>
  </Document>
);
