import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import Navigation from "@/components/Navigation";
import DataBackup from "@/components/DataBackup";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Huseyn & Karla — Our World",
  description: "Our private map, gallery, and travel plans — just for us",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0c0c10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${playfair.variable} h-full dark`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col antialiased bg-background text-text">
        <Navigation />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <footer className="hidden md:flex items-center justify-center gap-4 py-3 border-t border-border text-xs text-text-muted">
          <span>Huseyn & Karla — our little corner of the world</span>
          <DataBackup />
        </footer>
      </body>
    </html>
  );
}
