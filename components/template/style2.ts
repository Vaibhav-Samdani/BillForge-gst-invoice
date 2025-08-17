import { Font, StyleSheet } from "@react-pdf/renderer";

// type FontWeight = 'normal' | 'bold' | 'light' | 'medium' | 'semibold' | 'extrabold' | 'black' | undefined;
// type FontStyle = 'normal' | 'italic' | 'oblique' | undefined;

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "/fonts/Inter-Regular.ttf", // relative to public folder
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
  // component wise styles
  bold: {
    fontWeight: "bold",
  },

  page: {
    margin: "0 auto",
    padding: "20px",
    boxSizing: "border-box",
    position: "relative",
    backgroundColor: "white",
    border: "1px solid #ccc",
    fontFamily: "Inter",
  },
  title: {
    fontSize: "24px",
    textAlign: "center",
    fontWeight: "bold",
    padding: 10,
    fontFamily: "Inter",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 0,
    display: "flex",
    flexDirection: "row",
    minHeight: "150px",
    width: "100%",
    fontFamily: "Inter",
  },

  headerLeft: {
    padding: "12px 16px 10px 16px",
    width: "50%",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    border: "1px solid #e0e0e0",
    height: "100%",
    fontSize: "12px",
    fontFamily: "Inter",
  },
  companyName: {
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: "2px",
    fontSize: "16px",
    fontFamily: "Inter",
  },
  address: {
    fontSize: "12px",
    marginBottom: "2px",
    fontFamily: "Inter",
  },

  headerRight: {
    textAlign: "right",
    padding: "12px 16px 10px 16px",
    border: "1px solid #e0e0e0",
    fontSize: "12px",
    borderLeft: "0px solid #ccc",
    width: "50%",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    height: "100%",
    fontFamily: "Inter",
  },
  billedTo: {
    padding: "12px 16px",
    border: "1px solid #e0e0e0",
    borderTop: "0px solid #ccc",
    fontSize: "12px",
    margin: "0 20px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    fontFamily: "Inter",
  },
  billedToName: {
    margin: "2px 0",
    textTransform: "uppercase",
    fontFamily: "Inter",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "10px",
    padding: "0px 21px",
    border: "1px solid #e0e0e0",
    fontFamily: "Inter",
  },
  th: {
    // padding: "6px",
    fontWeight: "bold",
    textAlign: "center",
    border: "0px solid #e0e0e0",
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#f3f3f3",
    fontFamily: "Inter",
  },
  td: {
    border: "1px solid #e0e0e0",
    padding: "4px",
    textAlign: "left",
    whiteSpace: "nowrap",
    fontFamily: "Inter",
  },
  auto: {
    width: "auto",
  },
  goods: {
    minWidth: "85px",
  },
  quantity: {
    minWidth: "25px",
    maxWidth: "55px",
  },
  noBorder: {
    border: "0px solid #e0e0e0",
  },
  firstColumn: {
    minWidth: "30px",
    textAlign: "left",
    fontFamily: "Inter",
    padding: "4px",
  },
  lastColumn: {
    textAlign: "left",
    fontFamily: "Inter",
    padding: "4px",
  },
  amount: {
    fontWeight: "bold",
    fontFamily: "Inter",
    minWidth: "100px",
    maxWidth: "100px",
    textAlign: "right",
  },
  footer: {
    paddingHorizontal: "20px",
    paddingVertical: "10px",
    // marginTop: 32,
    fontSize: "10px",
    fontFamily: "Inter",
  },
  footerDetails: {
    marginBottom: 18,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    fontFamily: "Inter",
    gap: "10px",

  },
  signature: {
    textAlign: "right",
    marginTop: 40,
  },
  authorizedSignatory: {
    marginTop: 50,
  },
});
