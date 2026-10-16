import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LedgerLoom | Autonomous SME Finance Copilot',
  description:
    'FinTechathon 2026 - International Track (Topic E: SME Finance Copilot). Deterministic Accounting Engine, Real Excel Database, and AI CFO for Small Businesses.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
