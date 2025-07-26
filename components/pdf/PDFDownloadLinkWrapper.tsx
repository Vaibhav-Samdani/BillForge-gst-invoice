"use client";
import { PDFDownloadLink, type PDFDownloadLinkProps } from "@react-pdf/renderer";

export default function PDFDownloadLinkWrapper(props: PDFDownloadLinkProps) {
  return <PDFDownloadLink {...props} />;
}