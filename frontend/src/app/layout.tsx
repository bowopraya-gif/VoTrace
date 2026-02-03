import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import QueryProvider from '@/providers/QueryProvider';
import { AuthInitializer } from '@/components/auth/AuthInitializer';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VoTrace - Master Your Vocabulary",
  description: "Track, learn, and master English vocabulary with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AuthInitializer />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
