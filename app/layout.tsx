import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { SessionProvider } from '@FO-Enablement-Vivint/magistrate/next';

// Self-hosted at build time (no render-blocking request to Google). Both the Lead
// Tracker and the Manager View read it through --font-sans.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap', axes: ['opsz'] });

export const metadata: Metadata = {
  title: 'SHX Leads Tracker',
  description: 'Lead pipeline, activities, self-gen time and compensation for the SHX team.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
