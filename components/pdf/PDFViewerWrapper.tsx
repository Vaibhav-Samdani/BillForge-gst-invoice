import { PDFViewer, type PDFViewerProps } from "@react-pdf/renderer";

export default function PDFViewerWrapper(props: PDFViewerProps) {
  return <PDFViewer {...props} />;
}