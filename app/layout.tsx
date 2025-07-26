import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://localhost:${process.env.PORT || 3000}`;
const imageUrl = `${baseUrl}/thumbnail.png`;

export const metadata: Metadata = {
  title: "BillForge - Smart GST Invoice Generator",
  description:
    "Generate professional GST invoices with ease. BillForge is your modern SaaS billing solution – compliant, elegant, and efficient.",
  keywords: [
    "BillForge",
    "GST Invoice Generator",
    "Invoice Builder",
    "GST Billing App",
    "Tax Invoicing",
    "SaaS GST Tool",
    "India GST Invoice",
    "Digital Billing",
    "Create PDF Invoices",
    "Business Billing Software",
  ],
  authors: [
    {
      name: "Vaibhav Samdani",
      url: "https://vaibhav-samdani.github.io/",
    },
  ],
  creator: "Vaibhav Samdani",
  openGraph: {
    title: "BillForge - Smart GST Invoice Generator",
    description:
      "Sleek and modern SaaS platform for generating compliant GST invoices with real-time previews and PDF export.",
    url: baseUrl,
    siteName: "BillForge",
    images: [
      {
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: "BillForge Banner Image",
        type: "image/png",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BillForge - Smart GST Invoice Generator",
    description:
      "Create GST-compliant, professional invoices in seconds with BillForge – The modern solution for Indian businesses.",
    images: [imageUrl],
    creator: "@samdanivaibhav_",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL(baseUrl),
};


export function generateViewport() {
  return {
    themeColor: "#0D0D2D",
    colorScheme: "light",
  };
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
