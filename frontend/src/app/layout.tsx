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
  title: "Hype",
  icons: { icon: "/favicon.ico?v=2", shortcut: "/favicon.ico?v=2", apple: "/favicon.ico?v=2" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" href="/favicon.ico?v=2" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(1000px_500px_at_10%_-20%,rgba(34,211,238,.25),transparent),radial-gradient(900px_450px_at_110%_20%,rgba(45,212,191,.20),transparent),#070b14]" />
        {children}
      </body>
    </html>
  );
}
