'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  X,
  Download,
  Printer,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { BusinessProfile, Transaction } from '@/lib/types';
import { SupportedLanguage, getTranslation } from '@/lib/i18n';
import { SupportedCurrency, convertCurrency } from '@/lib/currency';

interface StatementDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile;
  transactions: Transaction[];
  currentLanguage: SupportedLanguage;
  currentCurrency?: SupportedCurrency;
}

export const StatementDownloadModal: React.FC<StatementDownloadModalProps> = ({
  isOpen,
  onClose,
  profile,
  transactions,
  currentLanguage,
  currentCurrency = 'BDT',
}) => {
  const [timeframe, setTimeframe] = useState<'current_month' | 'previous_month' | 'last_30_days' | 'this_year' | 'custom'>('current_month');
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>('2026-10-31');

  const t = (key: string) => getTranslation(currentLanguage, key);

  const conv = (amount: number) => {
    return convertCurrency(amount, 'BDT', currentCurrency);
  };

  // Filtered transactions based on selected timeframe
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = tx.date; // Format YYYY-MM-DD
      if (timeframe === 'current_month') {
        return txDate.startsWith('2026-10');
      } else if (timeframe === 'previous_month') {
        return txDate.startsWith('2026-09');
      } else if (timeframe === 'last_30_days') {
        return txDate >= '2026-09-17' && txDate <= '2026-10-17';
      } else if (timeframe === 'this_year') {
        return txDate.startsWith('2026');
      } else if (timeframe === 'custom') {
        if (startDate && endDate) {
          return txDate >= startDate && txDate <= endDate;
        }
        return true;
      }
      return true;
    });
  }, [transactions, timeframe, startDate, endDate]);

  // Financial Summary for the period
  const summary = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;
    for (const tx of filteredTransactions) {
      if (tx.status === 'approved') {
        if (tx.type === 'income') {
          totalInflow += tx.amount;
        } else {
          totalOutflow += tx.amount;
        }
      }
    }
    const netBalance = totalInflow - totalOutflow;
    return {
      totalInflow,
      totalOutflow,
      netBalance,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Export to CSV
  const handleDownloadCSV = () => {
    const headers = ['ID', 'Date', 'Type', 'Category', 'Party/Client', 'Description', 'Amount (BDT)', 'Payment Method', 'Status', 'Edited'];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.date,
      tx.type.toUpperCase(),
      tx.category,
      `"${tx.partyName || '-'}"`,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.amount,
      tx.paymentMethod,
      tx.status,
      tx.isEdited ? 'YES (Edited)' : 'NO',
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Statement_${profile.businessName.replace(/\s+/g, '_')}_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printable Statement Trigger
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to print financial statement.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Financial Statement - ${profile.businessName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #0f172a; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; color: #1e1b4b; }
          .subtitle { font-size: 13px; color: #64748b; }
          .meta { text-align: right; font-size: 12px; color: #475569; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
          .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .summary-card h4 { margin: 0; font-size: 11px; text-transform: uppercase; color: #64748b; }
          .summary-card p { margin: 5px 0 0; font-size: 18px; font-weight: bold; }
          .text-green { color: #059669; }
          .text-red { color: #dc2626; }
          .text-blue { color: #2563eb; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 15px; }
          th { background: #f1f5f9; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; font-weight: bold; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
          .text-right { text-align: right; }
          .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .badge-income { background: #dcfce7; color: #15803d; }
          .badge-expense { background: #fee2e2; color: #b91c1c; }
          .badge-edit { background: #fef3c7; color: #92400e; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
          .sign-box { border-top: 1px dashed #94a3b8; width: 180px; text-align: center; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${profile.businessName}</div>
            <div class="subtitle">${profile.industry} • ${profile.workerCount} Workers</div>
            <div class="subtitle">Autonomous Accounting Engine & LedgerLoom Financial Statement</div>
          </div>
          <div class="meta">
            <div><strong>Period:</strong> ${timeframe.replace('_', ' ').toUpperCase()}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
            <div><strong>Currency:</strong> ${currentCurrency}</div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <h4>Total Inflow (মোট জমা)</h4>
            <p class="text-green">+${conv(summary.totalInflow).toLocaleString()} ${currentCurrency}</p>
          </div>
          <div class="summary-card">
            <h4>Total Outflow (মোট খরচ)</h4>
            <p class="text-red">-${conv(summary.totalOutflow).toLocaleString()} ${currentCurrency}</p>
          </div>
          <div class="summary-card">
            <h4>Net Operating Balance (উদ্বৃত্ত)</h4>
            <p class="text-blue">${summary.netBalance >= 0 ? '+' : ''}${conv(summary.netBalance).toLocaleString()} ${currentCurrency}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Party / Client</th>
              <th>Description</th>
              <th class="text-right">Amount (${currentCurrency})</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.map((tx) => `
              <tr>
                <td style="font-family: monospace;">${tx.id}</td>
                <td>${tx.date}</td>
                <td><span class="badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}">${tx.type.toUpperCase()}</span></td>
                <td>${tx.category}</td>
                <td>${tx.partyName || '-'}</td>
                <td>${tx.description} ${tx.isEdited ? '<span class="badge badge-edit">[Edited]</span>' : ''}</td>
                <td class="text-right" style="font-weight: bold; color: ${tx.type === 'income' ? '#059669' : '#1e293b'};">
                  ${tx.type === 'income' ? '+' : '-'}${conv(tx.amount).toLocaleString()}
                </td>
                <td>${tx.status.toUpperCase()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>Generated securely via LedgerLoom SME Copilot (Deterministic Compliance Record)</div>
          <div class="sign-box">Authorized Signature / Seal</div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="statement-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="statement-modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center shadow-lg">
                  <FileText className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight">
                    {currentLanguage === 'bn' ? 'আর্থিক স্টেটমেন্ট ডাউনলোড' : 'Download Financial Statement'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {profile.businessName} • {profile.industry}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
              {/* Step 1: Select Period */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {currentLanguage === 'bn' ? '১. সময়কাল বা মাস পছন্দ করুন' : '1. Select Timeframe or Month'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'current_month', label: currentLanguage === 'bn' ? 'চলতি মাস (অক্টোবর)' : 'Current Month (Oct)' },
                    { id: 'previous_month', label: currentLanguage === 'bn' ? 'গত মাস (সেপ্টেম্বর)' : 'Previous Month (Sep)' },
                    { id: 'last_30_days', label: currentLanguage === 'bn' ? 'বিগত ৩০ দিন' : 'Last 30 Days' },
                    { id: 'this_year', label: currentLanguage === 'bn' ? 'চলতি অর্থবছর (২০২৬)' : 'This Fiscal Year' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTimeframe(opt.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition text-center ${
                        timeframe === opt.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTimeframe('custom')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      timeframe === 'custom'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    📅 {currentLanguage === 'bn' ? 'নির্দিষ্ট তারিখ নির্বাচন (Custom Range)' : 'Custom Date Range'}
                  </button>
                </div>

                {timeframe === 'custom' && (
                  <div className="mt-3 grid grid-cols-2 gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600">হতে (From)</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600">পর্যন্ত (To)</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Statement Preview Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <span>{currentLanguage === 'bn' ? 'স্টেটমেন্ট প্রিভিউ সামারি' : 'Statement Preview Summary'}</span>
                  <span className="text-indigo-600 font-bold">{summary.count} {currentLanguage === 'bn' ? 'টি লেনদেন' : 'Entries'}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-medium">
                      {currentLanguage === 'bn' ? 'মোট জমা (Inflow)' : 'Total Inflow'}
                    </div>
                    <div className="text-sm sm:text-base font-bold text-emerald-600 mt-0.5">
                      +{conv(summary.totalInflow).toLocaleString()} {currentCurrency}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-medium">
                      {currentLanguage === 'bn' ? 'মোট খরচ (Outflow)' : 'Total Outflow'}
                    </div>
                    <div className="text-sm sm:text-base font-bold text-rose-600 mt-0.5">
                      -{conv(summary.totalOutflow).toLocaleString()} {currentCurrency}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-medium">
                      {currentLanguage === 'bn' ? 'নিট উদ্বৃত্ত (Net)' : 'Net Surplus'}
                    </div>
                    <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                      {summary.netBalance >= 0 ? '+' : ''}{conv(summary.netBalance).toLocaleString()} {currentCurrency}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Download & Print Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition active:scale-98"
                >
                  <Printer className="w-4 h-4" />
                  <span>{currentLanguage === 'bn' ? 'প্রিন্ট / অফিশিয়াল PDF স্টেটমেন্ট' : 'Print / Official PDF Statement'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>{currentLanguage === 'bn' ? 'এক্সেল / CSV ফাইল ডাউনলোড' : 'Download CSV Spreadsheet'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
