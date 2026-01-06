import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerKiller } from "@/components/ServiceWorkerKiller";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexus News",
  description: "Multipolar News Aggregator",
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexus News",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg", // Reusing SVG for now, usually needs PNG but Chrome/Safari often handle it or fallback
  }
};

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
        <ServiceWorkerKiller />
        {children}
      </body>
    </html>
  );
}
