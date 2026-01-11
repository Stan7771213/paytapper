import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Paytapper — QR-based tipping and small payments",
    template: "%s · Paytapper",
  },
  description:
    "Paytapper is a simple QR-based tipping and small payments platform for waiters, bartenders, guides, drivers and creators in Europe. Powered by Stripe.",
  metadataBase: new URL("https://paytapper.net"),
  openGraph: {
    type: "website",
    url: "https://paytapper.net",
    title: "Paytapper — QR-based tipping and small payments",
    description:
      "Simple QR-based tipping and small payments for waiters, bartenders, guides, drivers and creators in Europe.",
    siteName: "Paytapper",
  },
  robots: {
    index: true,
    follow: true,
  },
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
        {children}
      </body>
    </html>
  );
}
