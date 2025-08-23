import { Font, StyleSheet } from '@react-pdf/renderer';

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "/fonts/Inter-Regular.ttf",
      fontStyle: "normal",
      fontWeight: "normal",
    },
    {
      src: "/fonts/Inter-Bold.ttf",
      fontStyle: "normal",
      fontWeight: "bold",
    },
    {
      src: "/fonts/Inter-Variable.ttf",
      fontStyle: "normal",
      fontWeight: undefined,
    },
  ],
});

export const styles = StyleSheet.create({
  // Page Layout
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 40,
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
  },

  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },

  // Company Info (Left Side)
  companySection: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  companyTagline: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  companyDetails: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4,
  },

  // Invoice Title & Details (Right Side)
  invoiceSection: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    letterSpacing: 1,
  },
  invoiceDetails: {
    alignItems: 'flex-end',
  },
  invoiceDetailRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'center',
  },
  invoiceLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginRight: 8,
    minWidth: 80,
    textAlign: 'right',
  },
  invoiceValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
  },

  // Billing Section
  billingSection: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 40,
  },
  billingColumn: {
    flex: 1,
  },
  billingHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  billingName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  billingDetails: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.4,
  },

  // Comments Section
  commentsSection: {
    marginBottom: 25,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  commentsHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  commentsText: {
    fontSize: 8,
    color: '#6b7280',
    fontStyle: 'italic',
  },

  // Order Details Section
  orderDetailsSection: {
    marginBottom: 20,
  },
  orderDetailsTable: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  orderDetailsHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  orderDetailsCell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  orderDetailsLastCell: {
    flex: 1,
    padding: 8,
  },
  orderDetailsHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  orderDetailsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    minHeight: 30,
  },
  orderDetailsValue: {
    fontSize: 9,
    color: '#4b5563',
    textAlign: 'center',
  },

  // Items Table
  itemsTable: {
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  itemsHeader: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    paddingVertical: 12,
  },
  itemsHeaderCell: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  itemsHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  itemsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    minHeight: 35,
    alignItems: 'center',
  },
  itemsCell: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  itemsCellText: {
    fontSize: 9,
    color: '#374151',
  },
  itemsCellTextCenter: {
    fontSize: 9,
    color: '#374151',
    textAlign: 'center',
  },
  itemsCellTextRight: {
    fontSize: 9,
    color: '#374151',
    textAlign: 'right',
  },

  // Totals Section
  totalsSection: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  totalsTable: {
    width: 250,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  totalsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  totalsLastRow: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  totalsLabel: {
    flex: 1,
    fontSize: 9,
    color: '#4b5563',
    textTransform: 'uppercase',
  },
  totalsValue: {
    fontSize: 10,
    color: '#111827',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  totalsFinalLabel: {
    flex: 1,
    fontSize: 11,
    color: '#ffffff',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  totalsFinalValue: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'right',
    fontWeight: 'bold',
  },

  // Footer Section
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  paymentInstructions: {
    marginBottom: 20,
  },
  paymentHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  paymentText: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.4,
  },

  // Thank You Section
  thankYouSection: {
    textAlign: 'center',
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  thankYouText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Utility Classes
  bold: {
    fontWeight: 'bold',
  },
  center: {
    textAlign: 'center',
  },
  right: {
    textAlign: 'right',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
