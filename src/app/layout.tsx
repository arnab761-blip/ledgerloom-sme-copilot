import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LedgerLoom | Autonomous SME Finance Copilot',
  description:
    'FinTechathon 2026 - International Track (Topic E: SME Finance Copilot). Deterministic Accounting Engine, Real Excel Database, and AI CFO for Small Businesses.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 0.5,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="w-full max-w-full overflow-x-hidden">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased w-full max-w-full overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
