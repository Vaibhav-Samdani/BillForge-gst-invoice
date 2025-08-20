"use client";

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { StyleSheet } from "@react-pdf/renderer";
import { Table, TD, TH, TR } from "@ag-media/react-pdf-table";
import { BusinessInfo, ClientInfo, InvoiceTotals, LineItem } from "@/lib/store";
import { formatCurrency, numberToWords } from "@/lib/utils";

// Creative Template Styles
const creativeStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 0,
    backgroundColor: "#FFFFFF",
  },
  headerBanner: {
    backgroundColor: "#8B5CF6",
    backgroundImage: "linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%)",
    height: 120,
    paddingTop: 30,
    paddingHorizontal: 40,
    color: "white",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#E9D5FF",
    textAlign: "center",
  },
  contentArea: {
    padding: 40,
  },
  infoGrid: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 12,
    borderLeft: "4 solid #8B5CF6",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardText: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 3,
    lineHeight: 1.5,
  },
  companyName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 5,
  },
  invoiceDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    backgroundColor: "#8B5CF6",
    padding: 15,
    borderRadius: 8,
    color: "white",
  },
  invoiceLabel: {
    fontSize: 10,
    color: "#E9D5FF",
    marginBottom: 2,
  },
  invoiceValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  tableWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    border: "1 solid #E2E8F0",
    marginBottom: 25,
  },
  tableHeader: {
    backgroundColor: "#8B5CF6",
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
    padding: 10,
    textAlign: "center",
  },
  tableCell: {
    fontSize: 9,
    padding: 8,
    borderBottom: "1 solid #F1F5F9",
    color: "#334155",
  },
  tableCellCenter: {
    fontSize: 9,
    padding: 8,
    textAlign: "center",
    borderBottom: "1 solid #F1F5F9",
    color: "#334155",
  },
  tableCellRight: {
    fontSize: 9,
    padding: 8,
    textAlign: "right",
    borderBottom: "1 solid #F1F5F9",
    color: "#334155",
  },
  alternateRow: {
    backgroundColor: "#F8FAFC",
  },
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsCard: {
    width: 280,
    backgroundColor: "#F8FAFC",
    padding: 20,
    borderRadius: 12,
    border: "2 solid #E2E8F0",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottom: "1 solid #E2E8F0",
  },
  totalLabel: {
    fontSize: 10,
    color: "#64748B",
  },
  totalValue: {
    fontSize: 10,
    color: "#334155",
    fontWeight: "bold",
  },
  grandTotalSection: {
    backgroundColor: "#8B5CF6",
    margin: -20,
    marginTop: 15,
    padding: 15,
    borderRadius: 8,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  amountInWordsSection: {
    marginTop: 25,
    backgroundColor: "#FEF3C7",
    padding: 15,
    borderRadius: 12,
    borderLeft: "4 solid #F59E0B",
  },
  amountInWordsTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#92400E",
    marginBottom: 5,
  },
  amountInWordsText: {
    fontSize: 10,
    color: "#92400E",
    fontStyle: "italic",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#8B5CF6",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
  },
});

