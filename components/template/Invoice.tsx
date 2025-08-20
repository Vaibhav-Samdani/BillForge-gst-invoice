"use client";

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./style2";
import { Table, TD, TH, TR } from "@ag-media/react-pdf-table";
import { BusinessInfo, ClientInfo, InvoiceTotals, LineItem } from "@/lib/store";
import { formatCurrency, numberToWords } from "@/lib/utils";
import { Currency, DEFAULT_CURRENCY } from "@/lib/types/invoice";

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
    <Page size="A4">
      {/* Title */}
      <View style={styles.title}>
        <Text>INVOICE</Text>
      </View>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.companyName}>{business.name}</Text>
          <Text style={styles.address}>{business.address}</Text>
          <Text>GSTIN/UIN: {business.gstin}</Text>
          <Text>Email : {business.email}</Text>
          <Text>Mo. : +91 {business.phone}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text>
            <Text style={styles.bold}>Invoice No. :</Text> {invoiceNumber}
          </Text>
          <Text>
            <Text style={styles.bold}>Dated:</Text> {invoiceDate}
          </Text>
        </View>
      </View>
      <View style={styles.billedTo}>
        <Text style={styles.bold}>BILLED TO:</Text>
        <Text style={styles.billedToName}>{client.name}</Text>
        <Text>{client.address}</Text>
        {client.gstin?.trim?.() && <Text>GSTIN/UIN: {client.gstin}</Text>}
        {typeof client.email === "string" && client.email.trim() !== "" && (
          <Text>Email: {client.email}</Text>
        )}

        <Text>Mo. : +91 {client.phone}</Text>
      </View>

      {/* Table for the Items */}

      <Table style={styles.table}>
        <TH style={styles.th}>
          <TD style={[styles.auto, styles.td]}>Sl. No</TD>
          <TD style={[styles.td, styles.goods]}>Description of Goods</TD>
          <TD style={[styles.auto, styles.td]}>HSN/SAC</TD>
          <TD style={[styles.quantity, styles.td]}>Quantity</TD>
          <TD style={[styles.auto, styles.td]}>Rate</TD>
          <TD style={[styles.td, styles.amount]}>Amount</TD>
        </TH>

        {items.map((item, index) => (
          <TR key={index}>
            <TD style={[styles.auto, styles.td]}>{index + 1}</TD>
            <TD style={[styles.td, styles.goods]}>{item.description}</TD>
            <TD style={[styles.auto, styles.td]}>{item.hsnSac}</TD>
            <TD style={[styles.quantity, styles.td]}>{item.quantity}</TD>
            <TD style={[styles.auto, styles.td]}>{item.rate}</TD>
            <TD style={[styles.td, styles.amount]}>
              {formatCurrency(item.amount, currency.code)}
            </TD>
          </TR>
        ))}

        <TR
          style={{
            paddingTop: "4px",
            textAlign: "left",
          }}
        >
          <TD style={styles.noBorder} />
          <TD style={styles.noBorder} />
          <TD style={styles.noBorder} />
          <TD style={styles.noBorder} />
          <TD style={[styles.firstColumn, styles.noBorder]}>Subtotal : </TD>
          <TD style={[styles.lastColumn, styles.noBorder, styles.amount]}>
            {formatCurrency(totals.subtotal, currency.code)}
          </TD>
        </TR>
        <TR
          style={{
            paddingTop: "4px",
            textAlign: "left",
          }}
        >
          <TD style={styles.noBorder} />
          <TD style={styles.noBorder} />
          <TD style={styles.noBorder} />
          <TD style={styles.noBorder} />
          <TD style={[styles.firstColumn, styles.noBorder]}>CGST @ 9% : </TD>
          <TD style={[styles.lastColumn, styles.noBorder, styles.amount]}>
            {formatCurrency(totals.cgst, currency.code)}
          </TD>
        </TR>
        <TR
          style={{
            paddingTop: "4px",
            textAlign: "left",
          }}
        >
          <TD style={styles.noBorder} />
          <TD style={styles.noBorder} />
          <TD style={styles.noBorder} />
          <TD style={styles.noBorder} />
          <TD style={[styles.firstColumn, styles.noBorder]}>SGST @ 9% : </TD>
          <TD style={[styles.lastColumn, styles.noBorder, styles.amount]}>
            {formatCurrency(totals.sgst, currency.code)}
          </TD>
        </TR>
        <TR
          style={{
            paddingTop: "4px",
            textAlign: "left",
          }}
        >
          <TD style={styles.noBorder} />
          <TD style={styles.noBorder} />
          <TD style={styles.noBorder} />
          <TD style={styles.noBorder} />
          <TD style={[styles.firstColumn, styles.noBorder]}>Round Off A/c :</TD>
          <TD style={[styles.lastColumn, styles.noBorder, styles.amount]}>
            {formatCurrency(totals.round_off, currency.code)}
          </TD>
        </TR>
        <TR
          style={{
            paddingTop: "4px",
            fontSize: "12px",
            fontWeight: "bold",
            textAlign: "right",
            backgroundColor: "#e6f7e6",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <TD style={styles.noBorder} />
          <TD style={styles.noBorder} />
          <TD style={styles.noBorder} />
          <TD style={styles.noBorder} />
          <TD style={[styles.firstColumn, styles.noBorder]}>Net Total : </TD>
          <TD style={[styles.lastColumn, styles.noBorder, styles.amount]}>
            {formatCurrency(totals.total, currency.code)}
          </TD>
        </TR>
      </Table>

      <View style={styles.footer}>
        <View style={styles.footerDetails}>
          <Text style={{ paddingRight: 10, textAlign: "right" }}>
            E. & O. E.
          </Text>
          <View style={{ textAlign: "left" }}>
            <Text>Total (in words) : </Text>
            <Text
              style={[
                styles.bold,
                {
                  maxLines: 2,
                },
              ]}
            >
              {numberToWords(totals.total, currency.code)}
            </Text>
          </View>
        </View>
        <View style={{ textAlign: "right" }}>
          <Text style={styles.bold}>For {business.name}</Text>
          <Text style={styles.authorizedSignatory}>Authorized Signatory</Text>
        </View>
      </View>
    </Page>
  </Document>
);
