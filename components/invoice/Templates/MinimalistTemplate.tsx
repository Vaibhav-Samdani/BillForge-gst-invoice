"use client";

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { StyleSheet } from "@react-pdf/renderer";
import { Table, TD, TH, TR } from "@ag-media/react-pdf-table";
import { BusinessInfo, ClientInfo, InvoiceTotals, LineItem } from "@/lib/store";
import { formatCurrency, numberToWords } from "@/lib/utils";

// Minimalist Template Styles
const minimalistStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 60,
    backgroundColor: "#FFFFFF",
  },
  header: {
    borderBottom: "3 solid #000000",
    paddingBottom: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "left",
    color: "#000000",
    marginBottom: 5,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  infoBlock: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  text: {
    fontSize: 9,
    color: "#333333",
    marginBottom: 2,
    lineHeight: 1.4,
  },
  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 3,
  },
  tableContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    backgroundColor: "#000000",
    color: "white",
    fontWeight: "bold",
    fontSize: 9,
    padding: 8,
    textAlign: "center",
  },
  tableCell: {
    fontSize: 8,
    padding: 6,
    borderBottom: "1 solid #CCCCCC",
    color: "#333333",
  },
  tableCellCenter: {
    fontSize: 8,
    padding: 6,
    textAlign: "center",
    borderBottom: "1 solid #CCCCCC",
    color: "#333333",
  },
  tableCellRight: {
    fontSize: 8,
    padding: 6,
    textAlign: "right",
    borderBottom: "1 solid #CCCCCC",
    color: "#333333",
  },
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  totalsTable: {
    width: 200,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottom: "1 solid #EEEEEE",
  },
  totalLabel: {
    fontSize: 9,
    color: "#666666",
  },
  totalValue: {
    fontSize: 9,
    color: "#333333",
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTop: "2 solid #000000",
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000000",
  },
  grandTotalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "right",
  },
  amountInWords: {
    marginTop: 25,
    paddingTop: 15,
    borderTop: "1 solid #CCCCCC",
  },
  amountInWordsLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 3,
  },
  amountInWordsText: {
    fontSize: 9,
    color: "#333333",
    fontStyle: "italic",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#888888",
  },
});

