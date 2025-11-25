import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Church, Users } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Church Directory - Manage Churches & Clergy",
  description: "Church directory management system for tracking churches, clergy members, and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <Church className="h-6 w-6" />
                  <span className="font-bold text-xl">Church Directory</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/churches"
                  className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Church className="h-4 w-4" />
                  Churches
                </Link>
                <Link
                  href="/clergy"
                  className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Users className="h-4 w-4" />
                  Clergy
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
