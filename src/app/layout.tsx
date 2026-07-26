import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "WiFi Heat Map",
  description: "Walk around, scan each room, and track WiFi signal strength.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-2xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-semibold">
              WiFi Heat Map
            </Link>
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
              Rooms
            </Link>
            <Link href="/history" className="text-sm text-slate-600 hover:text-slate-900">
              History
            </Link>
            <Link href="/settings" className="text-sm text-slate-600 hover:text-slate-900">
              Settings
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