export const CreativeInvoiceTemplate = ({
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
    <Page size="A4" style={creativeStyles.page}>
      {/* Header Banner */}
      <View style={creativeStyles.headerBanner}>
        <Text style={creativeStyles.title}>INVOICE</Text>
        <Text style={creativeStyles.subtitle}>Professional • Creative • Modern</Text>
      </View>

      <View style={creativeStyles.contentArea}>
        {/* Invoice Details */}
        <View style={creativeStyles.invoiceDetails}>
          <View>
            <Text style={creativeStyles.invoiceLabel}>Invoice Number</Text>
            <Text style={creativeStyles.invoiceValue}># {invoiceNumber}</Text>
          </View>
          <View>
            <Text style={creativeStyles.invoiceLabel}>Invoice Date</Text>
            <Text style={creativeStyles.invoiceValue}>{invoiceDate}</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={creativeStyles.infoGrid}>
          <View style={creativeStyles.infoCard}>
            <Text style={creativeStyles.cardTitle}>Billed From</Text>
            <Text style={creativeStyles.companyName}>{business.name}</Text>
            <Text style={creativeStyles.cardText}>{business.address}</Text>
            <Text style={creativeStyles.cardText}>GSTIN: {business.gstin}</Text>
            <Text style={creativeStyles.cardText}>Email: {business.email}</Text>
            <Text style={creativeStyles.cardText}>Phone: +91 {business.phone}</Text>
          </View>
          
          <View style={creativeStyles.infoCard}>
            <Text style={creativeStyles.cardTitle}>Billed To</Text>
            <Text style={creativeStyles.companyName}>{client.name}</Text>
            <Text style={creativeStyles.cardText}>{client.company}</Text>
            <Text style={creativeStyles.cardText}>{client.address}</Text>
            <Text style={creativeStyles.cardText}>GSTIN: {client.gstin}</Text>
            <Text style={creativeStyles.cardText}>Email: {client.email}</Text>
            <Text style={creativeStyles.cardText}>Phone: {client.phone}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={creativeStyles.tableWrapper}>
          <Table>
            <TR>
              <TH style={creativeStyles.tableHeader}>#</TH>
              <TH style={creativeStyles.tableHeader}>Description</TH>
              <TH style={creativeStyles.tableHeader}>HSN/SAC</TH>
              <TH style={creativeStyles.tableHeader}>Qty</TH>
              <TH style={creativeStyles.tableHeader}>Rate</TH>
              <TH style={creativeStyles.tableHeader}>GST%</TH>
              <TH style={creativeStyles.tableHeader}>Amount</TH>
            </TR>
            {items.map((item, index) => (
              <TR key={item.id}>
                <TD style={creativeStyles.tableCellCenter}>{index + 1}</TD>
                <TD style={creativeStyles.tableCell}>{item.description}</TD>
                <TD style={creativeStyles.tableCellCenter}>{item.hsnSac}</TD>
                <TD style={creativeStyles.tableCellCenter}>{item.quantity} {item.per}</TD>
                <TD style={creativeStyles.tableCellRight}>₹{formatCurrency(item.rate)}</TD>
                <TD style={creativeStyles.tableCellCenter}>{item.gst}%</TD>
                <TD style={creativeStyles.tableCellRight}>₹{formatCurrency(item.amount)}</TD>
              </TR>
            ))}
          </Table>
        </View>

        {/* Totals */}
        <View style={creativeStyles.totalsSection}>
          <View style={creativeStyles.totalsCard}>
            <View style={creativeStyles.totalRow}>
              <Text style={creativeStyles.totalLabel}>Subtotal</Text>
              <Text style={creativeStyles.totalValue}>₹{formatCurrency(totals.subtotal)}</Text>
            </View>
            
            {totals.igst > 0 ? (
              <View style={creativeStyles.totalRow}>
                <Text style={creativeStyles.totalLabel}>IGST</Text>
                <Text style={creativeStyles.totalValue}>₹{formatCurrency(totals.igst)}</Text>
              </View>
            ) : (
              <>
                <View style={creativeStyles.totalRow}>
                  <Text style={creativeStyles.totalLabel}>CGST</Text>
                  <Text style={creativeStyles.totalValue}>₹{formatCurrency(totals.cgst)}</Text>
                </View>
                <View style={creativeStyles.totalRow}>
                  <Text style={creativeStyles.totalLabel}>SGST</Text>
                  <Text style={creativeStyles.totalValue}>₹{formatCurrency(totals.sgst)}</Text>
                </View>
              </>
            )}
            
            <View style={creativeStyles.totalRow}>
              <Text style={creativeStyles.totalLabel}>Round Off</Text>
              <Text style={creativeStyles.totalValue}>₹{formatCurrency(totals.round_off)}</Text>
            </View>
            
            <View style={creativeStyles.grandTotalSection}>
              <View style={creativeStyles.grandTotalRow}>
                <Text style={creativeStyles.grandTotalLabel}>TOTAL</Text>
                <Text style={creativeStyles.grandTotalValue}>₹{formatCurrency(totals.total)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Amount in Words */}
        <View style={creativeStyles.amountInWordsSection}>
          <Text style={creativeStyles.amountInWordsTitle}>Amount in Words</Text>
          <Text style={creativeStyles.amountInWordsText}>
            {numberToWords(totals.total)} Rupees Only
          </Text>
        </View>

        {/* Footer */}
        <Text style={creativeStyles.footer}>
          Thank you for choosing us! • Powered by BillForge • Visit us again soon
        </Text>
      </View>
    </Page>
  </Document>
);
