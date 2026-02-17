import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { AdProvider } from "@/context/AdContext";
import TrafficTracker from "@/components/TrafficTracker"; // Import TrafficTracker

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SpotCountry - Your Global Travel Hub",
  description: "Connect, explore, and plan your trips with SpotCountry.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased min-h-screen bg-gray-50`}
        suppressHydrationWarning
      >
        <QueryProvider>
          {/* 광고 데이터 공급 */}
          <AdProvider>
            <TrafficTracker /> {/* Start Tracking */}
            {children}
          </AdProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
