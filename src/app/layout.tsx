import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Mews Accounting",
  description: "Connect Mews PMS with your accounting system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased bg-slate-50`}>
        <Sidebar />
        <main className="ml-64 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
