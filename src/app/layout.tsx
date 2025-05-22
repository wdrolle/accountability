import React from 'react';
import { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from 'sonner';
import 'react-calendar/dist/Calendar.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CStudios",
  description: "Receive daily agents verses and inspirational messages",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="/tinymce/tinymce.min.js" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
} 