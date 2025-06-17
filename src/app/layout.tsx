import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavSidebar from "../components/ui/NavSidebar";
import { Toaster } from "sonner";
import AppLegalNotice from '../components/AppLegalNotice';
import ErrorBoundary from '../components/ErrorBoundary';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Golden Lap Member Creator",
  description: "Create members for Golden Lap",
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
        <ErrorBoundary>
          <NavSidebar />
          {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          offset={96}
          toastOptions={{
            style: {
              fontFamily: 'Figtree, Inter, sans-serif',
              fontWeight: 700,
              borderRadius: 14,
              boxShadow: '0 4px 16px rgba(52, 79, 58, 0.13)',
              fontSize: '1.08rem',
              padding: '1.1em 1.5em',
              minWidth: 320,
              maxWidth: 420,
            },
            className: 'gl-toast',
            duration: 6000,
          }}
        />
          <footer>
            <AppLegalNotice />
          </footer>
        </ErrorBoundary>
      </body>
    </html>
  );
}