export const MinimalistInvoiceTemplate = ({
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
    <Page size="A4" style={minimalistStyles.page}>
      {/* Header */}
      <View style={minimalistStyles.header}>
        <Text style={minimalistStyles.title}>INVOICE</Text>
      </View>

      {/* Invoice Info */}
      <View style={minimalistStyles.infoRow}>
        <View style={minimalistStyles.infoBlock}>
          <Text style={minimalistStyles.sectionTitle}>Invoice Number</Text>
          <Text style={minimalistStyles.text}>{invoiceNumber}</Text>
        </View>
        <View style={minimalistStyles.infoBlock}>
          <Text style={minimalistStyles.sectionTitle}>Date</Text>
          <Text style={minimalistStyles.text}>{invoiceDate}</Text>
        </View>
      </View>

      {/* Business and Client Info */}
      <View style={minimalistStyles.infoRow}>
        <View style={minimalistStyles.infoBlock}>
          <Text style={minimalistStyles.sectionTitle}>From</Text>
          <Text style={minimalistStyles.companyName}>{business.name}</Text>
          <Text style={minimalistStyles.text}>{business.address}</Text>
          <Text style={minimalistStyles.text}>GSTIN: {business.gstin}</Text>
          <Text style={minimalistStyles.text}>{business.email}</Text>
          <Text style={minimalistStyles.text}>+91 {business.phone}</Text>
        </View>
        
        <View style={minimalistStyles.infoBlock}>
          <Text style={minimalistStyles.sectionTitle}>Bill To</Text>
          <Text style={minimalistStyles.companyName}>{client.name}</Text>
          <Text style={minimalistStyles.text}>{client.company}</Text>
          <Text style={minimalistStyles.text}>{client.address}</Text>
          <Text style={minimalistStyles.text}>GSTIN: {client.gstin}</Text>
          <Text style={minimalistStyles.text}>{client.email}</Text>
          <Text style={minimalistStyles.text}>{client.phone}</Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={minimalistStyles.tableContainer}>
        <Table>
          <TR>
            <TH style={minimalistStyles.tableHeader}>#</TH>
            <TH style={minimalistStyles.tableHeader}>Description</TH>
            <TH style={minimalistStyles.tableHeader}>HSN</TH>
            <TH style={minimalistStyles.tableHeader}>Qty</TH>
            <TH style={minimalistStyles.tableHeader}>Rate</TH>
            <TH style={minimalistStyles.tableHeader}>GST%</TH>
            <TH style={minimalistStyles.tableHeader}>Amount</TH>
          </TR>
          {items.map((item, index) => (
            <TR key={item.id}>
              <TD style={minimalistStyles.tableCellCenter}>{index + 1}</TD>
              <TD style={minimalistStyles.tableCell}>{item.description}</TD>
              <TD style={minimalistStyles.tableCellCenter}>{item.hsnSac}</TD>
              <TD style={minimalistStyles.tableCellCenter}>{item.quantity} {item.per}</TD>
              <TD style={minimalistStyles.tableCellRight}>₹{formatCurrency(item.rate)}</TD>
              <TD style={minimalistStyles.tableCellCenter}>{item.gst}%</TD>
              <TD style={minimalistStyles.tableCellRight}>₹{formatCurrency(item.amount)}</TD>
            </TR>
          ))}
        </Table>
      </View>

      {/* Totals */}
      <View style={minimalistStyles.totalsContainer}>
        <View style={minimalistStyles.totalsTable}>
          <View style={minimalistStyles.totalRow}>
            <Text style={minimalistStyles.totalLabel}>Subtotal</Text>
            <Text style={minimalistStyles.totalValue}>₹{formatCurrency(totals.subtotal)}</Text>
          </View>
          
          {totals.igst > 0 ? (
            <View style={minimalistStyles.totalRow}>
              <Text style={minimalistStyles.totalLabel}>IGST</Text>
              <Text style={minimalistStyles.totalValue}>₹{formatCurrency(totals.igst)}</Text>
            </View>
          ) : (
            <>
              <View style={minimalistStyles.totalRow}>
                <Text style={minimalistStyles.totalLabel}>CGST</Text>
                <Text style={minimalistStyles.totalValue}>₹{formatCurrency(totals.cgst)}</Text>
              </View>
              <View style={minimalistStyles.totalRow}>
                <Text style={minimalistStyles.totalLabel}>SGST</Text>
                <Text style={minimalistStyles.totalValue}>₹{formatCurrency(totals.sgst)}</Text>
              </View>
            </>
          )}
          
          <View style={minimalistStyles.totalRow}>
            <Text style={minimalistStyles.totalLabel}>Round Off</Text>
            <Text style={minimalistStyles.totalValue}>₹{formatCurrency(totals.round_off)}</Text>
          </View>
          
          <View style={minimalistStyles.grandTotalRow}>
            <Text style={minimalistStyles.grandTotalLabel}>TOTAL</Text>
            <Text style={minimalistStyles.grandTotalValue}>₹{formatCurrency(totals.total)}</Text>
          </View>
        </View>
      </View>

      {/* Amount in Words */}
      <View style={minimalistStyles.amountInWords}>
        <Text style={minimalistStyles.amountInWordsLabel}>Amount in Words</Text>
        <Text style={minimalistStyles.amountInWordsText}>
          {numberToWords(totals.total)} Rupees Only
        </Text>
      </View>

      {/* Footer */}
      <Text style={minimalistStyles.footer}>
        Generated by BillForge
      </Text>
    </Page>
  </Document>
);
